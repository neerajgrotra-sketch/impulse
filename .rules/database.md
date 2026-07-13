# Database Rules

**Purpose:** keep Postgres the trustworthy system of record for a product whose product *is* trust — module-owned tables, forward-only migrations, privacy at rest, and a real right-to-be-forgotten. **Scope:** the Postgres schema, pgvector Memory storage, migrations, and all data access. Read alongside [backend.md](./backend.md), [architecture.md](./architecture.md), and the [Canon §5/§8](../docs/00%20Canon.md#5-the-data-model-canonical-aggregates--key-fields).

1. Postgres **MUST** be the single system of record; pgvector holds Memory embeddings and Redis holds only queues, rate limits, and short-term session cache — never durable truth. **WHY:** one system of record (Canon §6) is what makes backup, migration, and the forgotten-cascade tractable.

2. Each engine module **MUST** own its tables; another module **NEVER** reads or writes them directly, only through the owning engine's interface. **WHY:** module-owned tables are what keep the modular monolith splittable (mirrors [backend.md](./backend.md) rule 1).

3. The schema **MUST** match the Canon data model with **Identity** as the root aggregate and the canonical field names (alignment_score, bias_flags, consent_scope, covenant_version, salience, …). **WHY:** the schema is the Canon made physical; drifting field names is how docs and code stop describing the same system.

4. Migrations **MUST** be forward-only and reviewed; we **NEVER** edit or delete an applied migration, and a rollback is a new forward migration. **WHY:** an edited history is unreproducible across environments and silently corrupts anyone who already ran the old version.

5. Migrations **MUST** be backward-compatible with the currently deployed code (expand-then-contract); a column is dropped only after no live code reads it. **WHY:** the modular monolith deploys as one unit, but a migration and its code still land in sequence — a destructive migration breaks the running app.

6. PII and sensitive user content **MUST** be encrypted at rest and access-scoped; we **collect only what a feature needs** (data minimization). **WHY:** "earn the right to hold this data" is principle #7 — data we don't hold can't leak, and data we do hold must be defended.

7. Right-to-be-forgotten **MUST** cascade: deleting a User removes or irreversibly anonymizes every aggregate keyed to them — Identity, Decision, Outcome, CoachingSession, Message, EmotionSignal, Reflection, Memory (incl. embeddings), Insight, Nudge. **WHY:** a forgotten user with orphaned Memory embeddings or messages is a broken Covenant and a legal breach.

8. Deletion **MUST** be verifiable: we can prove a forgotten user's data is gone from Postgres, pgvector, backups within the stated window, and logs. **WHY:** an unverifiable deletion is not a deletion; the Covenant promises we can show we kept it.

9. Logs, traces, and error payloads **NEVER** contain PII, message text, or raw user content. **WHY:** logs are the most-copied, least-guarded data store; PII there defeats every encryption-at-rest control (mirrors [backend.md](./backend.md) rule 14).

10. The **alignment_score MUST NEVER** be exposed to the client or rendered as a number or letter grade; it drives coaching and, aggregated, the north-star metric only. **WHY:** the Canon (§5) forbids showing alignment as a grade — a scored user is a judged user, which contradicts "coach, never parent."

11. Every Insight row **MUST** carry evidence_refs; we **NEVER** persist or surface a pattern we can't evidence. **WHY:** explainability is a cross-cutting constraint (Canon §8) — an unevidenced Insight is an assertion we can't stand behind.

12. Every table with user data **MUST** carry the keys needed for the forgotten-cascade and for per-user access scoping (user_id or a traceable foreign key). **WHY:** a row that can't be traced to a user can be neither deleted nor access-controlled.

13. Consent state (consent flags, consent_scope, covenant_version) **MUST** be stored and queryable, and proactive-action queries **MUST** filter on it. **WHY:** consent is a gate not a checkbox (Canon §8); it has to be enforceable at query time, not just at the UI.

14. Any schema change touching coaching, safety, memory, privacy, notifications, identity, or the model is **Sensitive-tier** and **MUST** go through ethical review + Design Council before the migration merges. **WHY:** schema is the hardest layer to reverse, and these are the surfaces the Covenant guards (Conventions §2).

**How this is enforced:** a migration linter in CI blocks edits to applied migrations and flags destructive/non-expand-contract changes; a log-scrubbing/PII scanner in CI; a periodic forgotten-cascade integration test proving deletion across Postgres, pgvector, and backups; ethical review + Design Council at Sensitive tier.
