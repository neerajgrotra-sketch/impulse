# 01 · Human Motivation

> **Status:** Draft v0.2 — 2026-07 (rewritten to the cited-evidence standard). **Purpose:** synthesize what is actually known about *why humans initiate, direct, and sustain effort* — and, just as importantly, where that knowledge is strong, weak, or contested. This document answers one slice of the corpus question: how much of "making better decisions over time" is a motivation problem at all?
>
> Read alongside `00 Method & Evidence Standard.md` (evidence tiers, anti-fabrication rules). This doc owns the **dynamics/mechanisms** of motivation; the **comparison of needs theories** lives in `06 Human Needs.md`.

## How to read the source labels

Per the research-integrity rules, every material claim is tagged by **source class**, and — where useful — by the `00` evidence tier `[A]`–`[D]`/`[M]`.

`〔MA〕` meta-analysis / systematic review · `〔PR〕` major peer-reviewed study · `〔TM〕` established theoretical model · `〔PW〕` primary work of a named thinker · `〔PInt〕` practitioner interpretation · `〔Pop〕` popular book · `〔Phil〕` philosophical argument · `〔IH〕` Impulse-specific hypothesis.

**A popular author is never cited as consensus.** Clear, and similar synthesizers, appear as `〔Pop〕`/`〔PInt〕` only.

---

## 1. The intrinsic/extrinsic distinction — real, but not a clean binary

The oldest useful cut is between doing something **because the activity itself is rewarding** (intrinsic) and **because it leads to a separable outcome** (extrinsic). The distinction is well-supported `〔TM〕` and predictive: in a 40-year meta-analysis (k = 183, N ≈ 212,000), intrinsic motivation was a **medium-to-strong predictor of performance** (ρ ≈ .21–.45), and — critically — intrinsic motivation and extrinsic incentives *jointly* predicted performance rather than one simply replacing the other (Cerasoli, Nicklin & Ford, 2014) `〔MA〕` `[A]`.

The important correction to the folk version: extrinsic motivation is **not** monolithic or uniformly inferior. SDT (below) decomposes it into a gradient from externally coerced to fully internalized, and the internalized forms behave much like intrinsic motivation `〔TM〕`. **Impulse must not treat "extrinsic = bad."** The question is not intrinsic-vs-extrinsic but *how self-endorsed* the reason is.

## 2. Self-Determination Theory — the best-evidenced motivational framework we have

SDT (Deci & Ryan, 1985; Ryan & Deci, 2000) `〔TM〕`/`〔PW〕` proposes three basic psychological needs whose satisfaction predicts sustained, high-quality motivation and well-being:

- **Autonomy** — experiencing one's actions as self-endorsed (not "freedom from others," but volition).
- **Competence** — feeling effective, making progress.
- **Relatedness** — feeling connected to and mattering to others.

Why SDT earns `[B]` (strong, bounded) rather than `[A]`: the evidence base is large, cross-national, and spans lab, field, work, health, and education; autonomy-supportive contexts reliably improve **sustained** motivation, deeper processing, and persistence (e.g., Vansteenkiste et al., 2004, showing intrinsic goal framing + autonomy support improved conceptual learning and long-term persistence) `〔PR〕`. The bounding: much of SDT's core is correlational or short-horizon experimental, and the **universality** of the needs (especially whether autonomy is equally weighted across collectivist cultures) is actively debated `〔PR〕` `[B/C]`. Autonomy in SDT means *volition*, not *independence* — a distinction that survives cross-cultural critique better than the caricature.

**For Impulse this is the load-bearing theory:** a coach that undermines autonomy (tells the user what to do) may raise short-term compliance while eroding the exact motivation it needs. This aligns with the product's "coach, never parent" principle (`../docs/02 Product Philosophy.md`).

## 3. Rewards and incentive crowding — the effect is real, and bounded

Do extrinsic rewards *undermine* intrinsic motivation? The strongest evidence says **yes, under specific conditions.** The Deci, Koestner & Ryan (1999) meta-analysis (128 experiments) found that **tangible, expected, contingent rewards significantly reduced free-choice intrinsic motivation** on already-interesting tasks — engagement-, completion-, and performance-contingent rewards showed undermining effects of roughly d = −0.40, −0.36, and −0.28 `〔MA〕` `[B]`. This is the "overjustification effect."

Two honest caveats that the popular retelling drops:
1. It was **contested**: Cameron & Pierce (1994) `〔MA〕` argued the effect was overstated; the Deci et al. reanalysis rebutted this, and the current weight of evidence supports a **real but bounded** effect — strongest for *tangible, expected* rewards on *already-interesting* tasks, weak or absent for dull tasks and for verbal/informational rewards `[B]`.
2. Economics found a parallel, non-monotonic pattern: small monetary incentives can produce **worse** performance than no incentive ("Pay Enough or Don't Pay at All"; Gneezy & Rustichini, 2000) `〔PR〕` `[B]`, consistent with incentives *reframing* a task from social/intrinsic to transactional.

