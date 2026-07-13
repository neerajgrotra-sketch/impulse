---
name: feature-design
description: Use when an engineer needs to take a feature from idea to a review-ready spec; it walks the full feature lifecycle stage by stage and outputs a completed feature spec.
---

## Purpose

Guide an engineer through producing a feature spec that satisfies the Impulse feature lifecycle, so that every feature arrives at review already understood, psychologically grounded, and ethically screened — not defended for the first time in the room. The lifecycle is heavy on purpose, but only in proportion to how much a change can hurt a user (`../../CONVENTIONS.md` §2). This skill makes the process concrete: its Checklist *is* the gate list for each stage, and it routes you to the template, the tiering model, and the review skills you must clear.

A spec that only says *what* to build has failed (`../../../docs/00 Canon.md` §10, `../../CONVENTIONS.md` §1). This skill exists to force the *why* — the Problem, the User value, and the Psychological foundation — before a line of the technical design is written.

## When to use

**Tier: set it explicitly, then let it drive the process** (per `../../CONVENTIONS.md` §2):

- **Trivial** (copy fix, pure refactor, dep bump, non-behavioral): you do not need this skill — a PR checklist is enough.
- **Standard** (new endpoint/screen/logic that is NOT sensitive): use this skill for the feature-spec, plus the relevant review skill, plus an ADR if it sets architecture.
- **Sensitive** (touches coaching, safety, memory, privacy, notifications, identity, or the model): the full lifecycle below, with `../behavioral-review/SKILL.md` and the Design Council both required. No exceptions, no shortcuts.

When in doubt, tier **up**. Use this skill at the start of any feature that is Standard or above.

## Inputs

- The problem or idea, in the user's terms — what job the user is hiring this for (`../../CONVENTIONS.md` §4, Christensen lens).
- The tier, chosen against `../../CONVENTIONS.md` §2, with the trigger that put it there.
- The feature-spec template (`../../templates/feature-spec-template.md`) as the working document.
- The canon this feature must obey: vocabulary (`../../../docs/00 Canon.md` §2), engines and their contracts (§4), the data model (§5), the metrics (§7), and cross-cutting constraints (§8).
- The seven principles (`../../../docs/02 Product Philosophy.md`) and the Human Model (`../../../docs/03 Human Model.md`) the feature will touch.

## Outputs

A **completed feature spec** in the template, ready to enter review, that:

- Fills every lifecycle stage up to Technical design (the stages after that are executed, not just specified).
- States the tier and its trigger.
- Records the outcome of each gate below — including the behavioral-review verdict and the Design Council recommendation for Sensitive features.
- Uses canon vocabulary verbatim and cross-links the engines, data-model aggregates, and metrics it affects.

Alongside it, any ADR (`../../templates/adr-template.md`) the architecture stage produced, and any Product/Ethical Decision Record (`../../templates/pdr-template.md`) the ethical review produced.

## Checklist

The feature lifecycle is: **Problem → User value → Psychological foundation → Ethical review → Architecture review → Design Council → Technical design → Implementation → Testing → Release → Post-release evaluation.** Each stage below is a gate: do not pass one before its boxes are checked.

### 1. Problem
- [ ] The problem is stated in the user's terms, not the solution's. Name the job the user hired this for (Christensen lens, `../../CONVENTIONS.md` §4).
- [ ] The problem is real for the Future Self, not just relief for the Present Self (`../../../docs/02 Product Philosophy.md` §1.1).

### 2. User value
- [ ] The value is expressed as change in the North Star — Aligned Decision Rate, recovery-weighted (`../../../docs/00 Canon.md` §7) — not in minutes, sessions, or streaks (anti-metrics).
- [ ] No guardrail metric degrades: trust, "the app gets me," crisis-handoff correctness, notification opt-out rate, zero shaming incidents.
- [ ] Focus check (Jobs lens): what did we say *no* to? The feature is whole, not a pile.

### 3. Psychological foundation
- [ ] The feature is grounded in named behavioral science from the thinker→principle map (`../../CONVENTIONS.md` §4) and the Human Model's three lenses — Identity, Emotion, Behavior (`../../../docs/03 Human Model.md`).
- [ ] It reinforces an **Identity Statement**, not a goal (principle 1.4).
- [ ] For every bias it engages, it is stated whether we mitigate or exploit it — exploitation is disqualifying (Kahneman lens).

