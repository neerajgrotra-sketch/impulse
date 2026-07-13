# 00 · Method & Evidence Standard

> **Status:** Draft v0.1 — 2026-07. **Purpose:** the rules of intellectual conduct for the `research/` corpus. Every other document in this folder obeys this one. It exists so that a decades-long company does not build its coaching science on a foundation of confidently-stated folk psychology.
>
> This is a **synthesis**, not a set of claims of our own. We invent nothing here. Where we speculate (only in `10`), we label it speculation in bright letters.

---

## 1. The question

We are trying to answer one question honestly: **"What actually causes humans to consistently make better decisions over time?"**

We do **not** assume the answer. We map the competing schools, show where they agree, show where they fight, and — most importantly — show where the evidence is strong, weak, or absent. A reader should finish this corpus knowing not just *what experts believe* but *how much we should trust each belief.*

## 2. The evidence standard (every substantive claim is tagged)

Each significant claim in these documents carries a tier. Use the tag inline, e.g. `[B]`.

| Tier | Meaning | How we treat it |
|---|---|---|
| **A — Robust** | Convergent across independent labs; supported by meta-analysis and/or successful pre-registered replication. | Safe to build on. |
| **B — Solid but bounded** | Well-supported, but with real boundary conditions, heterogeneous/moderate effect sizes, or live debate about *magnitude* (not existence). | Build on with humility; state the boundary. |
| **C — Mixed / contested** | Influential but replication-troubled, largely correlational, or effect sizes shrinking under scrutiny. | Use as a hypothesis, never a foundation. |
| **D — Weak / popular** | Widely believed, thinly evidenced, partly folklore or journalism. | Do not assume. If we use it, we must test it. |
| **M — Mechanistic-plausible, behaviorally untested** | A real biological/cognitive mechanism exists, but the leap from mechanism to a coaching intervention is unproven. | Treat the *mechanism* as real and the *application* as a hypothesis. |

**Rule:** popularity is not evidence. A claim from a bestseller and a claim from a meta-analysis do not get the same tier because they are equally famous.

## 3. Anti-fabrication rules (non-negotiable)

1. **Never invent a citation, DOI, sample size, p-value, or effect size.** If you don't reliably know a precise number, describe the finding qualitatively ("a large multi-lab replication failed to find the effect") rather than fabricate a figure.
2. **Attribute at the level you can defend.** Prefer "the SDT tradition (Deci & Ryan)" or "Gollwitzer's work on implementation intentions" over a fake year-and-journal string.
3. **Separate the popularizer from the science.** Books (Atomic Habits, The Power of Habit, most of the Huberman canon) are *syntheses and popularizations*. Cite the underlying research program, and say plainly when a popular claim outran its evidence.
4. **Distinguish mechanism from intervention.** "Dopamine encodes reward-prediction error" (established) is not "a dopamine-based feature will change behavior" (unproven).
5. **When evidence is thin, say so in the same sentence.** Hedging is not weakness here; false confidence is the failure mode.

## 4. Known "popular but shaky" watchlist (treat identically across all docs)

These recur throughout the source list and are routinely overstated. Every document must represent them consistently with this table.

| Popular claim | What the evidence actually supports | Tier |
|---|---|---|
| **Willpower is a depletable muscle** (ego depletion, glucose model) | A major multi-lab Registered Replication Report found little to no effect; the strong glucose/resource model is largely discredited. Reframes as *motivation/attention shifts* (Inzlicht) are more defensible. | **D** (strong model); C (motivational reframe) |
| **It takes 21 days to form a habit** | Folklore (misread from Maltz). Time-to-automaticity varies enormously — one well-known study found a median around two months with a range of weeks to most of a year. | **D** (the "21 days"); A (that it varies widely) |
| **Keystone habits** transform whole lives | A compelling journalistic frame (Duhigg), not a validated construct. The cue–routine–reward loop is a reasonable gloss on associative learning; "keystone" is largely storytelling. | **C/D** |
| **Grit is a distinct engine of success** | Meta-analytic work shows grit overlaps heavily with conscientiousness and adds only modest incremental prediction; the perseverance facet carries most of the weight. Real, but oversold. | **C** (as distinct trait); B (perseverance) |
| **Growth mindset transforms achievement** | Genuine but small average effects; larger and more reliable for disadvantaged/at-risk students in well-run large trials. Transformative claims are not supported. | **B** (bounded) |
| **Maslow's hierarchy** (strict ascending ladder) | The *needs* are plausibly real; the strict prepotent ordering is not empirically supported. | **D** (strict hierarchy); B (needs exist) |
| **Stages of Change / Transtheoretical Model** | Widely used, widely criticized: stage boundaries are arbitrary and stage-matched interventions have not reliably outperformed alternatives. | **C** |
| **"Dopamine detox" / dopamine = pleasure** | Pop-neuroscience. Dopamine tracks incentive salience ("wanting") and reward-prediction error, not pleasure ("liking"); "detox" has no mechanistic basis. | **D** (detox/pleasure); A (RPE/wanting) |
| **Rejection is literally the same as physical pain** | An influential imaging finding; the strong "same system" interpretation has been contested on reanalysis. | **C** |
| **Loss aversion is a universal 2:1 law** | Prospect theory is foundational and robust; the universality and magnitude of loss aversion are now actively debated. | **B** |
| **Extrinsic rewards always destroy intrinsic motivation** | The overjustification effect is real for *tangible, expected* rewards on *already-interesting* tasks; broad claims are contested. | **B** (bounded) |

