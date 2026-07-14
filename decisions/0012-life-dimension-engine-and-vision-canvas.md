# PDR 0012 — Life Dimensions replace static thought content as the semantic foundation for identity capture; Vision Canvas replaces the single vision-card

> **Status:** Proposed
> **Purpose:** Record the founder's decision to stop generating identity-capture inspiration from a static, curated thought library and instead generate it from a ranked, canonical **Life Dimensions** taxonomy — and to replace the single free-text vision card with a multi-fragment **Vision Canvas** (renamed from "Identity Basket"). This is a separate, new PDR that references and inherits `docs/pdr/PDR-0011-adaptive-growth-autonomy-architecture.md`'s deterministic-policy boundary (D3) rather than folding into that still-Proposed record, per the founder's explicit direction.

## Metadata

| Field | Value |
|---|---|
| **PDR** | 0012 |
| **Status** | Proposed |
| **Date** | 2026-07 |
| **Deciders** | Neeraj Grotra (founder) |
| **Tier** | Sensitive (identity capture, coaching policy, model, Covenant data-model — always a PDR) |
| **Supersedes / Superseded by** | Supersedes `decisions/0007-identity-thought-stream-scope-expansion.md`'s "static and curated, not AI-generated" clause only — PDR 0007's remediation bar (identity-shaped, non-deficit-framed content; voice-cancel; partial-transcript visibility; two-stage confirmation) carries forward unchanged as a constraint on the new AI-generated content, not discarded. Amends the capture-mechanism assumptions of `docs/identity-onboarding-choreography.md` (v1), `docs/identity-onboarding-choreography-v2.md` (v2), and `decisions/0008`/`0009` (their Moments 4–9 assumed a single free-text statement; this PDR changes that assumption, not their motion/keyboard/accessibility work, which carries forward where compatible). Does not supersede `docs/pdr/PDR-0011-...md` — separate track, inherits its D3 boundary by reference. Does not touch `decisions/0006`'s unresolved per-turn safety-screening requirement; see Constitution impact below for how this PDR extends rather than resolves it.

---

## Context

Every artifact governing this screen so far — v1, v2, PDR 0007/0008/0009/0010 — assumed the same shape: a fixed, curated 30-entry thought library surfaces inspiration, and the user converges on **one** free-text identity statement in **one** editable card. PDR 0007 made the "static and curated, not AI-generated" property an explicit, reviewed decision specifically to avoid the failure mode of AI-generated content on unvalidated, freeform identity text (the same concern that later made v1 §8.1 an open question and made ADR 0008 build an entire deterministic-fallback, safety-tiered, feature-flagged Engine just to let the AI touch **one** narrow follow-up step, Interpretation).

The founder's request reverses the starting assumption entirely: the product should understand *who the user is in their life* before it invents anything to say to them. Concretely — a canonical, cross-product **Life Dimensions** taxonomy (Health & Energy, Relationships, Family, Career & Work, Financial Wellbeing, Purpose & Meaning, Personal Growth, Emotional Wellbeing, Confidence & Self-Worth, Habits & Discipline, Adventure & Experiences, Contribution & Community, Creativity, Spirituality (conditional), Legacy) becomes the semantic layer the AI reasons over; every thought bubble is generated, not curated, from the highest-ranked dimensions; and the user's selections accumulate not into one statement but into a multi-fragment collection — the founder's preferred name, **Vision Canvas** ("basket" implies temporary storage; "canvas" implies something actively composed, and the metaphor is meant to carry into later features as the vision keeps evolving).

This is not an incremental change to the existing screen. It changes what data model the capture experience produces (one statement → up to five fragments), what generates the inspiration content (a curated list → a live LLM call before the user has said anything), and what semantic layer the rest of the product is meant to share (`docs/00 Canon.md` §5 has no Life Dimension concept today — only `Identity.values[]`/`identity_statements[]`). Per the founder's own direction (asked and confirmed directly, not assumed): this is a **new, separate PDR**, not a fold-in to PDR 0011, and Vision Canvas **replaces** the single vision-card model rather than feeding into it.

---

## Decision

**We adopt Life Dimensions as a new canonical semantic layer, used to rank what the AI understands about a user's current life stage before it generates any inspiration content. We replace the static, curated thought library with AI-generated thought fragments drawn from the highest-ranked Life Dimensions and Themes, superseding PDR 0007's "static and curated, not AI-generated" clause. We replace the single free-text vision card with a multi-fragment Vision Canvas (renamed from "Identity Basket"), capped at five editable fragments, assembled from generated thoughts, voice, typed text, and paste — all user-editable, none silently overwritten by the AI.**

