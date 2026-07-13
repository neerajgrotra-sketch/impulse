# 12 · Backend Architecture — The Modular Monolith

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define the shape of the backend: one deployable modular monolith in Python + FastAPI, the engines-as-modules boundary discipline, the internal event bus, and the LLM gateway. This document owns *structure and control flow*. It defers the schema to `08 Database Architecture.md`, the engine reasoning and orchestration logic to `04 AI Brain.md`, and prompt assembly to `13 Prompt Architecture.md`.

This is a document about boundaries. The hardest thing to get right in a young backend is not what runs where — it is *what is allowed to know about what*. Draw those lines correctly on day one and the system stays cheap to change for years. Draw them wrong and every feature costs more than the last.

---

## 1. The core decision: a modular monolith, not microservices

We build the backend as a **modular monolith** (canon §6): a single deployable process, internally partitioned into modules with hard interfaces, backed by one PostgreSQL system of record and one Redis. We are explicit that this is a *deliberate* choice, not a stopgap we are ashamed of.

**Why not microservices.** Microservices solve an *organizational* problem — letting many teams deploy independently without coordinating — at a steep *engineering* cost: network calls where a function call would do, distributed transactions, eventual consistency you didn't ask for, a dozen dashboards, and a deployment topology that needs a full-time owner. We are a small founding team. We do not have the coordination problem microservices exist to solve, so we would pay the entire cost for none of the benefit. Premature microservices are how small teams turn a six-month product into a two-year platform-building exercise nobody funded.

**What we get from the monolith instead:**

- **One deployable.** One build, one image, one rollback. A single engineer can reason about the whole request path in their head.
- **In-process calls between engines** — nanoseconds and a stack trace, not milliseconds and a correlation ID. Debugging is a breakpoint, not a distributed trace.
- **One transactional boundary where it matters.** A coaching turn that writes a `Decision` and a `Message` commits or rolls back together, with no saga.
- **Refactoring stays cheap.** Moving a responsibility between engines is a code change reviewed in one PR, not a cross-service contract negotiation.

**The discipline that makes it work — and makes extraction possible later.** A monolith is only a liability when it becomes a *big ball of mud*: modules that reach into each other's tables and share mutable state. We prevent that from day one with the module boundary rules in §2. The promise we make ourselves: *the code is structured as if the engines were already separate services, so that the day one of them must become a real service, the change is mechanical.* We extract later, only when pain demands it (§7) — never on speculation.

> Related philosophy for *how* we build inside these modules (clean architecture, testing, evals) lives in `10 Engineering Principles.md`.

---

## 2. Module boundaries are engine boundaries

Every module **is** one of the engines defined in canon §4. There are no modules that aren't engines and no engines that span modules. This is the whole trick: the bounded contexts we care about (Identity, Emotion, Decision, Memory, Coach, Learning, Notification, Prompt Builder, Safety) are the same units we deploy, test, own, and one day extract.

**Two rules, non-negotiable:**

1. **A module owns its tables. No cross-module DB reach-in.** The Identity Engine's tables are private to the Identity Engine. No other module issues a query against them — not a join, not a read. If the Coach Engine needs the identity model, it calls `identity.get_model(user_id)`, an in-process function that returns a typed object. Physical enforcement (schemas/roles) is specified in `08 Database Architecture.md`; the *rule* is owned here.
2. **A module exposes a narrow interface and nothing else.** Each engine publishes a small, typed Python interface — its public verbs — in a `contracts` package. Everything else is `_private`. Modules depend on *interfaces*, never on each other's internals. If an interface has thirty methods, the boundary is wrong.

Why this specific pair of rules: the two ways a monolith rots are shared tables and wide interfaces. Forbid both and the module graph stays a graph of contracts, not a graph of implementation details. That is exactly the property that makes a service extractable.

```
                          FastAPI (HTTP + auth + sync API)
                                       |
                    +------------------+-------------------+
                    |            Coach Engine              |   <- the ONLY orchestrator
                    |   (composes others; owns a turn)     |       (see 04 AI Brain.md)
                    +--+------+------+------+------+--------+
                       |      |      |      |      |
              calls narrow interfaces (in-process, typed)
                       |      |      |      |      |
        +--------------+  +---+--+ +-+----+ +-----++  +----------------+
        | Identity     |  |Emotion| |Decision| |Memory|  | Prompt Builder |
        | Engine       |  |Engine | |Engine  | |Engine|  | (-> 13 Prompt) |
        +------+-------+  +---+---+ +---+----+ +--+---+  +--------+-------+
               |             |          |         |               |
          (own tables)  (own tables)(own tables)(pgvector)   (no tables)
               |             |          |         |               |
   ============+=============+==========+=========+===============+=========
                         INTERNAL EVENT BUS (Redis streams, abstracted)
   =====+==================================+=========================+======
        |                                  |                         |
  +-----v------+                    +------v-------+          +-------v------+
  | Learning   |                    | Notification |          | Embedding    |
  | Engine     |                    | Engine       |          | worker       |
  | (async)    |                    | (async)      |          | (-> Memory)  |
  +------------+                    +------+-------+           +--------------+
                                           |
                                    +------v-------+
                                    | Safety Engine|  <- cross-cutting; gates every
                                    | (04 AI Brain)|     inbound turn (canon §4, §8)
                                    +--------------+

   All model access ->  +--------------------------------------+
                        |            LLM GATEWAY               |  single egress
                        |  provider-abstracted, tiered (§5)    |  to any model
                        +------------------+-------------------+
                                           |
                                Claude family: Haiku 4.5 / Sonnet 5 / Opus 4.8
```

