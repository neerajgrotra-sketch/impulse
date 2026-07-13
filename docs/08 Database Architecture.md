# 08 · Database Architecture — Schema, Storage & Privacy-at-Rest

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define how Impulse stores the user model — the schema for the canonical aggregates, how Memory is stored and retrieved, and how we honour the Covenant at rest. This document owns *persistence*: tables, keys, encryption, retention, deletion, the audit trail, and the offline-first sync contract. It does not own the engines (`04 AI Brain`) or the module boundaries (`12 Backend Architecture.md`); it makes them storable.

Storage is where principle #7 — **"Earn the right to hold this data"** — stops being a slogan and becomes bytes on disk. A coach that understands you must remember you, and memory of the most intimate kind (your temptations, your lapses, your Future Self) is the most dangerous thing we hold. So the schema is designed around two truths at once: the data must be *rich enough to coach* and *disposable enough to honour the Covenant* (`15 Constitution.md`).

---

## 1. Why PostgreSQL is the system of record

Canon §6 fixes PostgreSQL + pgvector as our data layer. The reasoning we commit to here:

- **Our data is relational.** Identity → Decision → Outcome → CoachingSession → Message is a graph of foreign keys with real invariants (an Outcome cannot exist without a Decision; a Message cannot exist without a Session). A document store would let us write orphans; Postgres won't.
- **We need transactions.** A coaching turn writes a Message, an EmotionSignal, and sometimes an Outcome atomically. Losing half of that is a corrupted user model.
- **pgvector keeps Memory in the same box.** Embeddings live *beside* the rows they describe, so a single query joins semantic similarity to the relational context (which Decision, which Session) — and a single `DELETE` removes both. See §4 for why this beats a dedicated vector DB.
- **Boring scales further than founders fear.** One well-indexed Postgres instance carries a startup well past Series A. We revisit at scale, not before (canon §6).

---

## 2. The relational core (canon §5 aggregates as tables)

Every table below maps 1:1 to a canonical aggregate in canon §5. The root is **Identity**, not Goal — principle #4 (*identity over goals*) made structural. Field lists are **illustrative**, not production DDL.

### Ownership boundaries

Each engine-module (`12 Backend Architecture.md`) **owns** its tables and is the only code that writes them. No module reaches into another's tables; cross-module reads happen over the internal **event bus** or a module's public interface, never by joining across an ownership line in application code. The mapping:

| Module (owner) | Tables it owns |
|---|---|
| Identity Engine | `identities` |
| Decision Engine | `decisions`, `outcomes` |
| Coach Engine | `coaching_sessions`, `messages` |
| Emotion Engine | `emotion_signals` |
| Memory Engine | `memories` |
| Learning Engine | `reflections`, `insights` |
| Notification Engine | `nudges` |
| Platform (shared) | `users`, `event_log`, `sync_state` |

Foreign keys may *cross* these lines (Postgres enforces integrity globally), but **write authority does not**. A `bias_flags` change to a `decision` goes through the Decision Engine, full stop. This is the persistence-side expression of "engines never reach into each other's storage" (canon §4).

### `users` — identity of the account, not the person

- `id` (uuid, pk)
- `auth_ref` — opaque handle to the auth provider; **no password material stored here**
- `locale`
- `consent_flags` (jsonb) — per-scope consent (nudges, learning, prompt-capture); consent is a *gate*, not a checkbox (canon §8)
- `covenant_version` — which version of the Covenant this user agreed to
- `created_at`, `deleted_at` (nullable — see §6 soft delete)

### `identities` *(root aggregate)* — one per user

- `user_id` (uuid, pk, fk → users, `ON DELETE CASCADE`)
- `values` (jsonb array), `identity_statements` (jsonb array of first-person present-tense claims)
- `future_self_narrative` (text)
- `virtues` (jsonb array)
- `updated_at`

One-to-one with User. This is the "who you are becoming" that every engine reads before it acts (*understand before advising*, canon §8).

### `decisions` — the **Impulse Moment**, atomic event of the product

- `id` (uuid, pk), `user_id` (fk → users)
- `trigger`, `context` (jsonb)
- `options` (jsonb array), `chosen_option`
- `alignment_score` (numeric 0–1) — computed by the Decision Engine, **never rendered as a number or grade** (canon §5); drives coaching + the aggregated north-star metric only
- `bias_flags` (jsonb array)
- `emotion_signal_id` (fk → emotion_signals, nullable)
- `status` (enum: `open` | `resolved`)
- `created_at`, `resolved_at` (nullable)

### `outcomes` — what actually happened after a Decision

- `id` (uuid, pk), `decision_id` (fk → decisions, `ON DELETE CASCADE`)
- `kind` (enum: `aligned` | `lapse` | `recovery`)
- `reflection_note` (text), `felt_after` (jsonb)
- `created_at`