This PDR fixes **policy** only. It does not authorize implementation, does not specify prompts, ranking algorithms, storage, or the exact new choreography — those are follow-up-ADR and follow-up-choreography work (Migration strategy, below), gated the same way PDR 0011 gated its own D1/D3/D4 follow-up work. **No code, prompt, or UI ships from this document.**

### What this decision explicitly requires, inherited unchanged from prior work on this screen

- **The deterministic-policy boundary (PDR 0011 D3, ADR 0002):** the LLM ranks dimensions, generates thoughts, and drafts synthesis language; it never decides navigation, never picks UI, never has final authority over safety routing, confidence thresholds, or what persists. This PDR does not re-derive that boundary — it inherits it by reference.
- **Verbatim-by-default (PDR 0007/0008):** the AI never overwrites a user-authored fragment. Generated thoughts are suggestions; once tapped, typed, or spoken into the Canvas, a fragment is the user's words, editable only by the user.
- **PDR 0007's content-quality bar:** every AI-generated thought must clear the same bar PDR 0007's remediation established for curated entries — identity-shaped (not goal-phrased), never deficit-framed, never diagnostic. This is now a **prompt-level and eval-level requirement** rather than a one-time data-integrity test on a static file, which is a materially harder property to guarantee and is named as such in Consequences.

---

## Consequences

**Positive**

- Directly serves the founder's stated success bar — inspiration that reads as "the app understood where I am in life," not "random motivational quotes" — which a static 30-entry library structurally cannot do past the first few users who exhaust its variety.
- Personalization operates on a stable, explainable layer (dimension/theme relevance) rather than on individual thought scores, which keeps the system's evolving model of the user legible and auditable — consistent with Canon §8's explainability principle, extended here to a system-internal ranking rather than a user-facing Insight.
- Establishes one taxonomy the founder intends to reuse "throughout the entire Impulse platform" — if it holds up, later engines (Coaching, Decision) inherit a semantic layer instead of each inventing their own.

**Negative**

