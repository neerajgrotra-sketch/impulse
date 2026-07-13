# The Impulse Rule System

**Purpose:** explain how our RULE files work — what a rule is, how we phrase it, how it's enforced, and where every rule lives — so that a human or agent can find the binding constraint for any change and know what happens if they break it. **Scope:** every `.rules/*.md` file and everyone (human or agent) who writes code, prompts, or product behavior in this repo.

Rules are the **binding constraints** of the Impulse Engineering OS. The [Canon](../docs/00%20Canon.md) says *what* we build; the [Conventions](../.claude/CONVENTIONS.md) say *how we author assets*; these rules say *what you must, should, and must never do* when you build. If a rule contradicts the Canon, the Canon wins and the rule is a bug — fix it.

---

## What a rule is

A rule is a single enforceable constraint written as a **MUST / SHOULD / MAY / NEVER** statement plus a one-line **WHY**. The WHY is not decoration: a rule without a reason gets cargo-culted or ignored, and cannot be applied with judgment to a case its author didn't foresee. If you can't state why, it isn't a rule yet.

We use [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) keywords with their exact meanings:

| Keyword | Meaning |
|---|---|
| **MUST** | Absolute requirement. Violation blocks merge. No judgment call. |
| **NEVER** | Absolute prohibition. Same weight as MUST; used when the natural phrasing is a ban. |
| **SHOULD** | Strong default. Deviation is allowed only with a stated reason in the PR (and an ADR/PDR if it sets precedent). |
| **MAY** | Genuinely optional. Documented so nobody re-litigates it. |

A file that is all SHOULDs is a style guide, not a rule set. Reserve MUST/NEVER for the constraints that protect a user or the architecture.

## The tiering model (read this before you decide how hard a rule bites)

Every rule inherits the [change-tiering model](../.claude/CONVENTIONS.md#2-the-change-tiering-model-the-central-simplifying-principle). The OS is heavy **only for changes that can hurt a user**:

| Tier | Trigger | Process |
|---|---|---|
| **Trivial** | copy fix, pure refactor, dep bump, non-behavioral change | PR checklist only |
| **Standard** | new endpoint/screen/logic that is NOT sensitive | feature-spec + relevant review skill + ADR *if* it sets architecture |
| **Sensitive** | touches **coaching, safety, memory, privacy, notifications, identity, or the model** | full feature lifecycle + Design Council + ethical review. No exceptions. |

A rule's MUST bites hardest at the Sensitive tier. **When in doubt, tier up** — over-reviewing a trivial change costs minutes; under-reviewing a coaching change costs a user's trust.

## How rules are enforced

We enforce with four layers, in increasing order of trust in the machine and decreasing order of trust in the human's memory:

1. **CI** — automated gates that cannot be argued with: tests, type checks, migration linters, the banned-word tone pass on Coach output, the eval-gate on prompt changes, secret scanning. If it can be a CI check, it MUST be one; a rule enforced only by good intentions is not enforced.
2. **Review skills** (`.claude/skills/`) — an agent or reviewer runs the relevant skill (e.g. backend review, prompt review, security review) whose checklist maps to these rules. Skills carry the judgment CI can't.
3. **Checklists** (`.claude/checklists/`) — copy-pasteable `- [ ]` gates on the PR, grouped by tier and phase, each cluster cross-linked to the rule it enforces.
4. **Human judgment** — the Design Council and ethical review for Sensitive-tier work. Some things (tone, dignity, "does this serve Future Self") cannot be linted; a person owns them.

Each rule file ends with a **"How this is enforced"** note naming which of these layers apply. If none do, the rule is aspirational — either wire up enforcement or delete it.

## How to change a rule

- **Trivial** wording/clarity fixes: normal PR, checklist only.
- **Adding, removing, or weakening a MUST/NEVER**: this is at least a **Standard** change and usually **Sensitive** if it touches coaching, safety, memory, privacy, notifications, identity, or the model. Open an [ADR](../adr/) (architecture) or [PDR](../decisions/) (user-facing behavior/ethics) recording what changed and why. Rules that guard the Covenant are Sensitive by definition.
- Rules are versioned with the code they govern. **Never** silently loosen a rule to make a red build pass — that inverts the point of the rule.

## Index — every rule file

| Rule file | Governs | Status |
|---|---|---|
| [architecture.md](./architecture.md) | Clean architecture, engines as bounded contexts, the Coach Engine as sole orchestrator, modular-monolith discipline, when an ADR is required | Written |
| [backend.md](./backend.md) | Python/FastAPI, module-owned tables, the sync coaching latency budget, the LLM gateway as sole model egress, idempotency, errors, rate limits, secrets | Written |
| [ios.md](./ios.md) | SwiftUI + MVVM + Coordinator, offline-first, graceful degradation with no signal, no logic in views, the moment surfaces | Written |
| [swift.md](./swift.md) | Swift language conventions: value types, optionals, async/await + actors, error handling, access control, no force-unwrap in production | Written |
| [ai.md](./ai.md) | The LLM as scoped tool not brain, backend-owned state/policy/safety, determinism, mockability, tiered models, deterministic fallback coach | Written |
| [prompt-engineering.md](./prompt-engineering.md) | Layered prompts, structured/JSON-schema output, guardrails, the banned-word list, prompts-are-deploys, versioning, caching | Written |
| [database.md](./database.md) | Postgres + pgvector, module-owned tables, forward-only migrations, privacy-at-rest, right-to-be-forgotten, no PII in logs, alignment_score never exposed | Written |
| [performance.md](./performance.md) | Latency budget on the coaching path, LLM cost/tiering, Memory-retrieval bounds, iOS responsiveness/battery, load & degradation behavior | Written |
| [security.md](./security.md) | AuthN/Z, secret handling, egress control, threat surface of a trust product | Written |
| [privacy.md](./privacy.md) | The Covenant in code: consent scopes, data minimization, retention, subject rights | Written |
| [accessibility.md](./accessibility.md) | The moment must work for everyone: Dynamic Type, VoiceOver, contrast, reduced motion | Written |
| [documentation.md](./documentation.md) | Canon vocabulary, the WHY mandate, doc/ADR/PDR upkeep | Written |
| [naming.md](./naming.md) | Canon terms verbatim, no synonyms, engine/aggregate naming | Written |
| [git.md](./git.md) | Branching, commit hygiene, PR tiering labels, review gates | Written |
| [testing.md](./testing.md) | Test pyramid, eval harness, determinism of the fallback coach, coverage of Sensitive paths | Written |
| [reviews.md](./reviews.md) | Which review skill runs at which tier, Design Council, ethical review | Written |
| [research.md](./research.md) | Evidence discipline: citation/labeling rules, no fabrication, hypotheses-until-validated, the mandatory Architecture Impact section | Written |

Planned files do not exist yet. Per [Conventions §5](../.claude/CONVENTIONS.md#5-what-we-do-not-create) we do not create placeholder files — a planned row becomes a written file only when it has real, opinionated rules to state.

---

**How this is enforced:** this README is enforced by convention and review — a reviewer checks that new rule files match the format below and are linked here. The index MUST stay in sync with the contents of `.rules/`; a CI check verifies every `.rules/*.md` file appears in this table and every "Written" link resolves.