`kind = recovery` is weighted heaviest in the north-star metric (canon §7). A **Lapse** is expected, never a failure — the schema uses the canon word `lapse`, never `fail`/`failure` (banned words, canon §2), even in enum values.

### `coaching_sessions` — a bounded dialogue

- `id` (uuid, pk), `user_id` (fk → users)
- `anchor_decision_id` (fk → decisions, nullable), `anchor_reflection_id` (fk → reflections, nullable) — a Session anchors to a Decision, a Reflection, or neither
- `moves` (jsonb array of Coaching Moves: Reflect, Reframe, Question, Contrast, Commit, Affirm, Hold-Silence)
- `created_at`

Messages are a child table, not an embedded array, so they page and index independently.

### `messages` — one turn of dialogue

- `id` (uuid, pk), `session_id` (fk → coaching_sessions, `ON DELETE CASCADE`)
- `role` (enum: `user` | `coach`)
- `text` (text, **encrypted** — see §5)
- `emotion_signal_id` (fk → emotion_signals, nullable)
- `tokens` (int)
- `created_at`

### `emotion_signals` — inferred emotional state

- `id` (uuid, pk), `user_id` (fk → users)
- `valence` (numeric -1..1), `arousal` (numeric 0..1)
- `labels` (jsonb array), `confidence` (numeric 0..1)
- `source` (enum: message-text | context | manual)

Referenced by both `decisions` and `messages`; owned by the Emotion Engine.

### `reflections` — structured look-back that feeds the Learning Engine

- `id` (uuid, pk), `user_id` (fk → users)
- `period` (enum: `daily` | `weekly`)
- `prompts` (jsonb array), `responses` (jsonb array, **encrypted**)
- `created_at`

### `insights` — a learned, evidenced pattern

- `id` (uuid, pk), `user_id` (fk → users)
- `statement` (text)
- `evidence_refs` (jsonb array of pointers to decisions/outcomes/reflections) — **mandatory and non-empty**: we never assert a pattern we can't show (canon §8, explainability)
- `confidence` (numeric 0..1)
- `surfaced_at` (nullable), `dismissed` (bool)

### `nudges` — a proactive, permissioned message

- `id` (uuid, pk), `user_id` (fk → users)
- `kind`, `scheduled_for`, `sent_at` (nullable)
- `consent_scope` — checked against `users.consent_flags` before send; a Nudge without a satisfied scope is never dispatched (canon §8)
- `outcome` (enum: `opened` | `acted` | `ignored`, nullable)

### Relationship map

```
users 1─1 identities
users 1─* decisions 1─* outcomes
users 1─* coaching_sessions 1─* messages
users 1─* emotion_signals   (referenced by decisions & messages)
users 1─* reflections
users 1─* memories
users 1─* insights
users 1─* nudges
coaching_sessions ─?→ (decision | reflection)   anchor, nullable
```

Every table hangs off `users`. That is deliberate — it makes per-user isolation (§5) and right-to-be-forgotten (§6) a property of the schema, not of careful application code.

---

## 3. Memory: `memories` table + pgvector

- `id` (uuid, pk), `user_id` (fk → users, `ON DELETE CASCADE`)
- `type` (enum: `episodic` | `semantic` | `pattern`)
- `content` (text, **encrypted at rest**)
- `embedding` (`vector(1536)` — pgvector; the embedding itself is a lossy derivative, not plaintext, but is still user-scoped and deleted on cascade)
- `salience` (numeric 0..1) — how much this memory should weigh in retrieval
- `source_ref` (jsonb) — pointer back to the Decision/Session/Reflection it came from
- `created_at`

**Memory types** (canon §5):

- **episodic** — "on Tuesday you almost skipped the gym after a hard call" — a specific event.
- **semantic** — "you value being present for your kids" — a distilled fact about the person.
- **pattern** — "you lapse most on low-sleep evenings" — a recurring shape. (A promoted pattern often becomes an `insight`; the Memory is the raw material, the Insight is the surfaced, evidenced claim.)

### Retrieval: semantic + recency + salience

The Memory Engine retrieves with a **blended score**, not pure vector similarity:

```
score = w_sim · cosine(query_embedding, memory.embedding)
      + w_rec · recency_decay(now − memory.created_at)
      + w_sal · memory.salience
```

An approximate-nearest-neighbour index (HNSW / IVFFlat) does the first-pass similarity search inside Postgres; recency and salience re-rank the candidates. **Why blend:** pure similarity surfaces the *closest* memory, not the *most useful* one. A coach that only remembers what's textually similar forgets what's important-but-phrased-differently, and clings to stale memories. Recency and salience are how we approximate human "this matters right now."

### Why relational core + vector, not a pure vector DB

