---
name: architecture-review
description: Use when a change alters module boundaries, cross-engine communication, orchestration, storage ownership, or the deployable shape of the backend, to verify it preserves the modular monolith's integrity and to decide whether an ADR is required.
---

## Purpose

Impulse is a **modular monolith** where each engine (Identity, Emotion, Decision, Memory, Coach, Learning, Notification, Prompt Builder, Safety) is a bounded context with a stable interface and private storage (Canon §4, §6). The value of this shape is that internals can change freely while the seams stay honest — but only if the seams are policed on every change. This skill catches boundary erosion before it compounds into the microservice-shaped mess we chose *not* to build, and forces an ADR when a change sets architecture rather than just following it.

Enforces [`.rules/architecture.md`](../../../.rules/architecture.md). Defers to [`.rules/backend.md`](../../../.rules/backend.md) for intra-module FastAPI concerns and to [`.rules/database.md`](../../../.rules/database.md) for table ownership at rest.

## When to use

**Tier: Standard and Sensitive.** Run on any change that adds/moves a module, changes an engine's public interface, introduces cross-engine calls or event-bus topics, touches the Coach Engine's orchestration, alters the deployable/packaging structure, or reaches across a bounded context. A Sensitive change (coaching, safety, memory, privacy, notifications, identity, or the model — CONVENTIONS §2) that also shifts architecture requires this skill **and** a Design Council review; this skill does not replace ethical review. Trivial changes (pure refactor within one module, dep bump) do not need it.

## Inputs

- The diff or PR under review, with the full file paths of every changed module.
- The current module/engine map and the public interface of each affected engine (Canon §4).
- Any new or changed event-bus topics and their producers/consumers (Canon §4, §6).
- The change's declared tier and, if Sensitive, its feature-spec.
- The existing `adr/` directory, to check whether the decision is already recorded or contradicts an Accepted ADR.

## Outputs

- A pass/block verdict per checklist item, each citing the specific rule in `.rules/architecture.md` and the file/line at fault.
- An explicit **ADR-required: yes/no** determination with the reason. If yes, a one-line proposed ADR title and the decision it must capture.
- A list of any bounded-context violations with the exact seam crossed and the compliant alternative (event-bus topic or engine interface call).
- A block if the change contradicts an Accepted ADR, naming the ADR.

## Checklist

- [ ] **Bounded-context integrity:** every engine touched still exposes one stable public interface; no caller depends on another engine's internal types, private functions, or file layout. Internals may change; the seam may not (Canon §4).
- [ ] **Dependency direction:** dependencies point inward toward the domain, never outward from a domain module to a delivery/framework concern; no engine imports another engine's implementation module (only its published interface or an event).
- [ ] **No cross-module storage reach-in:** no engine reads or writes another engine's tables/store directly — engines communicate over the internal **event bus** or published interfaces only (Canon §4: "they never reach into each other's storage"). Verify against table ownership in `.rules/database.md`.
- [ ] **Coach Engine as sole orchestrator:** any new per-turn composition of engines lives in the Coach Engine. No other engine, endpoint, or client fans out to multiple engines to assemble a turn (Canon §4: "the Coach Engine is the only orchestrator").
- [ ] **LLM-as-tool:** no new decision-making authority is moved into the model; the backend still owns state, policy, and safety, and the LLM stays a scoped tool called via the Prompt Builder (Canon §4, §6). No raw model access added outside the LLM gateway / Prompt Builder.
- [ ] **Safety pre-emption preserved:** the change does not create an inbound-message path that bypasses the Safety Engine's hard-stop (Canon §4, §8).
- [ ] **Monolith discipline:** the change stays one deployable; no new independently-deployed service, no network hop introduced where an in-process interface call suffices (Canon §6: "one deployable until pain demands otherwise").
- [ ] **Event-bus contracts:** any new topic has a named producer, at least one consumer, a versioned payload schema, and does not smuggle another engine's private state as its payload.
- [ ] **ADR decision:** if the change sets architecture (new module, changed engine interface, new cross-cutting pattern, new deployable seam, or a reversal of a prior decision) an ADR is authored/updated per CONVENTIONS §3; if it merely follows existing architecture, no ADR is required and this is stated.
- [ ] **No contradiction of Accepted ADRs:** the change is checked against `adr/`; anything conflicting with an Accepted ADR is blocked pending a superseding ADR (ADRs are immutable once Accepted — supersede, never edit).
- [ ] **Canon vocabulary:** new module, interface, and topic names use Canon §2/§4 terms verbatim; no synonym is introduced for an engine or aggregate.

## Success criteria

- Every changed engine still has exactly one public interface and no external caller reaches its internals or storage — verifiable by grep for cross-module imports and direct table access.
- Zero direct cross-engine storage access in the diff; all cross-engine communication is via published interface or event-bus topic with a versioned schema.
- All per-turn multi-engine composition resides in the Coach Engine only.
- The build remains a single deployable and introduces no new network service.
- An explicit ADR-required verdict is recorded, and no Accepted ADR is contradicted.

## Failure criteria

- Any module imports another engine's internal module, or reads/writes a table it does not own.
- A non-Coach component orchestrates two or more engines to compose a turn.
- The model is given decision authority, or feature code calls the model outside the Prompt Builder / LLM gateway.
- An inbound-message path bypasses the Safety Engine.
- A new independently-deployable service or unnecessary network hop is introduced.
- The change sets architecture but ships without an ADR, or contradicts an Accepted ADR without superseding it.