**Impulse implication `〔IH〕`:** any streak, points, or reward mechanic risks crowding out the identity-level motivation we actually want. This is direct empirical support for the product's rejection of gamified streaks (`../decisions/0002-streaks-are-an-anti-metric.md`).

## 4. Identity-based motivation — promising theory, oversold in popular form

The claim that behavior flows from **who we believe we are** ("I am a runner," not "I want to run") has genuine research behind it: Oyserman's Identity-Based Motivation model `〔TM〕` shows that identities are situationally cued and that whether a goal feels *identity-congruent* affects effort and interpretation of difficulty `〔PR〕` `[C→B]`. It connects to self-signaling and to SDT's internalization.

James Clear's *Atomic Habits* popularized "identity-based habits" `〔Pop〕` — a useful, motivating framing, but its confident causal claims outrun the peer-reviewed base. We treat the **mechanism as plausible `[C/B]`** and the **popular formulation as interpretation, not evidence.** (Deeper treatment of the habit-specific claims is in `03 Habit Formation.md`.)

## 5. Self-efficacy — a robust motivational engine

Bandura's self-efficacy — *belief in one's capacity to execute the actions a situation requires* (Bandura, 1977, 1997) `〔TM〕`/`〔PW〕` — is among the better-replicated motivational constructs. A meta-analysis of 114 studies (N ≈ 21,600) found a weighted mean correlation of **r ≈ .38 between self-efficacy and work performance** (Stajkovic & Luthans, 1998) `〔MA〕` `[A/B]`, with task complexity as a moderator (larger effects on simpler tasks). Self-efficacy is built primarily through **mastery experiences** (small, real wins), then vicarious models, social persuasion, and reinterpreting physiological arousal `〔TM〕`.

Distinction that matters: self-efficacy (*can I do this?*) is separable from competence-need satisfaction (*do I feel effective?*) and from outcome expectancy (*will it work?*). **Impulse implication `〔IH〕`:** engineering early, attributable wins after a Lapse should rebuild efficacy — the mechanistic basis for the Recovery flow (`03 Habit Formation.md`).

## 6. Goal orientation and mastery — the shape of "why" matters

Achievement-goal theory distinguishes **mastery goals** (improve, understand) from **performance goals** (demonstrate ability / avoid looking incompetent) `〔TM〕`. Mastery orientation is generally associated with deeper engagement, resilience after setbacks, and intrinsic interest; performance-*avoidance* goals are the most consistently maladaptive `〔PR〕` `[B]`, though the "mastery is always best" story is more mixed than often claimed (performance-approach goals can aid achievement in competitive settings) `[C]`. This is the empirical cousin of Dweck's mindset work and of Aristotle's view that excellence is cultivated through practice toward a *telos* `〔Phil〕`.

## 7. Expectancy-value — the most complete predictive account of effort

Expectancy-value theory (Eccles & Wigfield; Atkinson lineage) `〔TM〕` holds that motivation for a task ≈ **expectancy of success × subjective value**, where value decomposes into interest/intrinsic, attainment (identity relevance), utility, and **cost** (Eccles & Wigfield, 2002) `〔PR〕` `[B]`. Its power is integrative: it absorbs self-efficacy (expectancy), identity (attainment value), and the frequently-ignored **cost** term — effort, opportunity cost, emotional price. Behavioral economics' present bias/hyperbolic discounting is, in this frame, a systematic distortion of the value-over-time computation (see `02 Decision Science.md`).

