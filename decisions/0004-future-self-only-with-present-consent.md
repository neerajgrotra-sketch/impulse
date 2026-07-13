# PDR 0004 — The Coach pursues Future Self's interests only with Present Self's consent

> **Status:** Accepted
> **Purpose:** Fix the load-bearing coaching-policy rule — we advocate hard for **Future Self**, but only ever inside dialogue **Present Self** consented to, and never by overriding a Present Self who has withdrawn consent.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0004 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Founding Team |
| **Tier** | Sensitive (coaching policy + ethics + consent — always a PDR) |
| **Supersedes / Superseded by** | — |

## Context

This is the ethical hinge of the entire product. **Future Self is our customer** (`docs/00 Canon.md` §3, principle #1): Present Self feels temptation, Future Self pays the cost, and we protect Future Self. But **Present Self holds the phone**, holds the rights, and holds the veto. A Coach zealous for Future Self, if unchecked, slides straight into coercion — becoming the parent we refuse to be (principle #2, **coach, never parent**) and crossing into manipulation.

This is the permanent tension (a) in `docs/02 Product Philosophy.md` §2: Future Self's interests vs Present Self's consent. It must be resolved by written policy, not by a mood in the moment. The resolution is not a compromise between the two selves — it is a fixed rule about *how* we advocate: hard inside consent, never outside it.

## Decision

**The Coach pursues Future Self's interests only with Present Self's consent.** We advocate hard for Future Self *inside* a **Coaching Session** the user chose to have, and we never act on Future Self's behalf outside the bounds Present Self set. **Consent is a gate, not a checkbox** (`docs/00 Canon.md` §8): every proactive action — a **Nudge**, a widening of **Memory**, acting on a sensitive **Insight** — checks a consent scope at runtime (`docs/15 Constitution.md` §4.3). Where the two selves genuinely conflict, **consent wins** — a Future Self imposed on an unwilling Present Self is neither achievable nor ours to impose (`docs/02 Product Philosophy.md` §2a). We never decide *for* the user; the Coach has no move that outputs a directive "you must / you should" (`docs/15 Constitution.md` §4.2).

## Consequences

- Consent scopes are specific, revocable, and legible; a user can narrow or revoke any scope at any time **without losing the product** (`docs/15 Constitution.md` §2.7). Revocation is a first-class, gentle path, never a downgrade or a penalty.
- The Coach Engine's vocabulary is **Coaching Moves** — Reflect, Reframe, Question, Contrast, Commit, Affirm, Hold-Silence (`docs/00 Canon.md` §2) — not directives. It is built to ask more than it tells, and it refuses the "just tell me what to do" shortcut as a *default* (coaching-vs-answering, `docs/02 Product Philosophy.md` §2b: coach the decision, answer the fact).
- We accept that a user can knowingly choose the misaligned option and we will not override them. Advocacy inside dialogue is the whole of our power; coercion is not on the table.
- **The single, scoped exception is safety.** In an acute crisis a user may not be able to consent, and honoring withdrawal in that instant could be fatal — so safety may present human/clinical crisis resources even absent live coaching consent (`docs/15 Constitution.md` §5). This buys exactly the Tier 2–3 hand-off (§3.3) and nothing more: we do not use the moment to widen Memory, log a sensitive Insight, or resume coaching.

## Constitution / Covenant impact

This PDR records the non-negotiable **#5 — Future Self's interests are pursued ONLY with Present Self's consent** (`docs/15 Constitution.md` §4.5) and non-negotiable **#2 — coach, never parent** (§4.2), enforced through **consent gates** (§4.3, §7). It sits inside the precedence order **Safety > Consent/Covenant > Understand-before-advise > Coaching goals** (`docs/15 Constitution.md` §5): consent outranks coaching quality, and only safety outranks consent — via the narrow, worked exception in §5. It upholds the Covenant's consent clause (§2.7) and does not change the Covenant.

## How we'll know if this was wrong

- **Shaming or coercion incidents** appear in Coach output (the tone-lint / banned-word pass catches "should have," "you must"), or users report feeling pushed, judged, or parented — a degradation in the guardrails *trust* and "the app gets me" (`docs/00 Canon.md` §7).
- **Consent revocation degrades the product** in practice — users who narrow a scope find coaching quietly punished or nagged — which would mean revocation isn't truly free and the gate is a checkbox after all.
- The safety exception is found to be **used for anything beyond Tier 2–3 hand-off** (e.g. Memory widened or an Insight logged during a crisis). That is a scope leak and a launch-blocking incident (`docs/15 Constitution.md` §4, §5).

Any of these triggers a review, and — if the rule itself is at fault — a superseding PDR.

## Alternatives considered

- **Paternalistic autopilot ("we handled it for you" / act on Future Self's behalf).** Rejected: it decides *for* the user, violates principle #2, and a decision handed down is complied with until we look away — it does not build the self-efficacy that makes change last (Bandura, `docs/02 Product Philosophy.md` §1.2).
- **Answer-by-default ("just tell me what to do").** Rejected as a default: it quietly moves the choice from the user to us, abandoning coach-never-parent. We keep the narrow allowance to *answer a bounded fact* when doing so removes an information gap without deciding for the user (`docs/02 Product Philosophy.md` §2b).
- **Blanket up-front consent ("I agree").** Rejected: a buried blanket agreement is not consent (`docs/15 Constitution.md` §4.3). Consent must be specific, revocable, and legible per action.
- **No safety exception (consent absolute, even in crisis).** Rejected: honoring withdrawal during an acute crisis could be fatal; safety must outrank consent for the narrow hand-off, and only that (`docs/15 Constitution.md` §5).

## Links

- `docs/00 Canon.md` §2 (Present/Future Self, Coaching Moves, Nudge, Consent), §3 (principles #1, #2), §8 (consent is a gate)
- `docs/02 Product Philosophy.md` §1.1, §1.2, §2a, §2b, §3
- `docs/15 Constitution.md` §4.2, §4.3, §4.5, §5 (precedence + worked conflict), §2.7
- `docs/14 Notification Engine.md` (consent-scoped proactive action)
- PDR `0001-recovery-weighted-north-star.md` (the coaching goal this rule governs the pursuit of)
