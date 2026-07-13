# ADR 0001 — Build the backend as a modular monolith, not microservices

> **Status:** Accepted
> **Date:** 2026-07
> **Deciders:** Founding Engineering

## Context

We are a small founding team building the Impulse backend: nine engines (Canon §4) over one PostgreSQL system of record and one Redis. The dominant industry default for a system with this many bounded contexts is microservices. But microservices exist to solve an *organizational* problem — letting many teams deploy independently without coordinating — and we do not have that problem. We have the opposite: a handful of engineers who need to move one coherent product quickly, reason about a whole request path in one head, and keep irreversible operations survivable.

The cost of microservices is paid up front and in full: network calls where a function call would do, distributed transactions, eventual consistency we did not ask for, a fleet of dashboards, and a deployment topology that needs a full-time owner. Canon §6 fixes the stack as a modular monolith and `docs/12 Backend Architecture.md` §1 makes the reasoning explicit. The real risk we are managing is not "will the monolith scale" — one well-indexed Postgres carries a startup well past Series A — but "will the monolith rot into a big ball of mud."

## Decision

We build the backend as a **modular monolith**: a single deployable process in Python + FastAPI, internally partitioned so that **every module is exactly one engine** (Canon §4), each owning its own tables and exposing a narrow, typed interface. Engines communicate over the internal event bus and never reach into each other's storage. One deployable until pain demands otherwise.

## Consequences

**Positive**

- One build, one image, one rollback; a single engineer can hold the whole request path in their head.
- In-process calls between engines — nanoseconds and a stack trace, not milliseconds and a correlation ID; debugging is a breakpoint.
- One transactional boundary where it matters: a coaching turn writes a `Decision` and a `Message` in one commit, no saga.
- Refactoring stays cheap — moving a responsibility between engines is one reviewed PR, not a cross-service contract negotiation.

**Negative**

- Requires *discipline* the runtime does not enforce for us: without the boundary rules, shared tables and wide interfaces would turn the monolith into a big ball of mud.
- The whole app scales as one unit at v1 — a heavy async workload (e.g. Opus batch synthesis) can contend with the sync coaching path until we extract it.
- A single process is a single blast radius until a module is extracted for fault isolation.

**Neutral**

- We commit to keeping the code structured *as if* the engines were already separate services, so extraction later is a transport swap, not a rewrite (`docs/12 Backend Architecture.md` §7).
- Extraction is demand-driven — we split a module only when a specific pain appears (resource contention, independent scaling/deploy, fault isolation, team topology), never on speculation.

## Alternatives considered

- **Microservices from day one** — rejected: we would pay the entire engineering cost (network hops, distributed transactions, ops surface) to solve a team-coordination problem we do not have. Premature microservices turn a six-month product into a two-year platform build nobody funded.
- **An unstructured ("big ball of mud") monolith** — rejected: cheap today, ruinous later. Shared tables and wide interfaces make every feature cost more than the last and make extraction impossible. The two boundary rules in §2 exist precisely to refuse this.
- **A "modulith" framework / heavy service mesh in-process** — rejected as premature: our two rules (own your tables, expose a narrow interface) plus the event bus give us the boundary guarantees without additional machinery to operate.

## Links

- `docs/12 Backend Architecture.md` §1–2, §7 — the modular monolith, the boundary rules, and the extraction path this ADR records
- `docs/00 Canon.md` §6 — the fixed stack decision
- `docs/08 Database Architecture.md` §1 — one Postgres as system of record
- ADR 0002 (LLM as tool), ADR 0005 (Safety Engine), ADR 0006 (tiered models) — decisions that live *inside* these module boundaries