**Impulse implication `〔IH〕`:** the "cost" term is under-served by most self-improvement products. In an Impulse Moment, lowering *perceived cost* (Fogg's ability axis, `08`) may matter more than raising motivation.

## 8. Approach and avoidance motivation — a foundational axis

A distinction older than most on this list: behavior is organized around **approaching desired end-states** and **avoiding undesired ones** (Elliot & Church, 1997; Elliot, 1999) `〔TM〕`/`〔PR〕` `[B]`, with partly distinct neural and affective signatures (see `04 Neuroscience.md`). Avoidance-based regulation (acting to prevent a bad outcome) tends to be more anxious, narrower, and less durable than approach-based regulation. **Impulse implication `〔IH〕`:** framing a decision as *moving toward the Future Self* rather than *avoiding failure* is not merely gentler tone — it plausibly recruits a healthier motivational system. This is a testable hypothesis, not an established app-level finding.

## 9. Purpose and meaning — real for well-being, weaker as a behavior lever

That meaning and purpose matter for well-being is well-supported `〔PR〕` `[B]`; that they reliably *drive specific daily decisions* is much weaker. Seligman's PERMA `〔TM〕`/`〔Pop〕` organizes well-being into Positive emotion, Engagement, Relationships, Meaning, Accomplishment, but the model is better as a **taxonomy than a validated causal engine**, and positive-psychology intervention effects have shrunk under better-controlled trials `[C]` (see `06 Human Needs.md`). Frankl's logotherapy `〔Phil〕`/`〔PW〕` is a profound clinical-philosophical account, not an empirical program. **Impulse must not assume** that connecting a choice to "life purpose" will move in-the-moment behavior; purpose likely sets the *destination* (the Future Self narrative) while proximal mechanisms (efficacy, ability, cues) do the *moving*.

## 10. The limits of motivation as an explanation

This is the most important section for a company that could over-invest in "motivating" users.

- **The intention–behavior gap is large.** People routinely fail to act on strong intentions; behavior-change research shows intention explains only a modest share of behavior variance, and that *volitional* mechanisms (planning, cues, environment) close much of the gap (see HAPA and implementation intentions in `08`) `[A/B]`. **More motivation is often not the missing ingredient.**
- **"Willpower as fuel" is largely discredited** — the strong ego-depletion model failed a major multi-lab replication (`00` §4) `[D]`. Do not build on it.
- **Grit is oversold.** It correlates with outcomes only moderately and is **statistically near-redundant with conscientiousness** (grit–conscientiousness ρ ≈ .84; Credé, Tynan & Harms, 2017) `〔MA〕` `[C]`. Duckworth's original work is real `〔PW〕`; the "distinct superpower" framing is not supported.
- **Growth mindset is real but small and bounded** — average intervention effects are small (d ≈ 0.08; ~1% of achievement variance; Sisk et al., 2018) `〔MA〕`, with meaningful benefits concentrated in **at-risk/lower-achieving students in supportive environments** (Yeager et al., 2019, N = 12,490) `〔PR〕` `[B, bounded]`. Not transformative; not nothing.

The synthesis: motivation is necessary but **routinely insufficient**. Sustained better decisions depend at least as much on *ability, environment, cues, and regulation* as on wanting. A coaching product that treats every failure as a motivation deficit will misdiagnose most of them.

---

## Strongly supported findings `[A]`

- Intrinsic motivation and extrinsic incentives **jointly** predict performance; intrinsic motivation is a medium-to-strong predictor (Cerasoli et al., 2014). `〔MA〕`
- Self-efficacy reliably predicts performance (r ≈ .38) and is built through mastery experiences (Bandura; Stajkovic & Luthans, 1998). `〔MA〕`/`〔TM〕`
- Specific, difficult goals outperform "do your best" for well-defined tasks (Locke & Latham, 2002). `〔MA〕`/`〔TM〕`
- The intention–behavior gap is real and large; volitional/environmental mechanisms, not just motivation, close it. `[A]` (detailed in `08`)

## Moderately supported findings `[B]`

- SDT's three needs (autonomy, competence, relatedness) predict sustained motivation and well-being; autonomy-support improves persistence and depth (Ryan & Deci, 2000; Vansteenkiste et al., 2004).
- Tangible, expected rewards can undermine intrinsic motivation on interesting tasks (Deci, Koestner & Ryan, 1999); small incentives can backfire (Gneezy & Rustichini, 2000).
- Mastery/approach orientations generally beat avoidance orientations for durability (Elliot & Church, 1997).
- Expectancy-value (incl. a cost term) is a strong integrative predictor of effort (Eccles & Wigfield, 2002).
- Growth-mindset benefits are real but small and concentrated in at-risk populations (Yeager et al., 2019).

## Contested or context-dependent findings `[C]`

- The universality and relative weighting of SDT needs across cultures (autonomy debate).
- Whether mastery goals are *always* superior to performance-approach goals.
- Identity-based motivation's causal strength at the level of daily decisions.
- Positive-psychology / PERMA intervention effect sizes.
- The precise boundary conditions of reward-undermining (task interest, reward type, expectancy).

## Popular claims with weak or incomplete support `[D]`

- "Willpower is a limited fuel you deplete" — strong ego-depletion model failed replication.
- "Grit is a distinct engine of success" — largely redundant with conscientiousness.
- "Growth mindset transforms achievement" — average effects are small.
- "Connect it to your life purpose and you'll act" — purpose predicts well-being, not reliably proximal behavior.
- Identity-based *habit* claims as popularized (treated as `〔Pop〕`, not evidence).

## Product implications for Impulse `〔IH〕`

1. **Optimize for autonomy, not compliance.** Design coaching moves that increase self-endorsed reasons; measure whether users feel *more* volitional over time, not just more active. (SDT `[B]`.)
2. **Treat streaks/points as motivational risk, not reward.** Overjustification predicts they can crowd out identity-level motivation — empirical backing for `decisions/0002`. `[B]`
3. **Engineer attributable early wins**, especially post-Lapse, to rebuild self-efficacy. `[A/B]`
4. **Lower perceived cost in the moment** (expectancy-value's cost term; Fogg ability) rather than trying to manufacture motivation at 11pm. `[B]`
5. **Frame toward the Future Self (approach), not away from failure (avoidance).** `[B]`, testable.
6. **Do not diagnose every Lapse as low motivation** — most are ability/cue/environment failures. This should shape the Decision Engine's causal-attribution logic. `[A/B]`

## Open research questions

- Does an AI coach's autonomy-support reproduce the SDT benefits observed with human agents, or does the medium change the mechanism? (Bridges to `05 Coaching Science.md`.)
- Can approach-framing be induced durably in-app, and does it change real decisions (not just self-report)?
- What is the real half-life of a manufactured "win" on self-efficacy in a consumer setting?
- Does identity-based framing add incremental behavior change *over* good implementation intentions, or is it redundant?

## Sources requiring verification

Directly verified against primary/authoritative sources during this run (citations reliable): Cerasoli, Nicklin & Ford (2014, *Psychological Bulletin*); Deci, Koestner & Ryan (1999, *Psychological Bulletin*); Sisk et al. (2018, *Psychological Science*); Credé, Tynan & Harms (2017, *JPSP*); Yeager et al. (2019, *Nature*); Stajkovic & Luthans (1998, *Psychological Bulletin*); Locke & Latham (2002, *American Psychologist*); Gneezy & Rustichini (2000, *QJE*); Vansteenkiste et al. (2004, *JPSP*).

Cited from established knowledge (author/year/venue high-confidence; **verify exact effect sizes and page numbers against the primary source before external publication**): Ryan & Deci (2000, *American Psychologist* 55); Deci & Ryan (1985); Bandura (1977, *Psychological Review* 84; 1997); Eccles & Wigfield (2002, *Annual Review of Psychology*); Elliot & Church (1997, *JPSP*); Oyserman (Identity-Based Motivation); Dweck (2006); Duckworth et al. (2007, *JPSP* 92); Seligman (2011, *Flourish*); Frankl (1946); Cameron & Pierce (1994); Ordóñez et al. (2009, *Academy of Management Perspectives*); Aristotle, *Nicomachean Ethics*; Clear (2018, *Atomic Habits* — `〔Pop〕`).

## References (verified this run)

1. Cerasoli, Nicklin & Ford (2014). Intrinsic Motivation and Extrinsic Incentives Jointly Predict Performance: A 40-Year Meta-Analysis. *Psychological Bulletin*, 140, 980–1008. https://pubmed.ncbi.nlm.nih.gov/24491020/
2. Deci, Koestner & Ryan (1999). A Meta-Analytic Review of Experiments Examining the Effects of Extrinsic Rewards on Intrinsic Motivation. *Psychological Bulletin*, 125(6), 627–668. https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf
3. Sisk, Burgoyne, Sun, Butler & Macnamara (2018). To What Extent and Under Which Circumstances Are Growth Mind-Sets Important to Academic Achievement? Two Meta-Analyses. *Psychological Science*. https://journals.sagepub.com/doi/abs/10.1177/0956797617739704
4. Credé, Tynan & Harms (2017). Much Ado About Grit: A Meta-Analytic Synthesis of the Grit Literature. *JPSP*, 113, 492–511. https://pubmed.ncbi.nlm.nih.gov/27845531/
5. Yeager et al. (2019). A national experiment reveals where a growth mindset improves achievement. *Nature*. https://www.nature.com/articles/s41586-019-1466-y
6. Stajkovic & Luthans (1998). Self-Efficacy and Work-Related Performance: A Meta-Analysis. *Psychological Bulletin*, 124, 240–261. https://www.semanticscholar.org/paper/Self-efficacy-and-work-related-performance:-A-Stajkovic-Luthans/8b1a6a4fde431c561236402ab4788409a7fabe9d
7. Locke & Latham (2002). Building a Practically Useful Theory of Goal Setting and Task Motivation. *American Psychologist*, 57, 705–717. https://eric.ed.gov/?id=EJ654871
8. Gneezy & Rustichini (2000). Pay Enough or Don't Pay at All. *Quarterly Journal of Economics*, 115(3), 791–810. https://academic.oup.com/qje/article-abstract/115/3/791/1828156
9. Vansteenkiste, Simons, Lens, Sheldon & Deci (2004). Motivating Learning, Performance, and Persistence: The Synergistic Effects of Intrinsic Goal Contents and Autonomy-Supportive Contexts. *JPSP*. https://selfdeterminationtheory.org/SDT/documents/2004_VansteenkisteSimonsLensSheldonDeci_JPSP.pdf