The **Coach Engine is the only orchestrator** (canon §4, §72). Feature code and the API layer do not compose engines directly; they hand a request to the Coach Engine, which decides what to consult per turn. Detailed orchestration logic — move selection, the understand-before-advise gate — belongs to `04 AI Brain.md` and `07 Coaching Engine.md`, not here.

---

## 3. Two paths: fast coaching, slow learning

The single most important control-flow decision in this backend is the split between a **synchronous path** that must feel instant and an **asynchronous path** that is allowed to take its time. Conflating them is how coaching gets slow and learning gets skipped.

### 3.1 The synchronous coaching path

This is the path a user feels. Present Self is holding the phone in an Impulse Moment; every hundred milliseconds is friction between them and a better decision. It must be fast.

```
iOS client
   |  HTTPS (idempotency-key)
   v
FastAPI  --authn/authz-->  Coach Engine.handle_turn()
                               |
                               |-- Safety Engine.screen(msg)      ~50ms  (Haiku 4.5, can hard-stop)
                               |-- Emotion Engine.infer(msg)      ~80ms  (Haiku 4.5, may be cached)
                               |-- Identity.get_model(user)       ~10ms  (Postgres / Redis cache)
                               |-- Memory.retrieve(user, ctx)     ~60ms  (pgvector kNN)
                               |-- Decision.frame(...)            ~30ms  (mostly deterministic)
                               |-- Prompt Builder.assemble(...)   ~15ms
                               |-- LLM Gateway.complete(Sonnet 5) ~1500ms (the real cost)
                               v
                          persist Decision + Message (one txn)
                               |
                               |-- emit events to bus (fire-and-forget)  <1ms
                               v
                          response to client
```

**Latency budget: p95 ≤ 2.5s to first useful response**, of which the LLM turn (Sonnet 5) is the dominant term and everything else must stay in the noise. This budget drives real rules: pre-turn classifiers run on **Haiku 4.5** because they must be cheap and fast; retrieval is a bounded kNN, never an open-ended scan; and *nothing on this path blocks on the async workers.* When the coaching response is ready, we return it and emit events — we do not wait for anyone to consume them. Streaming the LLM turn to the client (tokens as they arrive) is how we make 1.5s feel like 0.3s; the gateway supports it (§5).

### 3.2 The asynchronous path

Everything that improves the *next* interaction rather than *this* one runs off the event bus, after the response has shipped:

- **Learning Engine** — consumes `outcome.recorded`, `reflection.completed`, `decision.resolved`; mines Lapses/Recoveries into Insights and updated user priors. This is allowed to take seconds or run on a schedule with **Opus 4.8** for deep weekly synthesis. Nobody is waiting.
- **Notification Engine** — consumes pattern/consent signals; decides *when or whether* to send a Nudge (ethics owned by `14 Notification Engine.md`). Inherently future-tense; never synchronous.
- **Embedding worker** — consumes `memory.created`; computes embeddings and writes them to pgvector so Memory retrieval works next time.

**Why the split is a principle, not an optimization.** Coaching is a promise to Present Self *now*; learning is a promise to Future Self *later*. If we let learning block coaching, we would slow the moment that matters to improve a moment that hasn't happened — exactly backwards. The async path can be slow, can retry, can even be briefly down, and the user in an Impulse Moment feels none of it. That is the safety margin the event bus buys us.

---

## 4. The internal event bus

Engines communicate over an **internal event bus** and never reach into each other's storage (canon §4). At v1 the bus is **Redis streams**; it lives behind a thin `EventBus` interface (`publish`, `subscribe`, `ack`) so that moving to a real broker (NATS, Kafka, SQS) later is a one-adapter change, not a rewrite. We choose Redis first because we already run Redis (canon §6) and streams give us consumer groups, at-least-once delivery, and replay without a new piece of infrastructure to operate.

