# PDR 0006 — Onboarding rejects the fixed cold-open interview and requires per-turn safety screening

> **Status:** Accepted
> **Purpose:** Reject the eight-question fixed onboarding interview as built (`prototype/expo/constants/onboardingQuestions.ts`), and fix as binding policy that onboarding must match `docs/05 Onboarding.md`'s minimal design and may not collect further answers without per-turn Safety Engine screening.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0006 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Neeraj Grotra (founder), via Design Council review |
| **Tier** | Sensitive (onboarding, identity capture, safety — always a PDR) |
| **Supersedes / Superseded by** | — |

## Context

The Expo prototype's onboarding conversation ships eight fixed, cold-open questions — spanning identity, life reflection, decision-making style, relapse triggers, and self-talk — answered in one unbroken sitting (voice or typed), with a single "Human Blueprint" generated only after all eight are collected. This was ported verbatim from an earlier Swift prototype and had never been checked against `docs/05 Onboarding.md`, the document that actually owns onboarding design.

Founder testing on a physical device surfaced the problem directly: the questions read as generic and unrealistic for a typical user to answer well cold, with no warm-up. A Design Council session (8 of 15 lenses engaged: Fogg, Krug, Kahneman, Christensen, Bandura, Rams, Jobs, Dweck) was convened to evaluate the methodology, not just the wording, against `docs/05 Onboarding.md` and `docs/02 Product Philosophy.md`.

Two findings emerged, independently decisive:

1. **Scope and sequencing.** Every engaged behavioral/design lens converged on the same diagnosis: this is design-by-addition against a spec that explicitly refuses it. `docs/05 Onboarding.md` §2–4 calls for one to two open identity prompts plus one tiny reflection ("almost embarrassingly small... success is nearly guaranteed"; "one good Identity Statement beats twenty survey answers") — not an eight-item battery covering six distinct kinds of content in one sitting, closing on a delayed, all-at-once deliverable instead of the Step 5 in-sequence coaching touch the spec requires.
2. **A verified safety gap.** Direct code inspection (`services/blueprintApi.ts`, `prototype/backend/supabase/functions/generate-blueprint/index.ts`) confirmed all eight answers are batched into a single backend call fired only after question 8, and the backend function contains no crisis- or risk-detection logic anywhere. `docs/05 Onboarding.md` §6.2 and `docs/15 Constitution.md` §3 are unconditional: the Safety Engine inspects **every inbound message**, including onboarding text, with no exemption, and can pre-empt the entire sequence. As built, a disclosure of acute distress in an early answer would go unseen until all eight were already collected, and nothing downstream would act on it regardless.

## Decision

**We reject the fixed eight-question onboarding interview as built.** Onboarding must be rebuilt to match `docs/05 Onboarding.md`'s documented sequence — Welcome, one to two open identity prompts (with tap-to-pick starters as an escape hatch), one tiny Reflection, the Covenant/consent moment, and one light Reflect/Affirm coaching touch — not a fixed multi-question battery culminating in a delayed comprehensive output.

**We refuse to collect further onboarding answers from a user without per-turn Safety Engine screening in the loop**, with the authority to pre-empt the remaining sequence on elevated risk. A single batched safety pass after all answers are already collected does not satisfy this — screening must happen on each inbound message, in real time, before the next question is asked.

## Consequences

- The eight-question form is removed from the onboarding flow. Content from `trigger`, `self_talk`, and `decision_style` may be retained, but only relocated to a later, trust-earned Reflection or Decision context — never asked cold, before the user has seen the Coach demonstrate a Reflect-not-advise response once.
- A comprehensive "Human Blueprint" deliverable may still have a place in the product later, but not as onboarding — if pursued, it needs its own spec, its own explicit consent framing, and its own Design Council pass, separate from this one.
- No onboarding answer may reach the backend, or advance the sequence, without having passed a real-time risk check first. This is a build-blocking condition, not an aspiration: onboarding may not ship to real users until it exists.
- Onboarding's near-term scope shrinks materially — fewer data points captured on day one — which is accepted deliberately per `docs/05 Onboarding.md` §1's explicit refusal to optimize completion/data volume over Time-to-First-Feeling-Understood.

## Constitution / Covenant impact

This PDR enforces `docs/15 Constitution.md` §3 directly: "the Safety Engine... runs on every inbound message, and can hard-stop any turn. It is the one engine whose failure blocks launch." Onboarding has no carve-out from this — §6.2 of `docs/05 Onboarding.md` says so explicitly, and this PDR makes the current absence of that screening a launch-blocking build condition rather than a known gap. It also upholds principle #3, **understand before advising** (`docs/00 Canon.md` §3), correctly per `docs/05 Onboarding.md`'s own resolution: the Coach Engine's advice-type moves stay gated regardless of how much is captured on day one, so a larger upfront interview does not actually serve this principle any better than the spec's minimal design already does. Does not change the Covenant text itself; `covenant_version` is unaffected.

## How we'll know if this was wrong

- A rebuilt, spec-sized onboarding measurably fails to seed a usable Identity Statement (`values[]`, `identity_statements[]`) for the Identity Engine — i.e., one to two prompts genuinely isn't enough signal, not just a hunch that more would be nicer.
- The Time-to-First-Feeling-Understood metric (`docs/05 Onboarding.md` §1, §8) or the "the app gets me" guardrail (`docs/00 Canon.md` §7) degrades after the rebuild rather than improving — which would mean the diagnosis in this PDR was wrong, not just the old implementation.
- Per-turn safety screening produces an unacceptable rate of false escalation that meaningfully damages the onboarding experience — though per `docs/15 Constitution.md` §3, erring upward on safety is accepted as the cost of not erring downward, so this would need to be severe to count as evidence against this PDR rather than evidence the screening is doing its job.

Any of these triggers a review, and — if the rule itself is at fault — a superseding PDR.

## Alternatives considered

- **Keep the eight questions, rewrite the wording only.** Rejected: the Design Council review found the problem is volume and sequencing, not phrasing — better words on the same eight-question form would still violate `docs/05 Onboarding.md`'s scope and still ship with no safety screening.
- **Keep the eight questions, add a single safety check at the end.** Rejected: this satisfies the letter of "some screening exists" but not the requirement that screening happen on every inbound message with the power to pre-empt the sequence — an end-of-flow check cannot prevent harm during the flow it's checking after.
- **Cut to spec immediately without a Council session.** Rejected: the safety gap in particular was only surfaced by deliberately checking the actual code against `docs/05 Onboarding.md` §6.2 and `docs/15 Constitution.md` §3 — skipping the review risked shipping a narrower but still safety-gapped version.
- **Ship the current form now, fix safety screening in a fast-follow.** Rejected outright: `docs/15 Constitution.md` §3 states the Safety Engine's absence is launch-blocking for any coaching-adjacent surface; there is no fast-follow exception for onboarding.

## Links

- `docs/05 Onboarding.md` §1–4, §6.2, §7 (the spec this decision enforces)
- `docs/00 Canon.md` §3 (principle #3, understand before advising), §4 (Safety Engine), §8 (safety pre-empts everything)
- `docs/02 Product Philosophy.md` §1.3, §3 (precedence order)
- `docs/15 Constitution.md` §3, §3.5, §5 (why safety pre-empts everything, precedence order)
- Design Council report, 2026-07-13 (`prototype/expo/constants/onboardingQuestions.ts` vs `docs/05 Onboarding.md`) — full per-lens findings
- `prototype/expo/services/blueprintApi.ts`, `prototype/backend/supabase/functions/generate-blueprint/index.ts` — code inspected to confirm the safety gap
