# PDR 0010 — Next-Moment Engine choreography and architecture: Design Council review

> **Status:** Accepted
> **Purpose:** Record the Design Council review (Deliverable 3) of `docs/identity-onboarding-choreography-v2.md` and `adr/0008-next-moment-engine-architecture.md`, using the ten review lenses the founder specified for this pass, and fix its conditions as binding build constraints.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0010 |
| **Status** | Accepted |
| **Date** | 2026-07 |
| **Deciders** | Neeraj Grotra (founder), via Design Council review |
| **Tier** | Sensitive (onboarding, identity capture, first LLM-adjacent surface in onboarding, safety — always a PDR) |
| **Supersedes / Superseded by** | Amends `0007`/`0008`/`0009` narrowly (adds an adaptive interpretation step to the same screen); does not resolve, and must not be described as resolving, the *hand-off content* half of `0006`'s outstanding safety-screening requirement — see below. |

## Context

The founder requested a full redesign of identity onboarding as a connected sequence of moments — Arrival through Commitment — with an AI-generated adaptive follow-up (Interpretation/Clarification) driven by a new "Next-Moment Engine," gated behind four sequential deliverables and explicit approval before any code. This PDR is Deliverable 3: a Design Council pass using ten specified lenses (not the project's default fifteen-thinker map from `.claude/CONVENTIONS.md` §4) — **senior iOS product design, behavioral science, privacy, accessibility, motion design, trust and safety, conversational UX, failure recovery, latency perception, user autonomy** — applied per the founder's explicit instruction for this review. All ten were engaged; none were set aside, since the founder specified this exact set as the minimum required.

## Decision

**We accept the choreography and architecture as the redesign target, with one finding treated as a required correction (already made to `adr/0008-next-moment-engine-architecture.md` as part of this review, not left as an open item) and six further conditions treated as build-blocking.**

### Per-lens findings (condensed)

**Senior iOS product design.** Agreement: the "moment, not screen" model and Arrival's protected no-content window are genuinely more native than a stepper. Conflict: Interpretation/Clarification has no direct iOS system-UI precedent (Health/Screen Time onboarding are single-pass) — it's closer to an assistant turn-taking pattern, which risks reading as "a chatbot pretending not to be one" despite being silent. Resolution: **go-with-condition** — the Clarification prompt (Moment 7) must use a visually distinct-but-related treatment from the original question (smaller weight, attached to the card, not positioned where the cold-open question lived), so it reads as continuation, never a second cold-open.

**Behavioral science.** Agreement: grounding in Motivational Interviewing, Self-Determination Theory, values clarification, and implementation intentions is coherent and appropriately bounded, not an unrestricted "best psychology" claim. Conflict: a single Haiku-tier call across ten classification categories risks misrouting a self-critical statement into generic "ambiguous" handling, understating the extra gentleness self-criticism specifically requires under the no-shaming principle. Resolution: **go-with-condition** — the eval set (ADR §9) must include a dedicated self-critical-statement subset, evaluated separately from general ambiguity, not folded in.

**Privacy.** Agreement: on-device STT, a stateless Engine call, and no persistence before Continue correctly extend PDR 0007's existing rule. Conflict: the ADR's "never logged long-term" claim is currently a stated policy, not an enforced technical control — most LLM-gateway/observability stacks default to logging full payloads unless explicitly configured otherwise. Resolution: **go-with-condition** — log-scrubbing must be an actual technical control (a payload-stripping wrapper or gateway-level scrub) verified before the feature flag ever goes on for real users, not merely documented intent.

**Accessibility.** Agreement: the new VoiceOver manual thought-advance control correctly closes a real v1 gap. Conflict: the ADR is silent on how a VoiceOver user learns a Clarification prompt has appeared at all — a sighted user sees new text fade in; nothing announces it. Resolution: **go-with-condition** — the Clarification prompt's appearance must trigger an explicit `AccessibilityInfo.announceForAccessibility` call, reusing the exact pattern `useThoughtScheduler` already uses for the thought stream, not left to ambient VoiceOver focus discovery.

**Motion design.** Agreement: Moment 6's near-total absence of animation — restraint as the actual design choice — is a sophisticated, correct application of this project's own "what emotion does this create" rule. No conflict found; **go**, with a non-blocking recommendation that latency variance (sometimes instant, sometimes a brief shimmer) be accepted as honest rather than smoothed over with an artificial minimum delay, which would itself violate the same rule in the other direction.

**Trust and safety.** Agreement: folding real per-turn risk-tier classification into the Engine's required call, using ADR 0005's exact deterministic-mapping pattern, is the correct resolution shape for PDR 0006's gap. **Conflict — the most severe finding of this review:** the ADR's first draft mapped `elevated`/`crisis` to the *same* deterministic fallback as an ordinary AI timeout (silently accept the response verbatim and proceed). Per Constitution §3.5 ("a missed acute crisis is not recoverable") and the project's own precedence order (Safety outranks every other principle with no exception), detecting a risk signal and then behaving exactly as if nothing had been detected is not an acceptable degradation — it is arguably worse than shipping no classifier at all, since it would let the feature be described as "safety-screened" while doing nothing differently in the one case that matters. **Resolution: not a tradeoff, a required correction — already made.** `adr/0008-next-moment-engine-architecture.md` §4/§7/§8 were revised during this review: Tier 2/3 now hard-stops the adaptive loop unconditionally and distinctly from ordinary failure, and the feature flag may not default on for real users until a maintained, reviewed, region-aware crisis-resource registry (Constitution §3.3) exists and is wired to that path — a real, separate, likely non-trivial dependency this review surfaces rather than lets the ADR paper over by fabricating placeholder hand-off content.

**Conversational UX.** Agreement: one concise prompt at a time, no stacked questions, an always-visible "Continue as written" skip are correct, standard practice. Conflict: the clarification-round cap ("at most one round") was stated only as an ADR recommendation, not a hard guarantee — a model could in principle return non-terminal actions indefinitely if the cap isn't enforced outside the prompt. Resolution: **go-with-condition** — the round cap must be enforced in the deterministic `MomentState` machine itself (a code-owned counter forcing `proceed_to_commitment` past N rounds), not left as an expectation of typical model behavior.

**Failure recovery.** Agreement: mic-denial, transcription-error, and AI-timeout paths are all genuinely non-blocking, consistent with "never trap the user." The Tier 2/3 finding above is this lens's concern from a different angle (recovering FROM a detected risk signal must not resolve to the same state as recovering from a timeout) — already resolved above; no separate new condition.

**Latency perception.** Agreement: a 1.5s p95 budget for a Haiku-tier call is reasonable, and the "invisible under budget" design goal is appropriately scoped (not asking a classification call to feel as instant as a button tap, nor accepting frontier-reasoning-tier latency for triage work). No blocking conflict; **go**, with a non-blocking recommendation to validate empirically whether the shimmer's onset should trigger somewhat before the full 1.5s budget elapses, so a user never sits through a silent multi-hundred-ms gap before any feedback appears.

**User autonomy.** Agreement: this is the lens most directly served by the whole redesign — verbatim-by-default, equal-weight "Keep my words," always-available "Continue as written," no forced identity-statement wrapping, all structural rather than copy-level promises. The Tier 2/3 finding is also an autonomy/dignity finding from a different angle (a user's crisis signal silently discarded has had their reality not taken seriously by the system) — already resolved above; no separate new condition.

### Cross-lens synthesis

**Agreements across lenses:** all ten converge that the choreography and architecture direction is sound and a real improvement over the current implementation — restrained, autonomy-preserving, and structurally serious about separating deterministic UI from probabilistic AI decisions. No lens objected to the core moment model.

**The one conflict requiring precedence resolution:** trust-and-safety's finding (corroborated independently by failure-recovery and user-autonomy) is a genuine Safety-tier issue, and per `docs/02 Product Philosophy.md` §3's precedence order — Safety outranks Consent, Understand-before-advise, the four coaching-quality peers, and Engagement, with no carve-out — this could not be resolved as an accepted tradeoff. It required a correction to the artifact itself, made during this review, not merely noted as a condition to fix later.

**All other conditions** (distinct visual treatment for Clarification, self-critical eval subset, enforced log-scrubbing as a technical control, VoiceOver announcement, code-enforced round cap) sit at the coaching-quality-peer tier — real, required, but resolved by direct fix rather than by precedence override, since no lens's finding here conflicted with another's.

**Safety / Consent / Explainability check:** Safety — the central finding above, now corrected in the ADR. Consent — unaffected beyond what PDR 0007/0009 already established; the Engine's stateless design introduces no new consent surface. Explainability — `rationaleCode` is logged for internal review only, never shown to the user; this is a decision-support code, not a user-facing Insight in the Canon §5 data-model sense, so Canon §8's evidence_refs requirement (which governs Insights specifically) doesn't directly apply, but the same spirit — never assert to the user a pattern the system can't show — is honored by never surfacing `rationaleCode` or `riskTier` as user-facing claims.

## Consequences

- `docs/identity-onboarding-choreography-v2.md`'s Moment 7 needs a distinct visual treatment for the Clarification prompt (senior iOS product design condition) and an explicit accessibility announcement (accessibility condition) added before implementation — both are choreography-level additions, not yet reflected in the document's current text, and must land before Deliverable 4.
- `adr/0008-next-moment-engine-architecture.md` was revised in place during this review (§4, §7, §8) — the version now on disk already reflects the trust-and-safety correction; it is not a follow-up action item.
- The eval set (ADR §9) gains a required self-critical-statement subset and the crisis-resource registry becomes an explicit, separate, hard gate on the feature flag ever defaulting on for real users — both are now binding scope for whoever builds Deliverable 4, not optional nice-to-haves.
- The clarification-round cap and log-scrubbing-as-technical-control are both implementation-plan-level requirements (Deliverable 4) flowing directly from this review, not left to implementer discretion.

## Constitution / Covenant impact

Directly engages Constitution §3 (Safety Engine and crisis protocol) — this review is the reason `adr/0008` no longer conflates a detected risk signal with an ordinary failure. Engages principle #7 (Earn the right to hold this data) via the privacy lens's log-scrubbing finding — a policy statement without an enforced technical control is exactly the "promise with no mechanism" Constitution §1 says is not acceptable ("a promise with no mechanism is marketing"). Does not change Covenant text; `covenant_version` unaffected.

## How we'll know if this was wrong

- If, once built, the eval set's self-critical-statement subset reveals the classifier still can't reliably distinguish it from general ambiguity even with dedicated cases, the single-Haiku-call design (not just the eval set) needs revisiting — this would mean behavioral science's conflict was underestimated, not just under-tested.
- If real usage after the flag is ever turned on shows users confusing the Clarification prompt for a second cold-open question despite the distinct visual treatment, the iOS product design condition's specific fix (weight/position) was insufficient, not just unimplemented.
- If sourcing a maintained, reviewed crisis-resource registry proves substantially harder or slower than the rest of this feature, that is itself a signal (not a failure of this review) that the product's safety infrastructure has been under-invested relative to how much coaching-adjacent surface area now depends on it — worth escalating as its own priority, separate from this feature's timeline.

## Alternatives considered

- **Accept the ADR's first-draft Tier 2/3 handling (fallback identical to timeout) and note the registry gap as a future improvement.** Rejected outright: this is precisely the kind of "resolved on paper, not in behavior" outcome Constitution §3.4/§3.5 exists to prevent; a Design Council that let this pass would have failed at its one non-negotiable job.
- **Use the project's default fifteen-thinker lens map instead of the founder's ten specified lenses.** Rejected: the founder explicitly specified this set for this review; substituting a different set without instruction would be substituting judgment for a clear, direct instruction, not a methodology improvement.
- **Treat all seven conditions as advisory rather than binding.** Rejected: `.rules/reviews.md` rule 7 requires Design Council findings to include a recommendation, and CONVENTIONS §2's Sensitive tier permits no shortcuts — a review that produces findings with no teeth is the "theater" `.claude/workflows/design-council.md` explicitly warns against.

## Links

- `docs/identity-onboarding-choreography-v2.md` — Deliverable 1, reviewed here
- `adr/0008-next-moment-engine-architecture.md` — Deliverable 2, reviewed and corrected here
- `decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md` — the outstanding condition this work partially resolves (classification) and partially does not (hand-off content)
- `decisions/0007-identity-thought-stream-scope-expansion.md`, `0008-identity-capture-keyboard-ux-rework.md`, `0009-identity-onboarding-premium-redesign.md` — prior passes on this screen
- `docs/15 Constitution.md` §3 (Safety Engine and crisis protocol — the tiers and mandated responses this review enforces), §3.5 (why safety pre-empts everything)
- `docs/02 Product Philosophy.md` §3 (precedence order)
- ADR 0005 (Safety Engine pre-empts and gates launch) — the pattern reused and correctly applied only after this review's correction
- `.rules/reviews.md` rule 4, rule 7, rule 9 (Sensitive-tier Design Council + linked PDR requirement)