### 4. Ethical review — GATE
- [ ] For Sensitive features: run `../behavioral-review/SKILL.md` in full and record its PASS / CONDITIONAL / BLOCK verdict. A BLOCK stops the feature here.
- [ ] Present-Self-consent rule confirmed: every proactive action checks a consent scope (`../../../docs/00 Canon.md` §8, `../../../docs/02 Product Philosophy.md` §2(a)).
- [ ] Safety Engine routing confirmed for any surface that could receive a crisis signal (`../../../docs/00 Canon.md` §4).
- [ ] The decision is captured as a Product/Ethical Decision Record if it sets user-facing or coaching policy (`../../CONVENTIONS.md` §3).

### 5. Architecture review
- [ ] The feature respects engine boundaries: engines own their state and never reach into each other's storage; the Coach Engine is the only orchestrator (`../../../docs/00 Canon.md` §4).
- [ ] Any change to context assembly goes through the Prompt Builder; no raw model access from feature code (`../../../docs/00 Canon.md` §6).
- [ ] If the change sets architecture, an ADR is drafted (`../../templates/adr-template.md`, `../../CONVENTIONS.md` §3).
- [ ] Data-model impact is mapped to the canonical aggregates (`../../../docs/00 Canon.md` §5); Identity remains the root.

### 6. Design Council — GATE (Sensitive)
- [ ] Behavioral-review passed *before* entering the Council (it is the prerequisite gate, not a substitute — `../behavioral-review/SKILL.md`).
- [ ] The Council (`../design-council/SKILL.md`) ran the full multi-lens panel and produced, per engaged lens: agreement · conflicts · tradeoffs · open questions · recommendation (`../../CONVENTIONS.md` §4).
- [ ] The Council's recommendation is recorded in the spec, with any conditions carried into the technical design.

### 7. Technical design
- [ ] Interfaces, storage, events, and the structured-output schema are specified against the modular-monolith and LLM-gateway rules (`../../../docs/00 Canon.md` §6).
- [ ] Understand-before-advise is enforceable in code where the feature emits coaching (`../../../docs/00 Canon.md` §8).
- [ ] Explainability is designed in: any Insight or inference carries evidence_refs (`../../../docs/00 Canon.md` §5, §8).

### 8. Implementation
- [ ] Built to the technical design; deviations are folded back into the spec, not left implicit.
- [ ] Tone/lint pass on any Coach output is wired in (banned-word list, `../../../docs/00 Canon.md` §2, §8).

### 9. Testing
- [ ] Eval harness covers the coaching/behavioral surface, including the failure criteria from `../behavioral-review/SKILL.md`.
- [ ] Consent-scope and Safety-Engine paths are tested, not assumed.

### 10. Release
- [ ] Metrics wired to the North Star and guardrails before, not after, ship.
- [ ] Rollout respects the tier: Sensitive features do not ship without every gate above cleared.

### 11. Post-release evaluation
- [ ] North Star and guardrails read after release; any degradation in trust or shaming-incident count triggers rollback review.
- [ ] Learnings feed back into the spec and, if a policy changed, into a Product/Ethical Decision Record.

## Success criteria

- The spec fills every lifecycle stage through Technical design, in the template, with the tier and its trigger stated.
- Each gate records an outcome: behavioral-review verdict and Design Council recommendation are present for Sensitive features.
- Problem, User value, and Psychological foundation are written and grounded in named science before any technical design.
- Value is expressed against the North Star and no guardrail is shown to degrade.
- Canon vocabulary is used verbatim; affected engines, aggregates, and metrics are cross-linked.
- Every proactive action has a consent scope and every coaching surface has a Safety route.

## Failure criteria

- The spec starts at Technical design — no Problem, User value, or Psychological foundation.
- A Sensitive feature enters the Design Council without a passing behavioral-review, or ships with any gate skipped.
- Value is justified by an anti-metric (streaks, minutes, sessions) or a guardrail is allowed to degrade.
- A proactive action ships without a consent scope, or a coaching surface has no Safety route.
- The tier is unstated, or a Sensitive change is run as Standard to avoid the process.
- The spec says only *what* to build, not *why* — no principle or science cited.
- A synonym is invented for a canon term.