- **This is a materially larger safety surface than anything shipped in onboarding so far, and this PDR is not itself sufficient to ship it.** ADR 0008 built an entire deterministic-fallback, risk-tiered, feature-flagged Engine to let the AI touch **one** narrow, already-user-reviewed piece of text (Interpretation, after Recognition). This proposal calls the LLM **before the user has said anything at all** (Life Understanding, from Name/Age/Life Stage/Current Focus) and again for bulk content generation (Thought Generation) — both new, earlier, larger LLM touchpoints than Interpretation, and `decisions/0006`'s per-turn safety-screening requirement is unresolved for both. **No implementation of this PDR may ship without extending ADR 0008 §4's riskTier pattern to these new calls** — this PDR names that as a build-blocking condition of the follow-up ADR, not a resolved fact.
- **Replaces, not extends, the already-Accepted single-vision-card capture model.** v1/v2's Moments 4–9 (Expression through Commitment) are built around one statement in one card; a multi-fragment Canvas is a different interaction model needing its own choreography pass, not a patch. This is a bigger redesign than PDR 0008's keyboard rework or PDR 0009's premium redesign — closer in scope to v2's own Interpretation/Clarification addition, and should be reviewed with the same rigor (PDR 0010's ten-lens pass).
- **Content-quality guarantee gets harder, not easier.** PDR 0007's remediation fixed a fixed, auditable list once; this PDR asks for the same guarantee (identity-shaped, non-deficit-framed, never goal-phrased) to hold across unbounded generated content, continuously. This requires an eval harness with the same rigor as ADR 0008 §9, scoped to content generation specifically, not inherited for free from the Next-Moment Engine's eval set.
- **STEP 0 ("Life Understanding" context-gathering — name, age, life stage, current focus, possibly 1–2 AI-chosen follow-ups) risks resembling the fixed interview `decisions/0006` already rejected.** PDR 0006's rejection was specific: no fixed multi-question intake before the first reflective moment. An AI *choosing* which 1–2 questions to ask is more adaptive than a fixed eight-question form, but it is still explicit demographic/context collection ahead of "Who are you becoming?" — this PDR flags the tension rather than resolving it; the follow-up choreography must show this step stays minimal and justifies each question against `.claude/checklists/onboarding-change.md`'s "no life-domain surveys" and progressive-disclosure rules.
- **New Canon-level data model surface.** Life Dimensions do not exist in `docs/00 Canon.md` §5 today. Introducing a taxonomy meant to span "the entire Impulse platform" is a Canon amendment, not a screen-level addition, and needs its own reconciliation against the existing `Identity.values[]` field (are these the same concept under two names, or genuinely distinct?) before a follow-up ADR designs storage.

**Neutral**

- Arrival and Curiosity (v1/v2 Moments 1–2) are unaffected in spirit — the held-silence pacing and "Who are you becoming?" copy carry forward unchanged; what changes is what happens the instant those moments end.
- This PDR does not decide whether Vision Canvas fragments ultimately serialize to a new plural Canon field or continue mapping to `identity_statements[]` at N≤5 — that is follow-up-ADR/Canon-amendment work.

---

## Constitution / Covenant impact

- **Principle #4 (Identity over goals):** the founder's own spec is explicit that Life Dimensions "are NOT goals, NOT tasks, NOT habits" — this PDR adopts that framing verbatim and treats any future Life Dimension that reads as a goal/task (e.g., a dimension phrased as an outcome rather than an enduring area of life) as a defect against this PDR, the same bar PDR 0007 set for individual thought entries.
- **Canon §6 ("no raw model access from feature code"):** the Life Dimension Engine and Thought Generation Engine must be built as scoped modules calling through the Prompt Builder and gateway, exactly as ADR 0002/0008 already require — this PDR does not create an exception.
- **Canon §8 ("Safety pre-empts everything") and `decisions/0006` (unresolved):** this is the load-bearing gap named in Consequences. This PDR does not resolve `0006`'s per-turn screening requirement for the new surfaces it creates — it explicitly **extends** the scope of what must be resolved before any of this ships to real users, mirroring PDR 0010's refusal to accept "resolved on paper, not in behavior" for the Next-Moment Engine's Tier 2/3 handling. The same standard applies here: a Life-Understanding or Thought-Generation call that processes real user context (age, life stage, "current focus," conversation history) without per-turn risk screening is not a lesser version of a safe implementation — it is the exact gap `0006` and `0010` already refused to let stand elsewhere in this same screen.
- **Covenant transparency (`15 Constitution.md` §2, §8):** dimension relevance scores are explicitly internal, never shown to the user — consistent with the existing pattern (`rationaleCode`/`riskTier` in ADR 0008, `alignment_score` in Canon §5) of internal reasoning that informs behavior without being asserted to the user as a claim about them.

---

## How we'll know if this was wrong

- If generated thoughts test as less relevant or more generic than the curated library they replace (the founder's own stated failure mode: "the app showed me random motivational quotes"), the Life Dimension ranking — not just prompt wording — needs revisiting.
- If Time-to-First-Feeling-Understood or the "the app gets me" guardrail (`docs/05 Onboarding.md` §1, §8) degrades after this ships relative to the curated-library baseline, the core bet (understanding-before-content beats curation) was wrong for this product, not merely under-tuned.
- If real-user testing shows Canvas fragments (short, chip-like) read as less "mine" than the single free-text statement they replace — mirroring PDR 0007's own falsifiability criterion for tap-selected content — the multi-fragment model itself, not just its copy, needs revisiting.
- If the safety-tier extension required above (Constitution impact) surfaces even one missed elevated/crisis signal in eval or red-team testing on Life-Understanding or Thought-Generation inputs, this PDR's implementation gate holds — the feature does not ship past that finding, full stop, same as ADR 0008 §4's standard.

---

## Alternatives considered

- **Personalize which curated entries surface instead of generating new ones** (re-rank the existing ~30-entry library by inferred relevance, don't generate novel text). Rejected per the founder's explicit "must NOT be hardcoded" instruction — but worth naming as the lower-risk fallback if the safety-tier extension or content-quality eval work proves substantially harder than this PDR anticipates.
- **Fold this into PDR 0011 as one combined "Adaptive Growth" track.** Rejected — asked and answered directly by the founder: different axis of scope (content generation vs. moment-graph/pacing/safety policy), kept as a separate PDR that references 0011's D3 boundary rather than re-litigating it.
- **Treat Vision Canvas as an additive pre-stage that still converges to one identity statement**, preserving the existing single-card Commitment flow. Rejected — asked and answered directly by the founder: Canvas replaces the card outright, which is why this PDR names Moments 4–9 as needing a full re-choreography rather than a patch.

---

## Migration strategy

1. **This PDR — Proposed → Accepted**, via Design Council + behavioral-review (Sensitive tier, no exceptions — `.claude/CONVENTIONS.md` §2).
2. **Canon §5 amendment:** add Life Dimensions as a canonical concept, reconciled against the existing `Identity.values[]` field (same concept renamed, or genuinely distinct — decided here, not assumed).
3. **New ADR** ("Life Dimension Engine & Thought Generation architecture"): ranking algorithm and storage for dimension/theme relevance, prompt layers and model tier for Life Understanding and Thought Generation calls, the **safety-tier extension required above** (riskTier applied to these new calls, not only Interpretation), latency budget and deterministic fallback, feature-flag strategy — same rigor as ADR 0008, not a lighter bar because this PDR came from the founder directly.
4. **Re-choreograph identity capture:** a new pre-Moment-1 sequence for STEP 0 (Life Understanding context-gathering) and a redesign of Moments 4–9 around the Vision Canvas, produced as a new choreography document (v3) that explicitly carries forward PDR 0007's content-quality bar and v1/v2's motion/keyboard/accessibility work where compatible.
5. **Design Council pass** against the new choreography + ADR (PDR 0010's ten-lens set is the minimum bar, given this touches the same screen at greater scope), with the safety-tier extension treated as build-blocking exactly as PDR 0010 treated Tier 2/3 handling.
6. **Only after 2–5** does any implementation begin.

## Required Constitution / Canon Changes

- `docs/00 Canon.md` §5: add Life Dimensions (exact field shape decided at step 2 above, not here).
- `docs/00 Canon.md` §9 (document map): assign an owner for the Life Dimension taxonomy so it doesn't drift into ad hoc redefinition by whichever engine touches it next.

## Required Architecture Changes

- The new ADR named in Migration strategy step 3, in full.
- Reconciliation with `adr/0008-next-moment-engine-architecture.md`'s `MomentState` enum — Vision Canvas's assembly moments (add/remove/reorder/merge fragment) are new states that enum doesn't yet have.

## Required Experience Changes

- A new choreography for STEP 0 (Life Understanding), not yet designed — must show the adaptive question-count stays genuinely minimal, not a mini-survey (Consequences).
- A v3 re-choreography of Moments 4–9 around Vision Canvas, superseding the relevant sections of v1/v2 while preserving their motion/accessibility work where it still applies.

## Open Questions

- Whether Vision Canvas fragments serialize to a new Canon field or continue mapping to `identity_statements[]` at N≤5 — deferred to the Canon amendment step.
- Exact mechanics of the safety-tier extension to Life-Understanding/Thought-Generation calls (reuse `riskTier` verbatim, or a distinct field) — deferred to the follow-up ADR.
- Whether STEP 0's adaptive 1–2 extra questions can be shown, empirically, to not degrade onboarding completion or the "gets me" guardrail relative to today's near-zero-question Arrival — an open empirical question, not resolved by this PDR's policy call alone.
- Whether Life Dimensions and `Identity.values[]` are the same concept under two names — flagged for the Canon amendment, not resolved here.

## Links

- `decisions/0007-identity-thought-stream-scope-expansion.md` — the "static and curated" clause this PDR supersedes; its content-quality remediation bar carries forward
- `docs/pdr/PDR-0011-adaptive-growth-autonomy-architecture.md` — separate track; this PDR inherits its D3 deterministic-policy boundary by reference, does not supersede it
- `adr/0008-next-moment-engine-architecture.md` §4, §9 — the safety-tier and eval pattern this PDR's follow-up ADR must extend, not merely cite
- `decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md` — the unresolved per-turn safety-screening requirement this PDR extends the scope of
- `decisions/0010-next-moment-engine-design-council.md` — precedent for refusing "resolved on paper, not in behavior" on a safety finding; the standard this PDR's follow-up work must meet
- `docs/identity-onboarding-choreography.md`, `docs/identity-onboarding-choreography-v2.md` — the capture-mechanism assumptions this PDR changes
- `docs/00 Canon.md` §5, §6, §8 — data model, no-raw-model-access, safety/explainability principles engaged here
- `.claude/checklists/onboarding-change.md` — progressive-disclosure and no-life-domain-survey constraints STEP 0 must satisfy