**Event shape.** Every event carries `event_id` (UUID), `type`, `user_id`, `occurred_at`, `schema_version`, and a typed `payload`. Event types at v1 (the vocabulary is canon's, verbatim):

| Event | Emitted when | Consumed by |
|---|---|---|
| `decision.created` | an Impulse Moment is opened | Memory, Learning |
| `decision.resolved` | a Decision reaches `resolved` | Learning, Notification |
| `outcome.recorded` | an Outcome (aligned / lapse / recovery) is logged | Learning |
| `reflection.completed` | a daily/weekly Reflection is submitted | Learning |
| `memory.created` | a new Memory row is written | Embedding worker |
| `insight.generated` | Learning produces an Insight | Notification |
| `safety.flagged` | Safety Engine raises a risk level | Notification, audit |

**Idempotency.** Delivery is at-least-once, so consumers **must** be idempotent. Every consumer records processed `event_id`s (a dedup table / Redis set keyed by consumer + event) and treats a re-delivery as a no-op. We design handlers to be replay-safe rather than trusting the bus to deliver exactly once — exactly-once delivery is a distributed-systems myth; idempotent consumers are the real answer.

**Replay.** Because events are retained in the stream, we can replay a window to a consumer group to rebuild a projection, backfill a new worker, or recover from a bug in the Learning Engine without touching the system of record. This is only safe *because* consumers are idempotent — the two properties are bought together.

---

## 5. The LLM gateway — the single egress to models

Every model call in the system goes through one **LLM gateway**. No feature code, no engine, ever holds a provider SDK or an API key directly (canon §6: "No raw model access from feature code."). This is a hard boundary for the same reason the DB boundary is: one throat to choke for cost, safety, latency, and provider risk.

**Provider abstraction & tiering.** The gateway speaks a provider-neutral `complete(request)` interface and maps a *capability tier* to a concrete model. Default family is Claude (canon §6):

| Tier | Model | Used for |
|---|---|---|
| `fast` | **Haiku 4.5** | emotion, bias detection, Safety triage — cheap, high-volume classification |
| `dialogue` | **Sonnet 5** | real-time coaching turns on the synchronous path |
| `deep` | **Opus 4.8** | weekly synthesis / hard reflections on the async path, latency-tolerant |

Callers request a *tier and a task*, never a model string, so re-tiering (or swapping providers) is a config change in one place. All calls pass through the Prompt Builder and a structured-output (tool / JSON-schema) layer — owned by `13 Prompt Architecture.md`; the gateway enforces that no unstructured egress exists.

**Controls the gateway owns:**

- **Rate limiting** — per-user and global token/request budgets (Redis) to protect cost and stay inside provider limits; the `fast` tier is high-volume and metered separately from `dialogue`.
- **Timeouts** — tight on the sync path (a `dialogue` call that blows the latency budget is failed fast and degraded gracefully), generous on the `deep` async path.
- **Retries** — bounded, jittered backoff on transient/5xx and 429s; retries respect the remaining latency budget on the sync path and never stampede a struggling provider.
- **Cost controls** — every call is tagged (user, engine, tier, tokens in/out, cost) for per-engine cost attribution and hard per-user daily ceilings; runaway loops trip a breaker rather than a bill.
- **Fallback** — provider or tier fallback (e.g. degrade `dialogue`→`fast` under an outage) so a provider incident becomes a quality dip, not an outage.

---

## 6. Security boundaries

Trust is the product (canon principle #7); privacy and safety are architecture, not features. The non-negotiables live in `15 Constitution.md` — this section is how the backend *enforces* them.

- **Authentication.** The FastAPI edge authenticates every request (bearer tokens, short-lived, refreshable). No request reaches an engine unauthenticated. The idempotent sync API for the offline-first client (canon §6) authenticates the same way.
- **Authorization & per-user isolation.** Authorization is **per-user by default**: every query is scoped to the authenticated `user_id`, enforced at the module interface, not left to callers to remember. A user's data is invisible to every other user by construction — there is no cross-user read path. This pairs with the DB-level isolation in `08 Database Architecture.md`.
- **Secrets.** API keys (LLM providers, infra) live in a secrets manager, injected as runtime config, never in the repo, never in logs. The LLM gateway is the *only* holder of model credentials (§5), which shrinks the secret surface to one module.
- **PII handling.** Impulse holds unusually intimate data — Identity Statements, Lapses, emotional states. We minimize what we store, scope who can read it to the owning engine, and **privacy-scrub prompt/response capture** before it ever hits logs or the eval harness (canon §6, §107). The Safety Engine's crisis handling and mandated responses are owned by `15 Constitution.md`; the backend guarantees it runs on every inbound turn (canon §8) and can hard-stop a turn before any coaching move is emitted.

---

## 7. Scaling path: when (and only when) we extract a module

Because §2 keeps engines behind narrow interfaces with private tables, extracting one into its own service is *mechanical*: replace the in-process interface call with a network call (the interface is already the contract), give the module its own connection to its own tables (already private), and point it at the shared event bus (already the async transport). No rewrite — a transport swap.

**We do not extract on speculation. We extract when a specific pain appears:**

- **Resource contention.** A module's workload (e.g. the Learning Engine running Opus 4.8 batch synthesis) competes with the sync path for CPU/memory. Extract it so heavy async work can't starve coaching latency. This is the *most likely first extraction.*
- **Independent scaling.** One module needs far more (or fewer) instances than the rest — embedding throughput, or a notification fan-out spike.
- **Independent deploy cadence.** A module changes so often that its deploys are a drag on everyone else's release train.
- **Fault isolation.** A module's blast radius needs to be contained (a crash or memory leak that shouldn't take coaching down with it).
- **Team topology.** Eventually, a team owns a module end-to-end and wants its own deploy autonomy — the *original* reason microservices exist (§1).

Until one of these bites, splitting is pure cost. The workers in §3.2 already run as separate processes off the same image, which is most of the scaling headroom a young product needs without any service boundary at all.

---

## 8. Deployment shape

```
                         Load balancer / TLS
                                 |
          +----------------------+----------------------+
          |                                             |
   +------v------+   +------------------+        +-------v--------+
   | app (N x)   |   | workers (M x)    |        | scheduler      |
   | FastAPI +   |   | Learning /       |        | (cron: weekly  |
   | all engines |   | Notification /   |        | synthesis,     |
   | sync path   |   | embedding        |        | reflections)   |
   +--+-------+--+   +---+----------+---+        +-------+--------+
      |       |          |          |                    |
      |       +----------+----------+--------------------+
      |                  |                     |
 +----v----+       +-----v-----+         +-----v-----+
 | Postgres|       |  Redis    |         | Secrets   |
 | (+pgvec)|       | (bus,     |         | manager   |
 | system  |       |  cache,   |         +-----------+
 | of record|      |  ratelimit)|
 +---------+       +-----------+
```

**One image, three run modes:** the same build runs as the **API app** (sync path, horizontally scaled behind the LB), as **workers** (the async consumers of §3.2), and as a **scheduler** (periodic Reflection prompts, weekly Opus synthesis). Backing services are **PostgreSQL + pgvector** (system of record) and **Redis** (event bus, session cache, rate limits) — canon §6, nothing more.

**Environments:** `dev` (local, docker-compose: app + workers + Postgres + Redis) → `staging` (production-shaped, seeded synthetic data, where the CI eval harness runs) → `prod`. Config and secrets differ by environment; the code does not. Migrations run as a gated deploy step; the schema and migration discipline are owned by `08 Database Architecture.md`.

---

## Open questions / What we're deliberately NOT doing

**Open questions:**

- **Event bus longevity.** At what event volume / durability requirement do Redis streams stop being enough and we move to a real broker? We want a concrete trigger, not a vibe.
- **Extraction first-mover.** Learning Engine is the likely first service to leave the monolith (§7). Do we pre-shape its interface for out-of-process calls now, or stay honest and wait for the pain?
- **Cross-engine transactions.** The sync path commits Decision + Message together today. If a future turn must atomically touch two engines' tables, do we relax the ownership rule for that case or introduce an outbox?
- **LLM provider fallback quality.** Degrading `dialogue`→`fast` (§5) keeps us up but changes coaching quality. What is the acceptable degraded experience, and how do we tell the user (if at all)?

**What we're deliberately NOT doing:**

- **No microservices at v1.** One deployable until pain demands otherwise (§1, §7). We will resist the urge on principle.
- **No shared database between engines.** Ever. The moment two engines touch one set of tables, the modular monolith is dead (§2).
- **No exactly-once delivery guarantees.** We build idempotent consumers instead of chasing a distributed-systems myth (§4).
- **No raw model access from feature code.** All egress through the LLM gateway, always (§5, canon §6).
- **No synchronous learning.** Nothing that improves the *next* interaction is allowed to slow *this* one (§3).
- **No premature multi-region / sharding.** Single-region, single primary Postgres at v1; revisit at Series A scale (canon §6).

---

*See also: `00 Canon.md` (definitions, stack, engine contracts), `04 AI Brain.md` (engine topology & orchestration), `08 Database Architecture.md` (schema, storage, privacy-at-rest), `13 Prompt Architecture.md` (prompt assembly & structured output), `10 Engineering Principles.md` (how we build inside modules), `15 Constitution.md` (the Covenant, safety, non-negotiables).*
