# Architecture Rules

**Purpose:** keep Impulse a clean, modular monolith where the engines are bounded contexts with hard interfaces, dependencies point inward, and the Coach Engine is the only orchestrator — so we can change an engine's internals freely without a cross-system ripple. **Scope:** all backend module structure, engine boundaries, inter-engine communication, and the decision to split, merge, or add an engine. Read alongside [backend.md](./backend.md) and the [Canon §4/§6](../docs/00%20Canon.md#4-the-ai-brain-engine-contracts).

1. Each engine (Identity, Emotion, Decision, Memory, Coach, Learning, Notification, Prompt Builder, Safety) **MUST** be a module with a hard, stable interface and freely-changeable internals. **WHY:** a bounded context with a stable contract is the unit that lets fifteen engineers work without colliding.

2. Dependencies **MUST** point inward: engine interfaces and domain models are the core; FastAPI handlers, the event bus, and storage adapters are the outer ring and depend on the core, never the reverse. **WHY:** the domain must not know about transport or persistence, or we can never change either without touching business logic.

3. An engine **NEVER** reaches into another engine's storage, tables, or in-memory state. **WHY:** shared storage is a hidden hard coupling that silently voids every "internals may change freely" promise in the Canon.

4. Engines **MUST** communicate only through published interfaces or the internal event bus. **WHY:** a documented contract is testable and mockable; a back-channel is neither and rots on the first refactor.

5. The **Coach Engine MUST be the only orchestrator** that composes other engines within a coaching turn; no other engine calls a peer to sequence a dialogue. **WHY:** the Canon designates one conductor so orchestration logic lives in one place instead of smeared across the graph.

6. The Coach Engine **MUST NOT** emit an advice-type Coaching Move until the Decision + Identity context meets the completeness threshold. **WHY:** "understand before advising" is a canon principle enforced in code, not a tone suggestion.

7. The Safety Engine **MUST** be able to hard-stop any coaching turn, and every inbound message **MUST** pass through it before coaching logic runs. **WHY:** safety pre-empts everything; a bypassable safety gate is not a safety gate.

8. We **MUST** remain a single deployable modular monolith; splitting an engine into a separate service requires an accepted ADR that names the specific pain (latency, scaling, or team boundary) forcing the split. **WHY:** the Canon fixes the monolith for v1 — "one deployable until pain demands otherwise" — and premature microservices buy distributed-systems cost with no benefit.

9. The event bus **MUST** be accessed through an abstraction, never Redis-streams primitives directly in engine code. **WHY:** the Canon commits us to moving off Redis streams to a real broker later; direct coupling would make that a rewrite instead of an adapter swap.

10. Cross-cutting concerns (safety, consent checks, tone/lint, tracing) **MUST** be applied as explicit pipeline stages, never duplicated ad hoc inside each engine. **WHY:** a constraint that must hold "in every document" has to live in one enforceable place or it will be missed somewhere.

11. Domain aggregates **MUST** match the Canon data model, with **Identity** (not Goal) as the root aggregate. **WHY:** "identity over goals" is principle #4 made structural; a Goal-rooted model would encode the wrong philosophy.

12. Any change that alters an engine interface, adds/removes an engine, changes the orchestration contract, or introduces a new cross-cutting stage **MUST** have an accepted ADR before merge. **WHY:** these are the load-bearing seams; an undocumented change to a seam is the most expensive kind of surprise.

13. Any architecture change touching coaching, safety, memory, privacy, notifications, identity, or the model is **Sensitive-tier** and **MUST** go through the full feature lifecycle + Design Council. **WHY:** the tiering model (Conventions §2) says these surfaces get no shortcuts, and architecture decisions are the hardest to reverse.

14. Feature code **NEVER** calls a model provider directly; all model access **MUST** route through the Prompt Builder and the LLM gateway. **WHY:** the gateway and Prompt Builder are the only place we can enforce structured output, safety, tiering, and mockability (see [ai.md](./ai.md)).

**How this is enforced:** import-linter (or equivalent) CI check on dependency direction and cross-module reach-in; the architecture review skill at Standard tier and the Design Council at Sensitive tier; ADR presence checked in PR review for any interface/orchestration change.
