# Backend Rules

**Purpose:** define how we write the Python/FastAPI modular monolith so the synchronous coaching path stays fast, module boundaries stay honest, and the model is reached through exactly one door. **Scope:** all backend code — engine modules, FastAPI handlers, workers, the event bus, storage adapters, config. Read alongside [architecture.md](./architecture.md), [ai.md](./ai.md), and [database.md](./database.md).

1. Each engine module **MUST** own its tables; no module reads or writes another module's tables directly. **WHY:** module-owned storage is what makes the "splittable later" promise of the modular monolith real instead of aspirational.

2. The synchronous coaching path (inbound message → chosen Coaching Move → LLM turn) **MUST** meet its p95 latency budget; work that isn't needed to produce the turn **MUST** be pushed to a background worker. **WHY:** the coach replies in a moment of temptation — a slow reply is a failed reply, and Learning/embedding/Notification work is latency-tolerant by design.

3. Learning, Notification, and embedding **MUST** run as async workers off the event bus, never inline in a request handler. **WHY:** the Canon designates them background work; blocking a coaching request on them spends the user's latency budget on our bookkeeping.

4. The **LLM gateway MUST be the only egress to any model**; no engine, handler, or worker imports a provider SDK or calls a model endpoint directly. **WHY:** one door is the only place we can enforce tiering, structured output, safety scrubbing, cost tracking, and mockability.

5. Every state-mutating and every proactive (Nudge-sending) endpoint **MUST** be idempotent, keyed by a client-supplied idempotency key. **WHY:** the iOS client is offline-first and will retry on reconnect; without idempotency a flaky network double-books decisions or double-sends nudges.

6. Every proactive action **MUST** check the relevant consent_scope at execution time, not just at scheduling time. **WHY:** consent is a gate not a checkbox (Canon §8), and a user may revoke between scheduling a Nudge and sending it.

7. Handlers **MUST** be thin: parse/validate, call an engine, serialize. Business logic **NEVER** lives in a FastAPI route. **WHY:** logic in the transport layer can't be unit-tested without HTTP and can't be reused by a worker or another engine.

8. All request and response bodies **MUST** be validated by explicit Pydantic (or equivalent) schemas; no engine consumes an unvalidated dict. **WHY:** the boundary is where we reject malformed input; an unvalidated payload turns a client bug into a corrupt aggregate.

9. Errors **MUST** map to typed domain exceptions translated to stable HTTP responses at the boundary; we **NEVER** leak stack traces, internal identifiers, or model output to the client. **WHY:** leaked internals are both a security surface and an unstable contract the client will accidentally depend on.

10. The synchronous coaching path **MUST** degrade to the deterministic fallback coach on model timeout or error rather than surfacing an error to the user. **WHY:** graceful degradation is a canon commitment; a user in an Impulse Moment gets a coach, never a spinner or a 500 (see [ai.md](./ai.md)).

11. Public and per-user endpoints **MUST** be rate-limited (Redis-backed); coaching endpoints get a per-user budget distinct from the global limit. **WHY:** rate limits protect both cost and the user from a runaway client loop, and a shared limit lets one user starve another.

12. Secrets and provider keys **MUST** come from the environment/secret manager, loaded through one typed config object; secrets **NEVER** appear in source, logs, or error messages. **WHY:** a key in git or a log line is a breach, and one config object is the only place we can validate presence at boot.

13. Config **MUST** fail fast at startup if a required value or secret is missing; we **NEVER** fall back to a silent default for a security- or model-related setting. **WHY:** a missing model key or safety flag should crash the boot, not quietly ship a misconfigured coach.

14. Logs **MUST** be structured and per-engine traceable, and **NEVER** contain PII, message text, or a raw alignment_score. **WHY:** observability can't come at the cost of the Covenant; the alignment_score is never exposed even internally as a raw grade (see [database.md](./database.md)).

15. Any endpoint or logic touching coaching, safety, memory, privacy, notifications, identity, or the model is **Sensitive-tier** and **MUST** go through the full feature lifecycle + ethical review. **WHY:** the tiering model (Conventions §2) draws the line here precisely because these are the paths that can hurt a user.

**How this is enforced:** CI runs type checks, schema-validation and import-boundary linters, secret scanning, and a latency-budget test on the coaching path; the backend review skill at Standard tier; ethical review + Design Council at Sensitive tier.
