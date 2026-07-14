# PDR 0011 — Adaptive Growth & Autonomy Architecture

> **Status:** Proposed
> **Purpose:** Resolve the four structural contradictions the adversarial review of `docs/coaching-constitution-v1.md` surfaced, before any further implementation, prompt, or experience work proceeds. This is the governing design decision for every adaptive AI interaction in Impulse — how the system chooses what happens next, how it treats a user's changing identity, where safety-relevant judgment is allowed to live, and how "never create dependence" becomes falsifiable instead of aspirational.

> **A note on location:** this repository's convention (`decisions/README.md`) numbers PDRs in `decisions/NNNN-title.md`. This record was requested at `docs/pdr/PDR-0011-...md` instead. The number (`0011`) is still the correct next value in the monotonic sequence — `decisions/0010` is the last-issued PDR — so numbering stays consistent even though the path doesn't match existing practice. Flagged here rather than silently reconciled; worth a decision on whether to relocate this file before it's cited elsewhere.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0011 |
| **Status** | Proposed |
| **Date** | 2026-07 |
| **Deciders** | Neeraj Grotra (founder), resolving four independent adversarial reviews (Apple product design, behavioral science, AI safety, long-term product architecture) |
| **Tier** | Sensitive (coaching policy, identity, safety-boundary, and metrics — a PDR by definition, `decisions/README.md` §2) |
| **Supersedes / Superseded by** | Amends `docs/coaching-constitution-v1.md` Parts 2, 4, 5, 6 (does not supersede it wholesale — Parts 1, 3, 7, 8, 9, 10, 11 are unaffected; see Required Constitution Changes) |

---

## Context

### Problem statement

`docs/coaching-constitution-v1.md`'s identity, tone, and language layer (Parts 1, 7, 9) held up across four independent adversarial reviews. Its **mechanics layer did not.** The Next Moment Policy (Part 6), Recommitment (Part 4), the Consistency dimension (Part 5), and the placement of safety-relevant judgment (Part 5, Part 8) combine into a coherent, unintended bias: the coach optimizes for stronger and more consistent commitment to whatever the user first said, rather than for the user's actual, current understanding. Because every gate that would catch this bias is currently prose — a model-judgment call, not a deterministic policy — the bias is invisible to any single-turn or single-principle check. It is only observable in aggregate, after real relationship history has accumulated, which is exactly the condition under which the reviews found it.

Separately, `docs/15 Constitution.md`'s non-negotiable "never create dependence" has no instrument. A promise with no mechanism is marketing (`docs/15 Constitution.md` §1) — this PDR treats that standard as binding on this product's own founding document, not just on the model's output.

### Evidence

Four independent reviews of `docs/coaching-constitution-v1.md`, conducted cold, with no visibility into one another — full synthesis at `docs/coaching-constitution-v1-what-we-learned.md`. Two findings were discovered independently by reviewers using unrelated methodologies, which this PDR treats as the strongest possible signal of a real structural defect rather than a single reviewer's stylistic preference:

- **F1 (corroborated by behavioral science AND AI safety):** the Next Moment Policy is a one-way ratchet toward commitment. No moment's legitimate outcome is "less," "not yet," or "actually, no." Manipulation forbidden at the sentence level re-enters at the trajectory level.
- **F2 (corroborated by behavioral science AND AI safety):** Recommitment and the Consistency dimension reward fidelity to an early, possibly-outgrown identity statement over honest revision — authorship the document's own letter (`preserveOriginal`, verbatim rules) doesn't count as authorship, because the coach chooses *which* old statement to re-surface.
- **F3 (long-term product architecture):** confidence thresholds, emotional-tone handling, and distress posture are specified as model judgment in prose, with no deterministic mapping — contradicting the pattern this project already committed to elsewhere (`adr/0002-llm-as-tool-not-brain.md`, `adr/0005-safety-engine-gates-launch.md`, `adr/0008-next-moment-engine-architecture.md` §4).
- **F4 (AI safety):** the Trust dimension (Part 5) is specified to ratchet upward over months with no counter-signal for the user acting *without* the coach — "never create dependence" is unfalsifiable as written.

### Conflicting principles

These are not four unrelated defects — they are one document disagreeing with itself:

