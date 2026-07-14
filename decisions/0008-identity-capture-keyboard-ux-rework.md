# PDR 0008 — Identity-capture keyboard/text-entry UX reworked to explicit modes

> **Status:** Accepted
> **Purpose:** Record the Design Council pass required by PDR 0007 before reworking `IdentityInspirationScreen`'s keyboard/text-entry interaction, and fix its conditions as binding build constraints.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0008 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Neeraj Grotra (founder), via Design Council review |
| **Tier** | Sensitive (onboarding, identity capture — always a PDR) |
| **Supersedes / Superseded by** | Amends `0007` narrowly (identity-capture keyboard/focus behavior only); does not reopen `0006`'s outstanding per-turn safety-screening requirement, which remains unresolved and unaffected. |

## Context

`IdentityInspirationScreen` (accepted under PDR 0007) currently pops the keyboard the instant its vision card is revealed via the thought-tap or "write your own" paths, with no explicit dismiss affordance beyond the OS return key. This produces the exact failure PDR 0006 rebuilt onboarding to avoid: the screen stops feeling like reflection and starts feeling like a form, the keyboard takes over roughly half the screen, and the user has no legible way out of edit mode. PDR 0007 requires "a fresh Design Council pass before, not after, implementation" for any further expansion of this screen, so this PDR records that pass ahead of the code change.

The proposed rework introduces three explicit interaction states — Reflection (orb, thought stream, Speak/Type choice, no keyboard), Capture (Speak keeps keyboard hidden; Type reveals and focuses the card), and a settled post-edit state (card visible with Edit/Continue, keyboard dismissed) — without adding new steps to the onboarding sequence, new data fields, or any change to when/what is submitted.

## Decision

**We accept the three-mode keyboard/text-entry rework of `IdentityInspirationScreen`, conditioned on the Design Council findings below being treated as build-blocking, not advisory.** Eight of fifteen lenses were engaged (Krug, Rams, Fogg, Jobs, Kahneman, Thaler, Christensen, Bandura); all eight converged that today's implicit keyboard takeover is the actual defect and the explicit-choice/explicit-exit model is a net improvement, with no Safety or Consent objection raised. Clear, Dweck, Huberman, Duhigg, Aristotle, Aurelius, and Epictetus were set aside as not biting on an interaction-mechanics-only change.

The review surfaced one build-blocking correctness gap in the current code that the new model requires fixing: the thought-tap and "write your own" paths auto-focus the card today (`pendingAutoFocusRef`), which directly contradicts the new rule that the keyboard never appears automatically — only an explicit "Type" choice or an explicit Edit tap may summon it.

## Consequences

- The screen's interaction surface grows from an implicit two-state model (hidden/revealed-and-editing) to an explicit three-state model (Reflection/Capture/Settled), with the state transitions required to read as one continuous animated flow rather than three distinct screens (Jobs's-lens condition).
- Thought-tap, "write your own," and voice-completion reveal paths change behavior: they now land in the settled (unfocused) state, not an auto-focused one. This is a behavior change to existing, tested paths in `IdentityInspirationScreen.test.tsx` and must be reflected in updated tests, not just new ones.
- A new shared keyboard-dismiss handler is introduced (return key, iOS accessory button, tap-outside all route through it); no new state machine duplicates `useThoughtScheduler`'s existing `paused` derivation.
- PDR 0006's outstanding, launch-blocking per-turn Safety Engine screening gap is unaffected and unresolved by this work; this PDR does not claim to address it.
- PDR 0007's binding property — voice-derived text never persists before explicit `Continue` — is preserved unchanged in the new settled-card view.

## Constitution / Covenant impact

No Covenant text change; `covenant_version` unaffected. Engages principle #2 (Coach, never parent) and principle #7 (Earn the right to hold this data) only indirectly, through Consent: the review confirmed PDR 0007's no-persistence-before-confirmation property survives this rework unchanged, which is why the finding was checked explicitly rather than assumed. Safety and per-turn screening (PDR 0006) are explicitly out of scope and not touched.

## How we'll know if this was wrong

- If real-user testing shows the three modes read as visibly separate screens rather than one continuous "thinking" experience (the Jobs's-lens risk named in review), the transition design — not just its animation timing — needs revisiting.
- If Time-to-First-Feeling-Understood (`docs/05 Onboarding.md` §1, §8) or the "the app gets me" guardrail (`docs/00 Canon.md` §7) degrades after this rework rather than improving, the diagnosis that implicit keyboard takeover was the defect would be wrong, not just this fix.
- If the explicit Speak/Type choice screen itself becomes a source of hesitation or abandonment (measurable via onboarding funnel drop-off at this exact screen), Thaler's-lens "friction at the right moment" judgment call would need revisiting.

## Alternatives considered

- **Patch only the missing dismiss affordance (add a "Done" button, keep auto-focus-on-reveal as-is).** Rejected: this fixes the "trapped" symptom but not the root cause every lens converged on — the keyboard still appears without the user choosing it, which is the actual violation of "should feel like thinking, not a form."
- **Skip the Design Council pass since this reads as UX polish, not new scope.** Rejected: PDR 0007 binds a fresh Council pass to *any* further expansion of this exact screen, and the new three-mode model, Speak/Type choice surface, and settled post-edit view are new surface area by any reasonable reading — the founder's own prior PDR does not carve out a "just polish" exception.
- **Collapse Speak and Type into a single always-visible input area with a mic icon inside it (no separate choice step).** Rejected: this was the original design's implicit failure mode in miniature — it re-introduces an ambiguous default (is this thing a text field or a mic?) that Krug's and Thaler's lenses both flag as the least self-evident option.

## Links

- `decisions/0007-identity-thought-stream-scope-expansion.md` — the PDR requiring this Council pass
- `decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md` — outstanding safety-screening gap, unaffected by this work
- `docs/00 Canon.md` §2–3, `docs/02 Product Philosophy.md` §3 (precedence order)
- `.claude/CONVENTIONS.md` §4 (lens map), `.claude/workflows/design-council.md` (session process)
- `.rules/reviews.md` rule 4, rule 9 (Sensitive-tier Design Council + linked PDR requirement)
- `prototype/expo/features/onboarding/screens/IdentityInspirationScreen.tsx`, `prototype/expo/components/EditableVisionCard.tsx` — implementation
