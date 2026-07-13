# Architecture — Index & System Context

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** The entry point to how Impulse is built. This is a **map, not a territory**: it orients you, draws the system's outermost boundary, and points you at the document that owns each part. It never restates those documents — when this file and a `docs/` document disagree, the document wins, and this file is a stale map to fix.

The authoritative definitions — vocabulary, engine contracts, the data model, the stack — live in [`../docs/00 Canon.md`](../docs/00%20Canon.md). Read Canon first. Everything here uses its words exactly.

---

## System overview

**Impulse is an AI decision coach that helps a person close the gap between the choice their Present Self wants to make and the life their Future Self wants to live** ([Canon §1](../docs/00%20Canon.md)). Structurally, that is an **offline-first iOS client** that is present at the Impulse Moment, talking over a thin idempotent sync API to a **modular monolith backend** (Python + FastAPI) whose modules *are* the nine engines of the AI Brain. The **Coach Engine** is the sole orchestrator of a coaching turn; the other engines are bounded contexts it composes. State, policy, and safety live in the backend; the **LLM gateway** is the single egress to the Claude model family, which owns only language and reasoning. PostgreSQL (+ pgvector) is the system of record and Redis carries the event bus, cache, and rate limits. This boundary exists so that the moment of temptation always has a coach, and the person's most intimate data has exactly one place it can be read.

---

## System context (C4 level 1)

```
        ┌──────────────────────────────────────────────────────────────┐
        │                          THE USER                             │
        │        Present Self (holds the phone at the Impulse Moment)    │
        └───────────────────────────────┬──────────────────────────────┘
                                         │  taps, decisions, reflections
                                         v
        ┌──────────────────────────────────────────────────────────────┐
        │  iOS CLIENT  —  Swift + SwiftUI, MVVM + Coordinator            │
        │  offline-first (SwiftData local store); present at the moment  │
        │  even with no signal.                        (docs 11)         │
        └───────────────────────────────┬──────────────────────────────┘
                                         │  HTTPS · thin idempotent SYNC API
                                         │  (bearer auth at the edge)
                                         v
        ┌──────────────────────────────────────────────────────────────┐
        │  BACKEND  —  MODULAR MONOLITH (Python + FastAPI)   (docs 12)   │
        │                                                                │
        │        ┌──────────────────────────────────────────┐           │
        │        │  Coach Engine  — the ONLY orchestrator    │           │
        │        └───┬────┬────┬────┬────┬────┬───────────┬──┘           │
        │   composes │    │    │    │    │    │           │ (in-process, │
        │            v    v    v    v    v    v           v   typed)     │
        │   Identity · Emotion · Decision · Memory · Prompt Builder      │
        │   · Safety(gates every turn) ·· Learning · Notification (async)│
        │            │                        │                          │
        │       INTERNAL EVENT BUS (Redis streams, abstracted)  (docs 04)│
        └───────┬───────────────────────────────────────┬───────────────┘
                │ owns state                             │ only model egress
                v                                        v
   ┌────────────────────────────┐        ┌──────────────────────────────┐
   │  PostgreSQL (system of      │        │  LLM GATEWAY                  │
   │  record) + pgvector (Memory)│        │  provider-abstracted, tiered  │
   │  Redis (bus, cache, limits) │        │        (docs 13)              │
   │            (docs 08)        │        └───────────────┬──────────────┘
   └────────────────────────────┘                        │ tier + task, never a model string
                                                          v
                                    ┌──────────────────────────────────────┐
                                    │  CLAUDE FAMILY                         │
                                    │  Haiku 4.5  → fast classification      │
                                    │  Sonnet 5   → real-time coaching turn  │
                                    │  Opus 4.8   → deep async synthesis     │
                                    └────────────────────────────────────────┘
```

For the two request paths, trust boundaries, the event bus, and the offline-sync boundary in more depth, see [`system-context.md`](./system-context.md).

---

## The document index — read this when…

Every architectural truth lives in [`../docs/`](../docs/). This table is the fastest route to the one document that owns your question.