- Part 2 #7 ("progress matters more than perfection") and #18 ("authorship can always be reclaimed") promise nothing is permanent. Part 4's Recommitment ("forbidden: softening or rewriting the original identity statement") and Part 5's Consistency dimension ("whether stated values/identity have remained stable") then instrument and reward permanence. Both cannot be true in the same document.
- Part 2 #3 ("the coach asks because understanding is incomplete, never to fill a quota") and #6 ("silence can be valuable") assume non-advancement is a live option. Part 6's Next Moment Policy priority order has no rung that terminates in "do less" — advancement always outranks silence when both are available, so #6 is true in principle and false in the policy that's supposed to implement it.
- Part 8 ("the Safety Engine sits above all of this... no moment... is exempt") and the project's own established pattern (the model classifies, deterministic code decides) are asserted as governing, but Part 5's actual field-level rules for tone and distress describe confidence bands and default postures in prose, naming no code-owned mapping. The principle is cited in one place and not carried into the place that needs it.

---

## Decision

We resolve all four findings with one coherent shift: **the Experience Engine optimizes for Understanding → Agency → Ownership → Growth → Commitment, not for Commitment → More Commitment → Recommitment.** Concretely, five decisions:

### D1 — Replace the linear Next-Moment trajectory with a non-monotonic adaptive graph

Constitution Part 6 (Next Moment Policy) is superseded. Its priority order is replaced by a single governing rule: **the coach selects the moment that best serves the user's current understanding and agency — not the moment nearest to commitment.** This means, as binding policy (full formal transition table is architecture work, scoped in Required Architecture Changes below):

- Every non-terminal moment must have **at least one non-advancing exit** — stay, slow down, loop back, or pause — in addition to any advancing one. A moment defined with only advancing exits is malformed by this policy, full stop.
- Two moments are added to the taxonomy as first-class, not exceptional: **Doubt** (the user questioning a prior statement or direction — a legitimate state, not friction to resolve) and **Revision** (the user explicitly changing a prior identity/value/plan statement — distinct from Repair, which addresses a behavioral lapse, not a belief change).
- Part 2 #5 ("the smallest useful intervention wins") is clarified: "no intervention" and "reduced contact" are always-eligible options, never merely a tie-break among advancing moves.
- Loops are a designed feature, not a failure state. `Doubt → Reflection → Revision → Ownership` is exactly as valid a path as `Clarification → Ownership → Commitment`.

### D2 — Recommitment and identity evolution

The coach is loyal to the user's growth, not to the user's previous answers. Revision is evidence of learning, not inconsistency.

- Recommitment's current "forbidden: softening or rewriting the original identity statement" is replaced with a distinction the current text collapses: *softening to avoid discomfort* (the coach quietly watering down what the user actually said) stays forbidden. *The user choosing to revise* is now explicitly supported — the coach never resists, discourages, or silently re-presents an outdated statement once the user has indicated they want to change it.
- The Consistency dimension's definition changes from "whether stated values/identity have remained stable across time" to **"the honest current record of how a user's stated values/identity have changed, presented neutrally — never scored as a virtue (stability) or a flaw (change)."**
- Revision rights — the user's ability to explicitly supersede a prior identity statement — become a deterministic-policy-owned decision (D3), never inferred, always an explicit user action the system can point to.

### D3 — Fix the LLM / deterministic-policy boundary

This generalizes a pattern the project already trusts for one case — `adr/0008-next-moment-engine-architecture.md` §4's deterministic mapping of risk tier to action — into a permanent, constitutional rule covering every adaptive interaction, closing the gap F3 found.

**LLM responsibilities, and only these:** language generation, reflection, clarification, summarization, question wording, empathetic phrasing, optional rewording.

