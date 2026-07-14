# PDR 0007 — Identity capture expands from static starter chips to a reviewed thought-stream interaction

> **Status:** Accepted
> **Purpose:** Record that the identity-capture screen's interaction model was deliberately expanded beyond PDR 0006's minimal 3-chip pattern — a rotating, tap-to-select thought stream plus voice capture and a live editable vision card — and that this expansion was approved by the founder directly, then subjected to a behavioral-review and Design Council pass whose conditions are binding.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0007 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Neeraj Grotra (founder), via behavioral-review + Design Council review |
| **Tier** | Sensitive (onboarding, identity capture — always a PDR) |
| **Supersedes / Superseded by** | Amends `0006` narrowly (identity-capture interaction pattern only); does not supersede it — `0006`'s rejection of the fixed eight-question interview and its per-turn safety-screening requirement remain fully in force and remain unimplemented gaps tracked separately. |

## Context

PDR 0006 (accepted one day prior) replaced a fixed eight-question interview with a minimal identity-capture step: one open prompt ("Who do you want to become?") plus three static tap-to-pick starter chips, explicitly sized to be "almost embarrassingly small" per `docs/05 Onboarding.md` §2.

A subsequent work session, directed by the founder, replaced those three static chips with a materially larger interaction: a curated 30-entry thought library grouped by theme, a rotating single-bubble "thought stream" animation, always-visible tap-to-record voice capture, and a live, always-editable vision card — collectively a recognition-based selection pattern rather than free recall with a small unstick-the-blank-page escape hatch.

This is a real increase in surface area against a very recent, deliberate minimalism decision. It was flagged as such before implementation; the founder elected to own the scope call directly rather than route it through a pre-build Council session. Implementation proceeded, followed — as a condition of merge — by a full behavioral-review and Design Council pass against the built code and live interaction, per `.rules/reviews.md` rule 4 (Sensitive-tier changes require the matching review skill and Design Council before merge).

## Decision

**We accept the expanded thought-stream/voice/vision-card interaction as the identity-capture screen's design, on the founder's direct authority, conditioned on the behavioral-review and Design Council findings being resolved before merge.** Those findings — goal-phrased library entries that bypassed identity-statement normalization, a Canon-principle-contradicting entry ("I want discipline"), deficit-framed entries reading as diagnosis rather than inspiration, no voice-cancel affordance, no visible partial transcript, and no screen-reader-specific handling of the rotating stream — were treated as build-blocking conditions, not suggestions, and were remediated as part of accepting this PDR.

We do **not** treat this as evidence that PDR 0006's "embarrassingly small" principle was wrong — the founder's call here was a scope exception for this specific interaction, not a reversal of the minimalism standard itself. Any further expansion of this screen requires a fresh Design Council pass before, not after, implementation.

## Consequences

- The identity-capture screen now carries meaningfully more code, more copy to maintain, and more surface for future behavioral drift (e.g., new thought-library entries added later must pass the same identity-shaped, non-deficit-framed bar this PDR's remediation established — enforced going forward by a data-integrity test on `thoughtLibrary.ts`).
- The two-stage confirmation (this screen's card, then the existing `IdentityConfirmScreen`) is retained rather than collapsed into one — `IdentityConfirmScreen` remains load-bearing, not vestigial, and should not be quietly removed without its own review.
- PDR 0006's outstanding, launch-blocking condition — per-turn Safety Engine screening of onboarding text — is unaffected and unresolved by this work. This PDR does not claim to address it.
- Voice-derived text is confirmed, by this review, to never persist before explicit user confirmation (component state only, submitted only on `Continue`) — this property must be preserved in any future change to the voice-capture flow.

## Constitution / Covenant impact

Engages principle #4 (Identity over goals) directly: the pre-remediation defect where goal-phrased thoughts ("I want to stop wasting time") could be persisted as Identity Statements was a genuine violation, now fixed by requiring every library entry to be identity-shaped. Engages principle #7 (Earn the right to hold this data) via the voice-consent findings (cancel/discard, partial-transcript visibility) — Consent outranks coaching-quality concerns in `docs/02 Product Philosophy.md` §3's precedence order, which is why those specific findings were treated as blocking rather than advisory. Does not touch the Covenant text itself; `covenant_version` is unaffected.

## How we'll know if this was wrong

- If real-user testing shows tap-selected identity statements read as less "mine" than typed/spoken ones (a TTFU-adjacent signal, `docs/05 Onboarding.md` §8), the recognition-based pattern itself — not just its copy — would need to be revisited.
- If the thought library, as it grows, reintroduces goal-phrased or deficit-framed entries despite the new data-integrity test, the test itself (not just the copy) needs strengthening.
- If usage data shows one input mode (voice, tap, or free-type) is essentially unused, Jobs's-lens concern about this being a "feature pile" rather than an integrated whole would be vindicated, and the unused mode should be cut.

## Alternatives considered

- **Revert to PDR 0006's 3-chip pattern, reject the expansion outright.** Rejected: the founder's product judgment is that recognition-based selection genuinely lowers blank-page anxiety for this specific prompt, and the resulting defects were fixable without discarding the pattern.
- **Ship the expansion without a review pass, since the founder already approved the scope call.** Rejected: scope approval and behavioral/ethical soundness are different questions — `.rules/reviews.md` rule 4 does not carve out an exception for founder-approved scope, and the review surfaced real, fixable defects (goal-phrased entries, missing voice-cancel) that scope approval alone would not have caught.
- **Treat this as a full supersession of PDR 0006.** Rejected: PDR 0006's central findings (reject the fixed interview; require per-turn safety screening) are untouched by this work and remain binding.

## Links

- `decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md` — the decision this PDR narrowly amends
- `docs/05 Onboarding.md` §2–3 (the minimalism standard this PDR takes a scoped exception to)
- `docs/00 Canon.md` §2–3 (Identity Statement definition, principle #4, principle #7)
- `docs/02 Product Philosophy.md` §1.4, §1.6, §3 (Identity over goals, Alignment over discipline, precedence order)
- `.rules/reviews.md` rule 4 (Sensitive-tier review requirement)
- `prototype/expo/constants/thoughtLibrary.ts`, `prototype/expo/features/onboarding/screens/IdentityInspirationScreen.tsx` — implementation
