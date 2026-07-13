# System Context — Paths, Boundaries & Sync

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** One level deeper than the [architecture index](./README.md): the two request paths, the event bus, the trust/security boundaries, and the offline-first sync boundary — each as an ASCII sketch with a short **WHY**. This orients; it does not specify. Detail is deferred by link to [docs 04](../docs/04%20AI%20Brain.md), [docs 12](../docs/12%20Backend%20Architecture.md), and [docs 13](../docs/13%20Prompt%20Architecture.md).

All vocabulary is [Canon](../docs/00%20Canon.md) §2, verbatim.

---

## 1. Two request paths: fast coaching, slow learning

The single most important control-flow decision in the backend is the split between a **synchronous path** that must feel instant and an **asynchronous path** that is allowed to take its time.

```
  SYNCHRONOUS — the path Present Self feels          ASYNCHRONOUS — improves the NEXT moment
  ─────────────────────────────────────────         ───────────────────────────────────────
  iOS ──HTTPS──> FastAPI (authn/z)                   EVENT BUS (Redis streams)
                    │                                     │  decision.* · outcome.recorded
                    v                                     │  reflection.completed · memory.created
            Coach.handle_turn()                           v
              ├ Safety.screen     (Haiku 4.5, hard-stop)  ├ Learning worker  (Opus 4.8, weekly synthesis)
              ├ Emotion.infer     (Haiku 4.5)             ├ Notification worker (when/whether to Nudge)
              ├ Identity.get_model                        └ Embedding worker  (writes pgvector)
              ├ Memory.retrieve   (pgvector kNN)
              ├ Decision.frame
              ├ Prompt Builder.assemble
              └ LLM Gateway.complete (Sonnet 5) ← dominant cost
                    │
              persist Decision + Message (one txn)
                    │  emit events, fire-and-forget ─────────> (into the bus, left)
                    v
              stream response to client
  p95 ≤ 2.5s to first useful response
```

**WHY the split is a principle, not an optimization.** Coaching is a promise to Present Self *now*; learning is a promise to Future Self *later*. Letting learning block coaching would slow the moment that matters to improve one that hasn't happened — exactly backwards. So nothing on the sync path waits on a worker; we return the coaching turn and *then* emit events. The async path may be slow, may retry, may be briefly down, and the user in an Impulse Moment feels none of it. Owned in full by [docs 12 §3](../docs/12%20Backend%20Architecture.md); orchestration of the turn by [docs 04](../docs/04%20AI%20Brain.md); the prompt/model tiering by [docs 13](../docs/13%20Prompt%20Architecture.md).

---

## 2. The event bus

```
                 publish (fire-and-forget, <1ms on sync path)
   producers ─────────────────────────────────┐
   (Coach, Decision, Memory, Safety…)          v
                              ┌──────────────────────────────────┐
                              │  EventBus interface              │
                              │  publish · subscribe · ack       │  ← thin adapter
                              │  v1 impl: Redis streams          │    (swap to a broker later)
                              └───────────────┬──────────────────┘
                                              │ at-least-once, consumer groups, replay
                    ┌─────────────────────────┼─────────────────────────┐
                    v                         v                         v
            Learning worker          Notification worker         Embedding worker
            (idempotent)             (idempotent)                (idempotent)
```

**WHY at-least-once + idempotent consumers, not exactly-once.** Exactly-once delivery is a distributed-systems myth; the honest answer is idempotent consumers that dedup on `event_id` and treat re-delivery as a no-op. That same property makes **replay** safe — we can rebuild a projection or backfill a new worker without touching the system of record. We start on Redis streams because we already run Redis; the `EventBus` interface means moving to a real broker is a one-adapter change. Event shapes and the full type table are owned by [docs 12 §4](../docs/12%20Backend%20Architecture.md).

---

## 3. Trust & security boundaries

Trust is the product ([Canon principle #7](../docs/00%20Canon.md)); privacy and safety are architecture, not features. The concentric boundaries below each shrink a risk surface to one place.

```
  ┌─ EDGE (FastAPI) ────────────────────────────────────────────────┐
  │  authenticates EVERY request (short-lived bearer tokens).        │
  │  No request reaches an engine unauthenticated.                   │
  │                                                                  │
  │  ┌─ PER-USER ISOLATION ───────────────────────────────────────┐ │
  │  │  every query scoped to the authenticated user_id at the    │ │
  │  │  module interface. No cross-user read path by construction.│ │
  │  │                                                            │ │
  │  │  ┌─ SAFETY GATE ──────────────────────────────────────────┐│ │
  │  │  │  Safety Engine screens every inbound turn and can      ││ │
  │  │  │  HARD-STOP before any Coaching Move is emitted.        ││ │
  │  │  │                                                        ││ │
  │  │  │  ┌─ MODULE OWNERSHIP ─────────────────────────────────┐││ │
  │  │  │  │  a module owns its tables; no cross-module reach-in.│││ │
  │  │  │  │  intimate data (Identity Statements, Lapses,        │││ │
  │  │  │  │  emotion) is readable only by its owning engine.    │││ │
  │  │  │  └─────────────────────────────────────────────────────┘││ │
  │  │  └────────────────────────────────────────────────────────┘│ │
  │  └────────────────────────────────────────────────────────────┘ │
  │                                                                  │
  │  SECRETS: only the LLM gateway holds model credentials.          │
  │  PROMPT/RESPONSE CAPTURE: privacy-scrubbed before any log/eval.  │
  └──────────────────────────────────────────────────────────────────┘
```

**WHY concentric, single-owner boundaries.** Impulse holds unusually intimate data, so each control collapses a whole class of risk to one auditable place: one edge for auth, one `user_id` scope so a user's data is invisible to every other user, one Safety Engine that pre-empts everything ([Canon §8](../docs/00%20Canon.md)), one gateway holding model keys. The non-negotiables these enforce are law in [docs 15 Constitution](../docs/15%20Constitution.md); the backend enforcement is [docs 12 §6](../docs/12%20Backend%20Architecture.md); storage-level isolation is [docs 08](../docs/08%20Database%20Architecture.md).

---

## 4. The offline-first sync boundary

```
   PHONE  (source of truth for the moment)          BACKEND (system of record)
   ────────────────────────────────────             ──────────────────────────
   SwiftData local store                             PostgreSQL + pgvector
        │  user acts at the Impulse Moment                 ▲
        │  — coaching works with NO signal                 │
        v                                                  │
   local queue of intents  ──HTTPS, idempotency-key──►  thin SYNC API
        ▲                                                  │  dedup on key,
        │  reconcile on reconnect                          │  reconcile, then
        └──────────────── merged state ◄───────────────────┘  emit events
```

**WHY offline-first, and why idempotent sync.** The moment of temptation often has no signal — so the client must be present and useful without the network, which makes the phone, not the server, the source of truth for what just happened ([docs 11](../docs/11%20iOS%20Navigation.md)). The client then replays queued intents with an **idempotency key** so a flaky connection that retries a request never double-records a Decision or a Message. The sync API is deliberately thin; the merge/reconciliation model and conflict rules are owned by [docs 08](../docs/08%20Database%20Architecture.md), and the client's degradation behavior by [docs 11](../docs/11%20iOS%20Navigation.md).

---

*See also: [architecture/README.md](./README.md) (index + C4 system context), [docs 04 AI Brain](../docs/04%20AI%20Brain.md), [docs 12 Backend Architecture](../docs/12%20Backend%20Architecture.md), [docs 13 Prompt Architecture](../docs/13%20Prompt%20Architecture.md).*
