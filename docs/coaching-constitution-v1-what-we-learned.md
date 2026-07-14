# What We Learned — Coaching Constitution v1 Adversarial Review

> **Purpose:** the output of four independent reviews of `docs/coaching-constitution-v1.md` — Apple product design, behavioral science, AI safety/psychological safety, and long-term product architecture — each conducted cold, with no visibility into the others' findings or into each other's existence. **All four independently returned a structural verdict, not "minor changes." v1 does not freeze as written.**

## Principles that survived every review

- Warmth, restraint, calm tone (Part 1, Part 7) — untouched by any reviewer.
- Arrival's protected silence and literal verbatim recognition, as *sensory execution* — the one thing named outright as already clearing a premium bar.
- Safety Engine supremacy over every coaching moment (Part 8) — no reviewer challenged this hierarchy.
- The sentence-level bans (no shaming words, no manufactured urgency, no fabricated memories) — validated in spirit. The risk found was in what they don't cover, not that they're wrong.

## Principles that need to change

1. **The Next Moment Policy has no legitimate way to not advance.** Found independently by the behavioral scientist ("a one-way ratchet toward commitment") and the AI safety researcher ("manipulation forbidden at the sentence level, reintroduced at the trajectory level") — two lenses, same gap. Every moment nudges the user up the same ladder; nothing lets the system hold ambivalence, recommend less contact, or conclude the user shouldn't commit right now.
2. **Recommitment locks identity instead of letting it revise.** Found independently by the behavioral scientist (rewards fidelity to an early, possibly-outgrown self-narrative) and AI safety (selectively re-anchoring the same old statement over months is authorship the document doesn't count as authorship). "Never soften the original" needs a real distinction between softening-to-avoid-discomfort and honest revision.
3. **Selective reflection is ungoverned.** Fidelity rules (verbatim, no rewriting) protect *how* words are repeated but not *which* words get chosen to amplify — the actual lever a coach uses to steer (behavioral science).
4. **Safety-adjacent judgment calls are left to prose, not code.** Emotional tone, distress posture, and confidence thresholds are described as model judgment with no deterministic mapping — the exact thing the project's own ADR 0002/0005/0008 pattern says must never happen (long-term architect).
5. **The moment taxonomy is more granular than users can perceive, and it already disagrees with the one thing built from it.** Reflection/Recognition/Clarification are indistinguishable in practice; Confidence and Self-efficacy are literally defined as duplicates; "Expression" is referenced but never defined, while ADR 0008's actual `MomentState` enum has an `expression` state the taxonomy doesn't (Apple design + long-term architect).

## Assumptions that were wrong

- That per-turn safeguards add up to relationship-level safety. They don't — every serious finding across all four reviews only appears after weeks or months of otherwise-compliant behavior.
- That verbatim equals autonomy. Verbatim protects wording, not selection or sequencing.
- That "the model classifies, code decides" — already the project's own stated pattern — was actually carried through into this document. It wasn't, for tone/distress.
- That one taxonomy could serve both the felt experience and the implementation state machine. Design wants fewer, felt moments; engineering (ADR 0008) already has a slightly different enum. Nobody has reconciled them.

## New design constraints going forward

- Every moment-selection policy needs an explicit non-advancing/exit branch — not just a smallest-intervention tie-break.
- Any judgment that gates safety- or trust-relevant behavior must resolve to a deterministic, code-owned mapping before it ships — no such judgment may live only in prompt language.
- Cross-session "memory" shown to the user must trace to a specific stored turn; synthesized recollections must be visibly distinguished from the user's own words.
- Localization is a re-specification, not a translation pass — verbatim-reflection and the banned-register list don't survive a language with obligatory honorifics unexamined.

## Open questions

- Where does "the coach thinks you should slow down / this isn't the moment to commit" actually live in the taxonomy? Not designed yet.
- Who owns calibrating confidence semantics across 6 different model providers/tiers?
- Does the Impulse Test's "Would Apple ship this?" belong at all — the Apple reviewer's own read is that citing another company's bar is an insecurity tell?
- How is identity revision modeled without contradicting Recommitment's current "never soften" language?

## On "the coach earns the right to go deeper"

Worth adding — no review contradicts it, and it's a real gap (nothing in v1 currently paces vulnerability against relationship length). But it's orthogonal to the five findings above: it governs *when* the coach asks for depth, not whether the system's aggregate direction is steering, whether identity gets locked, or where safety judgment is enforced. Add it — but it doesn't resolve any of the structural findings, and shouldn't be mistaken for having done so.

## Verdict

v1 is not frozen. The identity/tone/language layer (Parts 1, 7, 9) held up across all four lenses. The mechanics layer (Parts 4, 5, 6, and the boundary between Part 8's prose and actual code) needs a v1.1 pass before any of this governs a real build — per the constitution's own governance section, that pass requires a PDR and Design Council review, not a quiet edit.