Claims that, by contrast, are comparatively **robust [A/B]** and recur across disciplines — flag these too: **implementation intentions** (if-then planning), **cognitive reappraisal** over suppression, the **therapeutic/coaching alliance** as an outcome predictor, **specific + challenging goals** beating "do your best," **reward-prediction error** as a learning signal, and **autonomy-supportive** contexts improving sustained motivation.

## 5. House style

- Extract **principles**, then **compare** and **challenge** them. Do not summarize books chapter by chapter. Do not write biographies.
- Where thinkers disagree, **explain the disagreement and its source** (different methods? populations? incentives? level of analysis?). Never force a fake consensus.
- Voice: a skeptical, multidisciplinary research team. Calm, precise, allergic to hype.
- Open each doc with a one-line Purpose + `Status: Draft v0.1 — 2026-07`; close each with **"Where the evidence is weak / what Impulse must not assume."**
- Cross-link other research docs and, where relevant, `../docs/` by filename.

## 6. Document ownership (avoid overlap)

| Doc | Owns | Coordinate with |
|---|---|---|
| 01 Human Motivation | mechanisms of motivation (intrinsic/extrinsic, identity, purpose, autonomy/mastery/meaning) | 06 owns the *needs-theory comparison*; 01 owns the *dynamics* |
| 02 Decision Science | dual-process, biases, prospect theory, choice architecture, decision fatigue, affect | 08 (nudge), 07 (emotion) |
| 03 Habit Formation | Fogg vs Clear vs Duhigg vs the actual habit-research program; recovery, consistency | 08 (behavior-change models), 01 (self-efficacy) |
| 04 Neuroscience | brain mechanisms: dopamine, stress, reward, sleep, exercise, rejection, uncertainty | flags Huberman-style over-extrapolation; feeds 07 |
| 05 Coaching Science | what makes coaching/therapy work: alliance, questioning, feedback, goals, autonomy | 08 (MI), 01 (autonomy) |
| 06 Human Needs | Maslow vs SDT vs evolutionary vs positive psych — a *comparison* | 01 (motivation dynamics) |
| 07 Emotional Regulation | Gross process model, reappraisal, mindfulness, ACT/DBT — what works | 04 (mechanism), 02 (affect in decisions) |
| 08 Behavior Change Models | COM-B, Fogg, TTM, MI, implementation intentions, ACT, HAPA — a *comparison* | 03 (habits), 05 (MI) |
| 09 Contradictions | the live disagreements, their causes, and what Impulse must not assume | reads 01–08 |
| 10 Research Synthesis | convergent principles, repeated ideas, controversial, probably-wrong, the foundation + **10 speculative hypotheses** | reads 01–09 |

## 7. Source-class labels (tag every material claim)

The evidence tiers (§2) say *how strong* a finding is. The **source class** says *what kind of thing it is* — because a philosophical argument and a meta-analysis are not weak and strong versions of the same object; they are different objects, and conflating them is how speculation gets dressed as science (`../docs/15 Constitution.md §4`, non-negotiable #6). Tag material claims with both.

`〔MA〕` meta-analysis / systematic review · `〔PR〕` major peer-reviewed study · `〔TM〕` established theoretical model · `〔PW〕` primary work of a named thinker · `〔PInt〕` practitioner interpretation · `〔Pop〕` popular book · `〔Phil〕` philosophical argument · `〔IH〕` Impulse-specific hypothesis.

**A popular author is never cited as consensus.** Huberman, Clear, Duhigg, and the product thinkers (Jobs, Rams, Krug, Christensen) may contribute `〔PInt〕`/`〔Pop〕` interpretations or product principles — never a substitute for `〔MA〕`/`〔PR〕` evidence. Prefer, in order: `〔MA〕` → `〔PR〕` → authoritative academic books / `〔TM〕` → `〔PW〕` → `〔Pop〕` as secondary interpretation only.

## 8. Research is an input into architecture — the mandatory "Architecture Impact" section

Research is not documentation; it is an **input into architecture** (`../docs/10 Engineering Principles.md §9`). A research document is not finished when written — it is finished when its architectural consequences have been assessed. Therefore **every research document (01–10) ends with an `Architecture Impact` section** (placed just before the closing "Sources requiring verification" / weak-evidence section). It answers exactly four questions:

1. **What changed?** — the finding(s) in this document that materially affect how we understand human behavior.
2. **Why?** — the evidence and its strength (tier + source class) that forces the change.
3. **Which documents should be updated?** — name them from: `03 Human Model`, `04 AI Brain`, `05 Onboarding`, `06 Decision Engine`, `07 Coaching Engine`, `08 Database Architecture`, `13 Prompt Architecture`, `14 Notification Engine`, `15 Constitution`, `09 Roadmap`.
4. **What assumptions should now be challenged?** — name any live architectural assumption this evidence contradicts, explicitly.

**We do NOT auto-edit those architecture documents from a research doc.** The research author *recommends*; changes flow through the normal review + ADR/PDR gate so the reasoning is recorded. If the evidence contradicts a standing assumption, the section says so plainly. *Reality never adapts to the architecture; the architecture adapts to reality.* (Governance decision: `../decisions/0005-product-never-outruns-evidence.md`.)

## 9. What "done" looks like

A reader trusts these documents *because* they can see the seams — the doubts, the failed replications, the open questions. If a document reads like a confident TED talk, it has failed this standard. And a document with no assessed **Architecture Impact** (§8) is not done, however well-written.