| Doc | Read this when you need to know… |
|---|---|
| [00 Canon](../docs/00%20Canon.md) | the exact word for a thing, an engine's contract, the data model, the stack, or the metrics. **Start here; it wins all ties.** |
| [01 Vision](../docs/01%20Vision.md) | why Impulse exists, the wedge decision we win first, the 10-year bet. |
| [02 Product Philosophy](../docs/02%20Product%20Philosophy.md) | the seven principles and the tensions we deliberately hold. |
| [03 Human Model](../docs/03%20Human%20Model.md) | how we represent a person — Identity, Emotion, the behavioral science. |
| [04 AI Brain](../docs/04%20AI%20Brain.md) | the engine topology, how a coaching turn is orchestrated, and the LLM-as-tool principle. |
| [05 Onboarding](../docs/05%20Onboarding.md) | first-run: understand-before-advise and how we capture the Identity Statement. |
| [06 Decision Engine](../docs/06%20Decision%20Engine.md) | the decision-coaching flow and how we expose bias. |
| [07 Coaching Engine](../docs/07%20Coaching%20Engine.md) | dialogue, the Coaching Moves, and tone. |
| [08 Database Architecture](../docs/08%20Database%20Architecture.md) | schema, storage, module-owned tables, privacy-at-rest, the sync model. |
| [09 Roadmap](../docs/09%20Roadmap.md) | sequencing, MVP scope, and what is deliberately stubbed. |
| [10 Engineering Principles](../docs/10%20Engineering%20Principles.md) | how we build *inside* a module — clean architecture, testing, evals. |
| [11 iOS Navigation](../docs/11%20iOS%20Navigation.md) | client structure, screens, navigation, and offline-first behavior. |
| [12 Backend Architecture](../docs/12%20Backend%20Architecture.md) | the modular monolith, module boundaries, the event bus, the LLM gateway, deployment shape. |
| [13 Prompt Architecture](../docs/13%20Prompt%20Architecture.md) | layered prompts, structured output, model tiering, and the eval gate. |
| [14 Notification Engine](../docs/14%20Notification%20Engine.md) | when or whether to send a Nudge, and the ethics of attention. |
| [15 Constitution](../docs/15%20Constitution.md) | the Covenant, the Safety Engine, and the non-negotiables. **Subordinate every other doc to this one.** |

---

## Engines → backend modules

The AI Brain's engines ([Canon §4](../docs/00%20Canon.md)) are not a logical layer that maps onto some other physical structure — **each engine *is* a backend module** ([docs 12 §2](../docs/12%20Backend%20Architecture.md)). There are no modules that aren't engines and no engines that span modules. A module owns its tables (no cross-module reach-in) and exposes one narrow typed interface; that discipline is what keeps the monolith extractable later.

| Engine (Canon §4) | Module | Path | Notes |
|---|---|---|---|
| Coach Engine | `coach` | synchronous | The **only** orchestrator; composes the others per turn. |
| Identity Engine | `identity` | synchronous | Root aggregate; owns the Identity model. |
| Emotion Engine | `emotion` | synchronous | EmotionSignal classifier (Haiku 4.5). |
| Decision Engine | `decision` | synchronous | Frames the Impulse Moment; computes the alignment score. |
| Memory Engine | `memory` | synchronous | Retrieval over pgvector; embeddings written async. |
| Prompt Builder | `prompt` | synchronous | Sole assembler of every prompt; no tables. |
| Safety Engine | `safety` | cross-cutting | Gates every inbound turn; can hard-stop. |
| Learning Engine | `learning` | **async** worker | Mines Lapses/Recoveries into Insights (Opus 4.8). |
| Notification Engine | `notification` | **async** worker | Decides when/whether to Nudge. |

The synchronous path (a coaching turn) and the asynchronous path (learning, notification, embedding) are the backend's central control-flow split — detailed in [`system-context.md`](./system-context.md) and owned by [docs 12 §3](../docs/12%20Backend%20Architecture.md).

---

## Where the reasoning lives

This layer records structure, not the arguments behind it. The **why** behind each decision is captured, immutably, in two logs:

- [`../adr/`](../adr/) — **Architecture Decision Records.** Structural and technical choices (module boundaries, the event bus transport, the extraction triggers). An ADR is required when a change sets architecture; the [architecture-review skill](../.claude/skills/architecture-review/SKILL.md) decides when.
- [`../decisions/`](../decisions/) — **Product / Ethical Decision Records (PDRs).** Choices about user-facing behavior, coaching policy, and ethics — the things the [Constitution](../docs/15%20Constitution.md) cares about.

The binding constraints that flow from all of this live in [`../.rules/`](../.rules/README.md); how we author every asset lives in [`../.claude/CONVENTIONS.md`](../.claude/CONVENTIONS.md). Start any change from the [repository README](../README.md).
