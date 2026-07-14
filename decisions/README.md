# Product & Ethical Decision Records (PDRs)

> **Status:** Living index. **Audience:** every human and agent who changes what Impulse does *to or for a user*.
> **Purpose:** Record the decisions about **user-facing behavior, ethics, and coaching policy** — the things `docs/15 Constitution.md` cares about — as an auditable, immutable trail. A coaching company that holds the record of a person's worst moments must be able to show its own record: *which ethical choices we made, when, and why.*

This directory is that record. It is deliberately separate from `adr/` (technical architecture). The separation is not bureaucratic tidiness — it is a Covenant obligation. Our promise (`15 Constitution.md` §2) is that nothing about the user is a black box to the user; the same discipline applies to us. Every choice that shapes what the user experiences is written down here, in plain language, and never quietly edited away.

---

## 1. What a PDR is — and what it is not

A **PDR** records a decision about **USER-FACING BEHAVIOR, ETHICS, COACHING POLICY, METRICS, or the Covenant**. An **ADR** (`adr/`, `.claude/templates/adr-template.md`) records a decision about **technical architecture** — how the system is built, not what it does to the user.

The test: *If a thoughtful user asked "why does the product treat me this way?", would the answer be in this decision?* If yes, it is a PDR. If the answer is only "because that's how the system is wired," it is an ADR.

The two often pair up: a single feature can produce **both** a PDR (the policy) and an ADR (the mechanism). When in doubt about a decision that has both a user-facing and a technical face, write **both** and cross-link them.

### PDR examples (what belongs here)

- **The North Star is recovery-weighted Aligned Decision Rate** (`0001`). A metric choice that encodes "progress over perfection" — it changes what success *means* for the user. Ethics + metrics.
- **We refuse streaks and DAU-minutes as success metrics** (`0002`). A policy about what we will *never* optimize, because engagement bought with anxiety is a loss. Coaching policy + ethics.
- **No advertising, no data sale** (`0003`). The Covenant's business-model promise. Pure ethics.
- **The Coach pursues Future Self's interests only with Present Self's consent** (`0004`). The load-bearing coaching-policy decision — the hinge between coaching and coercion.

### ADR examples (what does NOT belong here — it lives in `adr/`)

- **Modular monolith in Python + FastAPI, one deployable** (`00 Canon.md` §6). An architecture choice the user never feels directly. Technical.
- **PostgreSQL as system of record; pgvector for Memory embeddings; Redis for queues** (`00 Canon.md` §6). Storage engines. Technical.
- **Engines communicate over an internal event bus; the Coach Engine is the sole orchestrator** (`00 Canon.md` §4). Internal topology. Technical.

The boundary case worth naming: the LLM tiering (Haiku for triage, Sonnet for dialogue, Opus for synthesis) is an **ADR** — it is a cost/latency architecture decision. But the rule that *the model never has the final word on suppressing a safety escalation* (`15 Constitution.md` §3.1) is a **PDR** — it is a policy that protects the user. Same feature, two records.

---

## 2. When a PDR is REQUIRED

A PDR is **required** — no exceptions — for any decision that affects:

- **user-facing behavior** (what the product says, does, shows, or withholds),
- **coaching policy** (Coaching Moves, tone, when we advise vs. coach vs. stay silent),
- **ethics** (anything touching the red lines in `15 Constitution.md` §6),
- **metrics** (what we optimize, guardrail, or refuse — `00 Canon.md` §7), or
- **the Covenant** (`15 Constitution.md` §2 — any promise about the user's data or dignity).

**Every such decision is Sensitive tier by definition** (`.claude/CONVENTIONS.md` §2). There is no Trivial or Standard PDR. If a change is big enough to need a PDR, it is big enough for the full Sensitive-tier process — feature lifecycle, Design Council, and ethical review. When in doubt whether a decision needs a PDR, write one: the cost of an unnecessary PDR is a few minutes; the cost of an unrecorded ethical choice is a user's trust and an un-auditable history.

A PDR does **not** replace the feature spec — it records the *decision*; the spec (`.claude/templates/feature-spec.md`) records the *implementation*. A Sensitive feature spec links its PDR (feature-spec §4).

---

## 3. Status lifecycle

Identical to ADRs (`.claude/CONVENTIONS.md` §3):

```
Proposed  →  Accepted  →  Superseded | Deprecated
```

- **Proposed** — under review; not yet binding. Design Council and ethical review happen here.
- **Accepted** — the decision is in force. It governs the product from this point.
- **Superseded** — replaced by a later PDR. The old record stays; it points to its successor, and the successor points back.
- **Deprecated** — no longer in force and not replaced (the decision simply no longer applies).

Because the Covenant can only **ratchet toward the user** (`15 Constitution.md` §8), a PDR that *weakens* a user protection faces the highest bar and a founder-level decision; one that *strengthens* protection can move quickly.

---

## 4. Immutability

**An Accepted PDR is immutable. We supersede; we never edit the decision.** This is the whole point of the record: if we could quietly rewrite our past ethical choices, the audit trail would be worthless, and the Covenant's transparency promise (`15 Constitution.md` §2.6, §8: "no silent edits") would be a lie. To change a decision, write a *new* PDR that supersedes the old one, and update the `Status` and cross-links of both. The reasoning for the change lives in the new record, where a future reader — including the user whose worst moment we hold — can see exactly what changed and why.

(Fixing a typo or a broken link in an Accepted PDR is allowed; changing its *meaning* is not.)

---

## 5. Numbering

- Four-digit, zero-padded, **monotonic**: `0001`, `0002`, … Never reuse a number, even for a superseded PDR.
- Filename: `NNNN-kebab-case-title.md` (e.g. `0001-recovery-weighted-north-star.md`).
- The number is permanent and citable — feature specs, ADRs, and eval records link PDRs by number.

---

## 6. Template

Every PDR uses **`.claude/templates/pdr-template.md`**. Required sections, in order: **Context · Decision · Consequences · Constitution / Covenant impact · How we'll know if this was wrong · Alternatives considered · Links.** The "how we'll know if this was wrong" section is non-optional — a decision we cannot falsify is dogma, not engineering.

---

## 7. Index

| PDR | Title | Status | Date | Deciders |
|---|---|---|---|---|
| [0001](0001-recovery-weighted-north-star.md) | Recovery-weighted Aligned Decision Rate is the North Star | Accepted | 2026-07 | Founding Team |
| [0002](0002-streaks-are-an-anti-metric.md) | Streaks and DAU-minutes are anti-metrics | Accepted | 2026-07 | Founding Team |
| [0003](0003-no-ads-no-data-sale.md) | No advertising model; we never sell or rent user data | Accepted | 2026-07 | Founding Team |
| [0004](0004-future-self-only-with-present-consent.md) | The Coach pursues Future Self's interests only with Present Self's consent | Accepted | 2026-07 | Founding Team |
| [0005](0005-product-never-outruns-evidence.md) | The product never outruns the evidence (research-driven policy) | Accepted | 2026-07 | Founding Team |
| [0006](0006-onboarding-rejects-fixed-interview-requires-safety-gate.md) | Onboarding rejects the fixed cold-open interview and requires per-turn safety screening | Accepted | 2026-07 | Neeraj Grotra (founder), via Design Council review |
| [0007](0007-identity-thought-stream-scope-expansion.md) | Identity capture expands from static starter chips to a reviewed thought-stream interaction | Accepted | 2026-07 | Neeraj Grotra (founder), via behavioral-review + Design Council review |