**Deterministic policy owns, and the LLM never has final authority over:**
- dependency risk
- distress level / risk tier
- safety routing
- identity rewrite / revision permission
- confidence thresholds — including their calibration across model tiers and providers
- conversation pacing (how fast the D1 graph is allowed to advance)
- permission to deepen (gates the "earns the right to go deeper" principle, D5)
- user authorship (whether a statement is attributed to the user or to the system's own proposal)
- revision rights (whether a Revision moment may supersede a prior statement)

The LLM may propose a classification ("this reads as Doubt, confidence 0.6") — the mapping from that classification to what the system actually does is owned by policy code, evaluated after generation and before anything reaches the UI. This is `adr/0008` §4's own shape, applied to every field in Part 5's Psychological State Model, not only risk tier.

### D4 — Establish a Relationship Health Model

A new subsystem, downstream of but distinct from the Psychological State Model (Part 5): where Part 5 models beliefs about the *user*, the Relationship Health Model monitors the *interaction* — whether the coaching relationship is trending toward the user's growing independence or growing reliance. This is explicitly not a diagnostic instrument and never produces a user-facing score, the same non-exposure discipline already applied to other internal scoring in this product.

| Dimension | Purpose | Measurement (interaction-shape, never content-based inference) | Confidence & expiration | Privacy | Allowed uses | Forbidden uses |
|---|---|---|---|---|---|---|
| **Autonomy** | Is the user increasingly acting on their own between sessions? | Ratio of user-initiated to coach-initiated turns; self-reported independent action | Low per-session; meaningful only as a rolling trend across ≥8 sessions | Interaction metadata only, never the content of what the user did independently | Throttle coach initiative-taking when trending up | Never used to justify reducing support to a user who currently needs it |
| **Trust** | Is the relationship stable, not spiking or collapsing? | Return rate; voluntary resumption of a prior topic | Long-horizon; same rules as Part 5's Trust dimension | Relationship-level only | Paces "earns the right to go deeper" (D5) | Never surfaced to the user as a number |
| **Dependence Risk** | Is the coach becoming load-bearing for ordinary decisions? | Frequency of a structural "what should I do" request pattern; requests for validation before acting | Rises slowly, decays slowly; never set by one session | Never logged with verbatim content, only a structural count/classification | Triggers a Closing-moment nudge or reduced-initiative posture | Never a diagnosis; never used to gate features; never flagged to a human outside Constitution §3's crisis process |
| **Initiative** | Who starts the hard conversations? | Ratio of user-raised to coach-raised Discovery-tier moments | Rolling, monthly | Relationship-level only | Informs whether Discovery-tier moments wait for the user or are coach-initiated | Never used to score the user |
| **Reflection Depth** | Are responses becoming more considered over time, or shallower? | Part 5 Specificity trend; response shape as a weak proxy only | Low individual confidence; trend-only | Aggregated, not stored verbatim beyond existing retention rules | Calibrates whether Specificity-tier moments are still needed | Never implies the user "isn't trying" |
| **Ownership** | Is the user claiming statements as their own, unprompted? | Rate of unprompted vs coach-prompted Ownership-moment entry | Session-level, decays if unused | Relationship-level | Corroborates Readiness (Part 5) | Never inferred from a single session |
| **Coach Reliance** | Feature-level mirror of Dependence Risk (e.g., always opening the app before deciding) | App-open-to-decision timing pattern where available; otherwise self-report only | Same caution as Dependence Risk | Interaction metadata only | Same throttling use as Dependence Risk | Same as Dependence Risk |
| **Need for Reassurance** | Escalating requests for validation | Structural phrase-pattern frequency, never sentiment scoring | Rises/decays per Dependence Risk's rules | Never verbatim-logged | Informs pacing, same as Dependence Risk | Never used to withhold reassurance a user genuinely needs in a hard moment |
| **Self-efficacy** | Is *this relationship* building self-efficacy, at the relationship level rather than per-session | Aggregated Part 5 Self-efficacy trend | Same rules as Part 5, aggregated | Relationship-level | Validates whether Momentum/Planning moments are working | Never a standalone diagnosis |
| **Relationship Stage** | How long and how deep has this relationship actually gone? | Elapsed time plus count of Discovery-tier moments completed | Deterministic (a count/date) — not inferred | Relationship-level, low sensitivity | Gates how much depth the coach may invite (D5) | Never used to justify skipping consent for any single moment |

Governing rules for this whole table: the model's goal is protecting user autonomy, not assessing the user's psychology; every dimension answers "is this relationship healthy," never "is this user unwell"; and this subsystem requires its own privacy-review pass before any implementation (Required Architecture Changes), since it is new signal collection even where the signals are structural rather than content-based.

### D5 — New and amended constitutional principles

**New:**
1. The coach is loyal to the user's growth, not to the user's previous answers.
2. Revision is evidence of learning, not inconsistency.
3. The coach earns the right to go deeper — trust precedes vulnerability; depth is invited, never extracted.

**Amended (strengthened — no elevated governance bar under Part 2's own ratchet rule):**
- Part 2 #5 clarified to explicitly include "no intervention" as always-eligible, per D1.
- Part 6 superseded by D1's graph model.

The design goal restated at the top of the experience graph — **Understanding → Agency → Ownership → Growth → Commitment** — replaces the goal implicit in the current Part 6 (**Commitment → More Commitment → Recommitment**).

---

## Consequences

**Positive**

- Closes F1 and F2 — the two convergently-found gaps — with one mechanism: a graph that treats Doubt and Revision as first-class, non-error states, rather than two separate patches.
- Generalizes a pattern the project already trusts (`adr/0008` §4's deterministic mapping) instead of inventing a new one, which is lower architectural risk than a bespoke policy layer.
- Makes "never create dependence" falsifiable for the first time via D4, closing the exact "promise with no mechanism" gap `docs/15 Constitution.md` §1 already names as unacceptable.

**Negative**

- Meaningfully larger scope than v1's mechanics section. The experience graph, the ten-dimension Relationship Health Model, and the deterministic-policy boundary are real, non-trivial engineering — none of it is built anywhere yet.
- The one screen already built against v1's taxonomy (`docs/identity-onboarding-choreography-v2.md`) is not automatically compliant with this PDR — Doubt/Revision and the redefined Recommitment/Consistency mean it needs re-evaluation, not inherited approval.
- D4 introduces new interaction-shape signal collection about the user. Even structural, non-content-based signals are new privacy surface and must clear privacy-review on their own merits, not be waved through because the model's stated intent is protective.

**Neutral**

- This PDR changes no code, no prompts, and no onboarding experience — by instruction and by design, it fixes the policy layer a future ADR and feature spec must then implement.
- `adr/0008`'s flag-gated-off status, its eval-set requirement, and its crisis-resource-registry gate are all unaffected — nothing here changes that ADR's launch gating.

---

## Migration strategy

1. **This PDR — Proposed → Accepted.**
2. **Constitution v1 → v1.1 redline** covering the Required Constitution Changes below, reviewed by Design Council per the Constitution's own governance section (amendments to Parts 2/4/5/6 require it) — never a silent edit.
3. **A new ADR** ("Adaptive experience graph and deterministic policy layer") specifying D1 and D3's technical shape: the full entry/exit/allowed/forbidden transition table for all 22 moments, and the deterministic policy module's actual interface.
4. **A separate ADR (or scoped extension)** for the Relationship Health Model (D4), gated behind its own privacy-review given new signal collection.
5. **Only after 2–4** does any onboarding or prompt implementation resume — including re-evaluating `docs/identity-onboarding-choreography-v2.md` against the new graph.

---

## Required Constitution Changes

- **Part 2:** add the three new principles (D5).
- **Part 4:** add Doubt and Revision (full spec — purpose/intention/emotion/duration/transitions/allowed/forbidden — in the same format as the existing twenty moments); rewrite Recommitment's forbidden clause per D2.
- **Part 5:** rewrite the Consistency dimension's definition per D2; state the Unknown → Inferred → Fact prohibition as its own explicit governing rule rather than leaving it implicit in the table.
- **Part 6:** replaced in full by the graph model summarized in D1 (the complete formal graph lives in the follow-up ADR, referenced from here).
- **Parts 1, 3, 7, 8, 9, 10, 11:** no changes identified — none of the four reviews found a structural defect in identity, philosophy, language, safety-deference, experience principles, decision framework, or the Impulse Test's substance. (Part 11's "Would Apple ship this?" question is flagged as an open question below, not a required change.)

## Required Architecture Changes

- New ADR translating D1 into an actual state machine: entry/exit conditions and allowed/forbidden transitions for all 22 moments, superseding the linear assumptions in `adr/0008`'s `MomentState` enum wherever they conflict.
- New deterministic policy module (or an explicit extension of `adr/0008` §4's mapping pattern) owning every decision listed in D3 — generalized from risk tier alone to pacing, depth-permission, authorship, and revision rights.
- New subsystem design for the Relationship Health Model (D4): storage, computation cadence, and a dedicated privacy-review pass.
- Reconciliation of Part 4's moment vocabulary with `adr/0008`'s `MomentState` enum — the "Expression" mismatch the long-term-architecture review found becomes one taxonomy, not two.

## Required Prompt Changes

None authored here — explicitly out of scope for this PDR. Named for the follow-up work: the Next-Moment Engine's prompt (`adr/0008` §3) will need updating once Doubt/Revision exist as target classifications, and its confidence-threshold logic must move from a prompt-embedded constant (`adr/0008` §5's "0.75, tunable") into the D3 deterministic policy module.

## Required Experience Changes

None authored here — explicitly out of scope; onboarding is untouched by this PDR. Named for the follow-up: `docs/identity-onboarding-choreography-v2.md`'s Moment 6/7 (Interpretation/Clarification) needs re-evaluation against the new graph once it exists — the Apple-design review already found that branch reads as an inconsistent fork at the most sensitive moment in onboarding, and this PDR's graph model is a candidate fix, not yet an applied one.

---

## Constitution / Covenant impact

This PDR strengthens every protection it touches; it introduces no red-line exception and does not itself alter the Covenant's data promises (D4 is new signal collection, which is precisely why it's gated behind its own privacy-review rather than assumed covered). Per `docs/15 Constitution.md` §8 — the Covenant ratchets only toward the user — this qualifies for the faster strengthening path, though Design Council review is still required for the Part 2/4/5/6 amendments per the Constitution's own governance section, independent of the ratchet direction.

## How we'll know if this was wrong

- If, once built, the graph's non-advancing exits are rarely or never actually selected in practice — if "smallest useful intervention" still empirically resolves to advancement almost every time — D1 was cosmetic, not structural, and needs revisiting.
- If the Relationship Health Model's ten dimensions turn out to collapse to one real signal in practice (e.g., Coach Reliance and Need for Reassurance never diverge in real data), the model is over-specified and should be simplified rather than defended as designed.
- If engineers building against D3's deterministic-policy boundary routinely request exceptions ("just let the model decide this one case"), the boundary was drawn in the wrong place and needs a narrower, more honest scope.
- If real users' Revision moments correlate with measurably worse outcomes (less follow-through, not just different follow-through) than users who never revise, "revision is evidence of learning" was too optimistic a prior and needs evidence before it stays a stated principle.

## Alternatives considered

- **Patch Part 6 with a single new "de-prioritize commitment" rule instead of a graph.** Rejected: the evidence is that the problem is the aggregate trajectory, not a missing rule; a patch leaves the same monotonic shape with one more exception clause — the kind of ambiguity the long-term-architecture review already found diverges across implementers.
- **Leave Recommitment strict-fidelity and add a separate "Identity Change Request" flow instead.** Rejected: creates two competing paths for the same ordinary need ("I've changed") and contradicts New Principle #1 by treating revision as an exception process rather than a normal one.
- **Keep D3 narrow — only risk tier stays deterministic, pacing/depth/authorship stay model judgment.** Rejected: this is the exact scope the long-term-architecture review found already producing cross-model divergence; extending the reasoning that justified deterministic risk tier (`adr/0005`) to the rest of D3's list is consistency, not scope creep.
- **Defer the Relationship Health Model indefinitely; treat "never create dependence" as aspirational for now.** Rejected: identical in shape to the "resolved on paper, not in behavior" outcome `decisions/0010` already refused to accept for the crisis-tier gap. An unfalsifiable non-negotiable isn't being treated as one.

## Open Questions

- The complete formal transition table (entry/exit/allowed/forbidden, all 22 moments) is intentionally not specified here — this PDR fixes graph *policy* (non-advancing exits required, loops permitted, no forced-forward-only moment), not the full state machine. That's the follow-up ADR's job.
- How Relationship Health Model dimensions are concretely measured — e.g., what counts as "independent action between sessions" when the product can't always observe out-of-app behavior — is unresolved.
- Whether "the coach earns the right to go deeper" needs its own depth-budget model that grows with Relationship Stage, or can be satisfied by gating Discovery-tier moments behind that one dimension, isn't decided here.
- Cross-model confidence calibration (long-term-architecture review's F3) is named as required architecture work but not solved — a shared calibration layer versus per-model tuned thresholds is future work.
- Localization of the graph and Part 7's language rules across non-English markets remains untouched and open, per the original review.

## Future Work

- The follow-up ADR(s) named in Required Architecture Changes.
- Design Council review of the Constitution v1.1 redline.
- Re-evaluation of `docs/identity-onboarding-choreography-v2.md` against the new graph model.
- A dedicated privacy-review pass for the Relationship Health Model before any implementation.
- A future PDR on multilingual/cultural localization of the coaching philosophy — flagged, not solved, by the long-term-architecture review.

## Links

- `docs/coaching-constitution-v1.md` — the document this PDR amends
- `docs/coaching-constitution-v1-what-we-learned.md` — the adversarial-review synthesis this PDR resolves
- `adr/0008-next-moment-engine-architecture.md` — the deterministic-mapping pattern D3 generalizes
- `decisions/0010-next-moment-engine-design-council.md` — prior precedent for refusing "resolved on paper, not in behavior"
- `docs/15 Constitution.md` — supreme law this PDR operates beneath
- `docs/00 Canon.md` — vocabulary and metrics context
- `docs/identity-onboarding-choreography-v2.md` — the one built screen this PDR's graph model must eventually be checked against