A pure vector DB would force us to keep the authoritative user model in one system and its embeddings in another — two sources of truth, two deletion paths, two consistency problems. Instead:

- **One system of record.** The Memory row and its embedding are the same row. Retrieval joins similarity to relational context (which Decision produced this memory?) in one query.
- **Deletion is atomic.** Right-to-be-forgotten (§6) means one cascading `DELETE`, not a distributed erase we have to reconcile. A separate vector store is exactly the place a forgotten user's ghost survives.
- **Encryption is uniform.** One key strategy, one at-rest boundary.

We accept slightly less raw ANN throughput than a specialised store in exchange for correctness, deletability, and one fewer system to secure. That trade flips only at a scale we don't have (canon §6: revisit at Series A).

---

## 4. Per-user isolation & data minimization

- **Every table is user-scoped.** No shared "content" tables that mix users; the `user_id` FK is the isolation boundary. Application-layer access is always filtered by the authenticated `user_id`, and we enforce it with **row-level security (RLS)** policies in Postgres so a query bug cannot silently leak across accounts.
- **Data minimization is a schema decision.** We store the *inference*, not the raw feed, wherever possible: an `emotion_signal` (valence/arousal/labels), not raw sensor streams; a `memory.content` summary, not a transcript we don't need. The smaller the surface, the smaller the breach.

---

## 5. Privacy-at-rest — the Covenant in bytes

