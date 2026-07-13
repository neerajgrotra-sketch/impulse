# Architecture Decision Records

> **Status:** Living index. **Audience:** every engineer and agent who changes how Impulse is built.
> **Purpose:** Record the *architectural* decisions we've made and the reasoning behind them, so a future engineer can reconstruct **why** the system is shaped the way it is — not just what it does. The reasoning lives in `docs/`; the *decisions* are pinned here.

This directory is governed by [`.claude/CONVENTIONS.md`](../.claude/CONVENTIONS.md) §3. Read [`docs/00 Canon.md`](../docs/00%20Canon.md) first — every ADR uses its vocabulary verbatim.

---

## 1. What an ADR is — and is NOT

An **ADR** captures a single **architectural or technical** decision: a choice about structure, control flow, the data model, storage, an engine contract, the event flow, or a technology. It is a durable record of a fork in the road and why we took the branch we did.

An ADR is **NOT** the place for a **product, ethical, or coaching-policy** decision. Those — anything about user-facing behavior, tone, consent, or the Covenant — are **Product/Ethical Decision Records (PDRs)** and live in [`decisions/`](../decisions/) using [`.claude/templates/pdr-template.md`](../.claude/templates/pdr-template.md). The split matters: an ADR answers *"how do we build it so it's correct, cheap, and safe?"*; a PDR answers *"is this the right thing to do to a person?"* Some decisions need both — an ADR for the mechanism, a PDR for the promise — and each links the other.

Rule of thumb: **if the decision would change the Constitution's obligations, it's a PDR; if it changes the architecture, it's an ADR.**

## 2. When an ADR is REQUIRED

We tier process by risk (CONVENTIONS §2). ADRs attach to the tier by one test: **does the change set or change architecture?**

| Tier (CONVENTIONS §2) | ADR required? |
|---|---|
| **Trivial** — copy fix, pure refactor, dep bump, non-behavioral change | **No.** Nothing architectural moved. |
| **Standard** — new endpoint/screen/logic, not sensitive | **Only if** it sets or changes architecture — a new engine contract, a data-model change, a new event on the bus, a new technology, or a control-flow split. Otherwise the feature-spec is enough. |
| **Sensitive** — touches coaching, safety, memory, privacy, notifications, identity, or the model | **Yes for any architectural change**, and note that a Sensitive change almost always *also* needs a PDR for its user-facing side. |

Concretely, write an ADR when a change would **set or change**: an engine's public interface (Canon §4), a canonical aggregate or its storage (Canon §5), the event vocabulary or who consumes it, the sync contract, the LLM tiering/gateway, or any Canon §6 technology choice. When in doubt, tier **up** — an unnecessary ADR costs minutes; an undocumented architectural decision costs the next engineer days.

## 3. Status lifecycle

```
Proposed  ──►  Accepted  ──►  Superseded   (replaced by a newer ADR)
                        └──►  Deprecated   (retired without a direct replacement)
```

- **Proposed** — under discussion; not yet the way we build.
- **Accepted** — the decision is in force. This is the source of truth for that part of the architecture.
- **Superseded** — a later ADR replaced it. The record stays; its header points forward (`Superseded by ADR-NNNN`).
- **Deprecated** — no longer in force and not directly replaced.

## 4. Immutable once Accepted — supersede, don't edit

Once an ADR is **Accepted**, its **Decision** and **Context** are frozen. To change the decision, write a **new** ADR that supersedes the old one; update the old ADR's status header to point forward, and nothing else. We never rewrite history in place — the same discipline as our forward-only migrations (`docs/08 Database Architecture.md` §9). A rewritten decision is a decision whose reasoning you can no longer trust; the value of the record is that it says what we knew *at the time*.

(Fixing a typo or a broken link in an Accepted ADR is fine. Changing what was decided, or why, is not.)

## 5. Numbering & format

- **Number monotonically**, zero-padded to four digits: `0001`, `0002`, … Never reuse a number, even for a superseded ADR.
- **Filename:** `adr/NNNN-kebab-case-title.md`.
- **Template:** every ADR uses [`.claude/templates/adr-template.md`](../.claude/templates/adr-template.md) — Context · Decision · Consequences (positive/negative/neutral) · Alternatives considered · Links.
- Add the new ADR to the index in §6 in the same PR.

## 6. Index

| ADR | Title | Status | Records the decision in |
|---|---|---|---|
| [0001](0001-modular-monolith.md) | Modular monolith over microservices | Accepted | `docs/12 Backend Architecture.md` |
| [0002](0002-llm-as-tool-not-brain.md) | LLM is a scoped tool, not the brain | Accepted | `docs/04 AI Brain.md` |
| [0003](0003-identity-as-root-aggregate.md) | Identity, not Goal, is the root aggregate | Accepted | `docs/08 Database Architecture.md` |
| [0004](0004-offline-first-ios.md) | Offline-first iOS client with idempotent sync | Accepted | `docs/11 iOS Navigation.md` |
| [0005](0005-safety-engine-gates-launch.md) | A cross-cutting Safety Engine gates launch | Accepted | `docs/04 AI Brain.md` |
| [0006](0006-tiered-claude-models.md) | Tiered Claude models behind one gateway | Accepted | `docs/04 AI Brain.md` |
| [0007](0007-postgres-pgvector-memory.md) | Postgres + pgvector for the Memory Engine | Accepted | `docs/08 Database Architecture.md` |