Trust is the product (principle #7). At-rest protection has three layers:

1. **Full-disk / volume encryption** (managed by the cloud provider) — table stakes; protects against stolen media.
2. **Column-level application encryption** for the most intimate free-text fields: `messages.text`, `reflections.responses`, `memories.content`, `decisions.context`. Encrypted with keys held in a KMS, **decryptable only inside the backend request path**, never in analytics, backups-in-transit, or logs.
3. **Per-user key derivation.** Each user's sensitive columns are encrypted under a key derived per-user from the KMS root. This makes "forget this user" partly achievable by **crypto-shredding** — destroy the user's key and the ciphertext is inert even where a backup still holds it (§6).

### What we deliberately do NOT store

Stated as a hard boundary because the Covenant is a promise, not a preference:

- **No raw credentials.** `users.auth_ref` is an opaque handle; passwords/tokens live with the auth provider.
- **No always-on location, contacts, mic, or health streams.** We store discrete, consented signals (`emotion_signal`, `nudge.outcome`), not continuous surveillance.
- **No third-party ad/identity trackers.** There is no table for them because there is no such data.
- **No plaintext prompt/response in observability.** Prompt capture is **privacy-scrubbed** (canon §6, §7) before it ever lands — see §7.
- **No shaming-derived fields.** We do not compute or store "willpower scores," guilt indices, or streak-shame counters. The anti-metrics (canon §7) have no columns.

---

## 6. Retention & deletion — right-to-be-forgotten is a hard requirement

The Covenant (`15 Constitution.md`) makes deletion **non-negotiable**: a user can demand erasure and we must comply completely, including derivatives.

### Soft vs hard delete

- **Soft delete** (`deleted_at` timestamp) is for *reversible* user actions — dismissing an Insight, archiving a Session. The row is hidden from all reads but recoverable, and never used in coaching once soft-deleted.
- **Hard delete** is for *right-to-be-forgotten*. It is real, cascading, and irreversible.

### How deletion cascades

Because every table hangs off `users` with `ON DELETE CASCADE`, a single `DELETE FROM users WHERE id = …` removes:

```
users
 ├─ identities
 ├─ decisions ── outcomes
 ├─ coaching_sessions ── messages
 ├─ emotion_signals
 ├─ reflections
 ├─ memories  (rows AND their pgvector embeddings — same row, gone together)
 ├─ insights
 ├─ nudges
 └─ sync_state
```

Deletion also covers the derivatives that live *outside* the aggregate rows:

- **Embeddings** — deleted with their `memories` row (same table); no separate vector store to sweep (§3).
- **Event log / audit trail** — the user's rows are deleted or tombstoned; because the log is already privacy-scrubbed (§7), no plaintext survives regardless.
- **Backups & caches** — Redis session cache is TTL'd and flushed for the user immediately; backups are handled by **crypto-shredding** the per-user key (§5), so restoring an old backup yields ciphertext no one can read.

Right-to-be-forgotten runs as a **tracked job with a completion receipt**, not a fire-and-forget query — we can prove the erasure happened, which is itself part of earning the right to hold the data.

---

## 7. Event log / audit trail

A single append-only `event_log` table records domain events (Decision opened, Outcome recorded, Nudge sent, consent changed). It serves two masters:

- **Feeds the event bus** (`12 Backend Architecture.md`): engines react to events without reaching into each other's tables. The log is the durable spine under the Redis-streams bus (canon §6) — if the bus drops a message, the log is replayable.
- **Feeds the Learning Engine:** lapses, recoveries, and reflections become training signal for Insights.

`event_log` fields: `id`, `user_id`, `type`, `payload` (jsonb), `occurred_at`, `correlation_id`.

### Staying privacy-scrubbed

The audit trail records **that something happened, not the intimate content of it.** The `payload` holds IDs, enums, scores, and timings — never `message.text`, never `reflection.responses`, never decrypted `memory.content`. This is enforced at write time by a **scrub pass** on the payload (same discipline as prompt/response capture in canon §6), so the log can be used for analytics and debugging without becoming a second, unencrypted copy of the user's inner life. On right-to-be-forgotten the user's events are removed with the cascade (§6); even before that, there is no plaintext to leak.

---

## 8. Offline-first sync with the iOS client

The moment of temptation often has no signal (canon §6), so the iOS client (`11 iOS Navigation.md`) is **offline-first**: an Impulse Moment must be capturable, and basic coaching must run, with zero connectivity.

### What lives where

| Local (SwiftData on device) | Server (Postgres, system of record) |
|---|---|
| Draft & recent Decisions, current Session, queued messages | Authoritative aggregates, full history |
| A working slice of Identity + recently-retrieved Memory (read cache) | The full Memory store + pgvector index |
| Unsynced events awaiting upload | The canonical `event_log` |

The device holds a **cache and an outbox**, never the source of truth. Memory retrieval and embedding always happen server-side (that's where the index and the model gateway live); the client carries only a small, recently-relevant slice to coach offline.

### Idempotent writes

Every client-originated write carries a **client-generated UUID** (`id`) and an idempotency key. Replaying the outbox after reconnect is safe: the server upserts on the client UUID, so a Decision created offline and synced twice becomes one row. This is why IDs are UUIDs, not server sequences — the client can mint an authoritative identifier before it ever reaches us.

### Conflict resolution

- **Append-only data** (messages, events, outcomes) rarely conflicts — it merges.
- **Mutable aggregates** (Decision status, Identity) use **last-writer-wins per field with a server clock**, plus a rule: the server's *safety and consent* state always wins over stale client state (a consent revoked on the server is never overridden by an offline client that didn't know). Safety pre-empts everything (canon §8).
- Conflicts that can't auto-resolve are surfaced to the user as a gentle choice, never silently discarded — losing a user's words would violate the tone we promise.

A `sync_state` table (per user, per device) tracks the last acknowledged event cursor so sync is incremental, not a full re-download.

---

## 9. Migration discipline

We commit to **boring, forward-only migrations**:

- **Forward-only.** No down-migrations in production. Rolling *back* a schema on live user data risks dropping columns that already hold irreplaceable, encrypted user history. If a migration is wrong, we fix forward with another migration.
- **Expand/contract for anything breaking.** Add the new column, backfill, dual-write, cut over reads, *then* remove the old column in a later release. No single deploy both writes new and drops old.
- **Every migration is a reviewed, versioned file in the repo**, applied in CI before it touches production; the modular monolith deploys as one unit (canon §6), so there is exactly one migration timeline to reason about.

**Why boring, for a startup specifically:** our scarcest resource is attention, and our most fragile asset is user trust. A clever migration that corrupts intimate data doesn't cost us a table — it costs us the Covenant. Boring migrations are how a small team keeps irreversible operations survivable.

---

## Open questions / What we're deliberately NOT doing

- **Not sharding, not multi-region, not read replicas at v1.** One Postgres instance is the system of record. Revisit at Series A scale (canon §6), not before.
- **Not a separate vector database.** pgvector stays in-box until throughput genuinely forces the split (§3) — and only if we can preserve atomic deletion.
- **Not storing raw model prompts/responses in the clear.** Capture stays privacy-scrubbed; if evals need more fidelity, that is a decision the Constitution gates, not one we make silently.
- **Open: encryption granularity.** Per-user key derivation (§5) vs. per-field vs. envelope encryption — we've committed to per-user for crypto-shred deletability, but the exact KMS topology is unsettled and owned jointly with `12 Backend Architecture.md`.
- **Open: Memory salience decay.** How salience is updated over time (reinforced on retrieval? decayed on disuse?) is a Memory Engine (`04 AI Brain`) question; this doc only guarantees the `salience` column exists and drives retrieval (§3).
- **Open: audit-log retention window.** Right-to-be-forgotten deletes user events; whether *anonymised, aggregate* event data survives erasure for the Learning Engine is a Covenant question we defer to `15 Constitution.md`.
- **Open: conflict UX.** The *shape* of the "gentle choice" surfaced on unresolvable sync conflicts (§8) belongs to `11 iOS Navigation.md`; we own only the merge rule.
