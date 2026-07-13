# 02 · Decision Science

> **Status:** Draft v0.2 — 2026-07 (rewritten to the cited-evidence standard). **Purpose:** map how humans *actually* decide — the mechanisms, the systematic errors, and the levers that move behavior — grading each claim by how much weight it can bear, so the **Decision Engine** and **Coaching Engine** coach on science, not folklore. This is the document most directly load-bearing for what happens inside an **Impulse Moment**.
>
> Read alongside `00 Method & Evidence Standard.md`. Source-class labels: `〔MA〕` meta-analysis · `〔PR〕` peer-reviewed study · `〔TM〕` theoretical model · `〔PW〕` primary work · `〔PInt〕` practitioner · `〔Pop〕` popular book · `〔Phil〕` philosophy · `〔IH〕` Impulse hypothesis. Evidence tiers `[A]`–`[D]`/`[M]` per `00 §2`.

---

## 1. Bounded rationality — the foundation everything else sits on

Before biases, the reframe that made decision science possible: humans are not utility-maximizers with errors bolted on; we are **boundedly rational** — we satisfice within limits of information, attention, and computation (Simon, 1955) `〔TM〕`/`〔PW〕` `[A]`. "Satisficing" (accept the first option that clears a threshold) is not a failure of rationality; it is rationality adapted to real constraints. This matters for Impulse: an **Impulse Moment** is a low-information, high-load, time-pressured decision — exactly the conditions under which satisficing and shortcuts dominate. **We are not debugging a broken calculator; we are supporting a mind doing the best it can with limited resources.**

## 2. Dual-process theory (System 1 / System 2) — useful metaphor, contested architecture

The popular frame (Kahneman, 2011, *Thinking, Fast and Slow* `〔Pop〕`; built on Stanovich & West, and Evans' dual-process tradition `〔TM〕`) distinguishes fast, automatic, affective **System 1** from slow, effortful, deliberative **System 2**. As a *descriptive* vocabulary it is genuinely useful and widely taught `[B]`.

But the honest caveat the popularization drops: **"two systems" is a metaphor, not a verified cognitive architecture.** Serious critiques argue the dichotomy is really a continuum, that the defining features (fast/slow, automatic/controlled, affective/cognitive) do not reliably co-occur, and that treating "System 1" as an agent explains little (Melnikoff & Bargh, 2018, "The Mythical Number Two"; Keren & Schul, 2009) `〔PR〕` `[C]`. **Impulse must not assume** a literal two-system brain, or that "engage System 2" is a coherent instruction. What survives is weaker and still useful: much behavior is automatic and cue-driven, and deliberation is effortful and often bypassed.

## 3. Heuristics and biases — real, foundational, and partly dented by the replication era

Kahneman & Tversky's program showed judgment relies on heuristics that usually work but produce systematic errors: **availability** (ease of recall as a proxy for frequency), **representativeness** (similarity as a proxy for probability), and **anchoring** (arbitrary starting values contaminating estimates) `〔TM〕`/`〔PW〕`. The core is foundational `[B]`; **anchoring in particular is among the most robust effects in the field** `[A]`.

The correction: this literature was not spared the replication crisis. Some specific, famous demonstrations (several social-priming effects adjacent to this tradition) failed to replicate, and effect sizes for some biases shrank under pre-registration `[C]`. The *phenomenon* of systematic bias is not in doubt; the reliability of any *single cited demonstration* is. We cite the pattern, not the anecdote.

## 4. Prospect theory and framing — the robust core of behavioral economics

Prospect theory (Kahneman & Tversky, 1979; cumulative version Tversky & Kahneman, 1992) `〔TM〕`/`〔PW〕` `[A/B]` is the best-supported formal model here. Its durable claims: outcomes are evaluated as **gains/losses from a reference point** (not absolute wealth); the value function is **concave for gains, convex for losses** (diminishing sensitivity); and people **overweight small probabilities**. **Framing** follows directly — the same option described as "90% survive" vs "10% die" flips choices (Tversky & Kahneman, 1981, the "Asian disease" problem) `〔PR〕` `[B]`. Reference-dependence and framing are real and matter for how the Decision Engine presents options.

## 5. Loss aversion — real but overstated, and now openly contested

The most famous single claim — "losses loom larger than gains," often quoted as a ~2:1 ratio (λ ≈ 2.25 in Tversky & Kahneman, 1992) — is exactly where the field is most uncertain. Gal & Rucker (2018), "The Loss of Loss Aversion," reviewed the evidence and argued there is **no general tendency for losses to loom larger — it depends on context**, and that the flagship supports (endowment effect, status-quo bias) admit alternative explanations `〔PR〕` `[C, contested]`. Commentators (e.g., Simonson & Kivetz) pushed back that loss aversion is real but **contingent**, not universal `[B]`. Net: reference-dependence `[A/B]`; a universal 2:1 loss-aversion law `[C]`. **Impulse must not build a coaching mechanic that assumes a fixed loss-aversion multiplier** (e.g., "frame the Future Self's loss to double the motivation") — the effect is context-dependent, and loss-framing also recruits avoidance motivation, which `01 Human Motivation.md §8` flags as less durable.

## 6. Choice architecture and nudges — a real tool with a shrinking, contested effect size

Thaler & Sunstein's *Nudge* `〔Pop〕`/`〔TM〕` established that the framing and defaulting of choices reliably shifts behavior — **defaults** (opt-out organ donation, auto-enrolment pensions) are the strongest, most replicated case `[A]`. Beyond defaults, the picture is now genuinely contested:
- A large meta-analysis found an overall nudge effect of **d = 0.43** (Mertens et al., 2022) `〔MA〕` — but a re-analysis argued that **after correcting for publication bias, no evidence for a general nudge effect remained** (Maier et al., 2022) `〔PR〕` `[C]`.
- Field evidence from government "nudge units" found effects **far smaller than the academic literature** — on the order of a percentage point or two, versus much larger published effects (DellaVigna & Linos, 2022) `〔PR〕` `[B]`.

Verdict: **defaults and friction are reliable `[A]`; the broad "nudges work" claim is weaker and inflated by publication bias `[C]`.** For Impulse: prefer structural levers (defaults, friction, making the aligned choice easy — see Fogg ability in `08`) over clever one-off nudges, and instrument everything, because the honest expected effect is small.

## 7. Choice overload — a cautionary tale about a "known" effect that mostly isn't

The famous jam-tasting study (Iyengar & Lepper, 2000) `〔PR〕` popularized "too many choices reduce choice." But a meta-analysis of 50 experiments (N ≈ 5,036) found a **mean effect near zero with large variance** (Scheibehenne, Greifeneder & Todd, 2010) `〔MA〕` `[C]`. A later meta-analysis (Chernev, Böckenholt & Goodman, 2015) reconciled this by identifying **moderators** (choice-set complexity, decision difficulty, preference uncertainty) under which overload appears `[B]`. **Impulse lesson (methodological, not just topical):** a single vivid study became "textbook fact" and largely evaporated under meta-analysis. This is precisely why `decisions/0005` exists — we do not ship coaching built on one memorable finding.

## 8. Decision fatigue — largely unsupported in its strong form

"Decision fatigue" rests conceptually on ego depletion, whose **strong resource model failed a 23-lab pre-registered replication** (Hagger et al., 2016, N ≈ 2,141) `〔MA〕`/`〔PR〕` `[D]`. Its most-cited real-world illustration — the "hungry judges" parole study (Danziger et al., 2011), where favorable rulings allegedly dropped from ~65% to near 0% across a session `〔PR〕` — is **confounded**: case ordering was not random (unrepresented prisoners, who fare worse, tend to be scheduled last), and the effect magnitude is implausibly large for a lunch break (Weinshall-Margel & Shapard, 2011; Glöckner, 2016) `〔PR〕` `[D]`. **Impulse must not assume** a general "willpower/decision budget that depletes over the day." A motivational/attention account (Inzlicht) is more defensible `[C]`. This directly *contradicts* any latent architectural assumption that we should, say, "protect the user's limited daily decision energy."

## 9. Emotion in decision making — central, but the famous models are shaky

That affect is integral to decision-making (not an intrusion on it) is well-supported `[B]`. The specific frameworks are weaker than their fame:
- **Affect heuristic** (Slovic et al.) — we judge risk/benefit partly by how we *feel* about a thing `〔TM〕` `[B/C]`.
- **Somatic marker hypothesis** (Damasio, 1994) — bodily/emotional signals guide choice `〔PW〕` `[C, contested]`; influential, mechanistically debated (see `04 Neuroscience.md`).
- **Risk-as-feelings** (Loewenstein et al., 2001) — emotional reactions to risk diverge from cognitive assessments and often drive behavior `〔TM〕` `[B]`.
For Impulse: emotional state is a first-class input to a decision (hence the **EmotionSignal**, `00 Canon.md §4`), and coaching an unregulated state with logic is a known error (`07 Emotional Regulation.md`).

## 10. Uncertainty and ambiguity

People distinguish **risk** (known probabilities) from **ambiguity** (unknown probabilities) and are typically **ambiguity-averse** (Ellsberg paradox) `〔PR〕` `[B]`. A broader, more mechanistic account — the brain as a **prediction machine** minimizing surprise (predictive processing) — is theoretically rich but its behavioral/coaching implications are `[M]` (mechanism plausible, application unproven; see `04`). **Impulse must not** overclaim from predictive-processing language.

## 11. Temporal discounting and present bias — the engine of the Impulse Moment

This is arguably the single most relevant body of work for Impulse. Humans **discount future rewards**, and do so **hyperbolically** — near-term rewards are valued disproportionately, producing preference reversals (Ainslie) `〔TM〕`. Behavioral economics formalizes this as **quasi-hyperbolic (β–δ) discounting** (Laibson, 1997) `〔PR〕` and **present bias** — the systematic over-weighting of *now* (O'Donoghue & Rabin, 1999) `〔TM〕` `[B]`. This *is* the gap between **Present Self** and **Future Self** in `../docs/01 Vision.md`, stated in formal terms: Present Self applies a steep, inconsistent discount that Future Self does not share. **Strongly relevant, moderately-to-well supported** — but note the discount *rate* is highly heterogeneous across people and domains, so there is no single number to design against.

## 12. The hot–cold empathy gap — why "just decide in advance" is hard

People systematically **mispredict how they will behave in a different visceral state** — when calm ("cold"), we underestimate the power of hunger, craving, arousal, or fear ("hot"), and vice versa (Loewenstein, 1996, 2005) `〔TM〕`/`〔PW〕` `[B]`. This is central: a user who plans their Future-Self-aligned response in a cold state will under-prepare for the hot state of the actual **Impulse Moment**. **Impulse implication `〔IH〕`:** plans made in the cold state should explicitly anticipate the hot state (this is *why* implementation intentions and precommitment, below, work — they pre-load the response so the hot state has less to overcome).

## 13. Implementation intentions — one of the most robust levers we have

If-then planning — "**If** situation Y occurs, **then** I will do X" — reliably closes the gap between intention and action: a meta-analysis of 94 independent tests found a **medium-to-large effect (d = 0.65)** on goal attainment (Gollwitzer & Sheeran, 2006) `〔MA〕` `[A/B]`. It works by delegating action initiation to a pre-specified cue, so the behavior fires automatically when the cue appears — bypassing in-the-moment deliberation (and the hot–cold gap). **This is the highest-confidence, most directly actionable finding in this document for Impulse**, and it should be a first-class Decision-Engine mechanic. Caveat: effects are stronger for initiation than for complex or willpower-heavy goals, and can fade without the cue actually recurring.

## 14. Precommitment — binding the Present Self

Where implementation intentions pre-load a *response*, precommitment removes or penalizes the tempting option in advance (the Ulysses contract). Field evidence: self-imposed deadlines improve performance but less well than externally imposed ones (Ariely & Wertenbroch, 2002) `〔PR〕`; the "Save More Tomorrow" program used present bias *for* the user by committing future raises to savings (Thaler & Benartzi, 2004) `〔PR〕` `[B]`. **Impulse implication `〔IH〕`:** offering the user precommitment devices (chosen freely — consistent with autonomy, `01 §2`, and the Constitution) is evidence-based, but must never become the app *imposing* constraints (`../docs/15 Constitution.md §4`).

## 15. Habits vs. conscious decisions — much of "deciding" isn't

A large share of daily behavior is not decided at all — it is **cued habit** running with little deliberation (Wood & Neal; detailed in `03 Habit Formation.md`) `[B]`. Decision science and habit science meet here: an **Impulse Moment** may be a genuine deliberative fork, or it may be an automatic cue-triggered routine wearing the costume of a decision. **These require different interventions** — deliberation support vs. cue/environment disruption — and misclassifying one as the other is a design error the Decision Engine must guard against.

## 16. The intention–behavior gap — the humbling frame

The finding that should temper every ambition here: **intentions predict behavior only weakly.** A meta-analysis of experimental studies found that a medium-to-large change in *intention* produced only a small-to-medium change in *behavior* (Webb & Sheeran, 2006) `〔MA〕` `[A/B]`. Motivation and good intentions are cheap; enactment is where people fail. This is why the volitional levers (§13, §14) matter more than persuasion, and it echoes `01 Human Motivation.md §10`: **do not treat a failure to act as a failure to want.**

---

## Strongly supported findings `[A]`

- Bounded rationality / satisficing under real constraints (Simon). `〔TM〕`
- Reference-dependence and framing effects (prospect theory core; Tversky & Kahneman, 1981). `〔TM〕`
- Anchoring is a robust judgment effect. `〔PR〕`
- **Defaults** reliably shift behavior (the strongest choice-architecture result). `[A]`
- Implementation intentions produce medium-to-large improvements in goal enactment (Gollwitzer & Sheeran, 2006, d = 0.65). `〔MA〕`
- The intention–behavior gap is large; changing intention yields much smaller behavior change (Webb & Sheeran, 2006). `〔MA〕`

## Moderately supported findings `[B]`

- Present bias / hyperbolic discounting drives near-term over-weighting (Laibson; O'Donoghue & Rabin) — the formal Present/Future Self gap.
- The hot–cold empathy gap (Loewenstein).
- Emotion is integral to decisions; risk-as-feelings (Loewenstein et al., 2001).
- Ambiguity aversion (Ellsberg).
- Precommitment devices improve follow-through (Ariely & Wertenbroch; Thaler & Benartzi).
- Choice overload appears only under specific moderators (Chernev et al., 2015).
- Loss aversion is real but **contingent**, not universal.

## Contested findings `[C]`

- Dual-process "two systems" as literal architecture (Melnikoff & Bargh critique).
- A universal ~2:1 loss-aversion law (Gal & Rucker, 2018).
- The general "nudges work" claim beyond defaults (publication-bias re-analysis; nudge-unit field effects far smaller).
- The affect heuristic and somatic-marker hypothesis as mechanisms.
- Reliability of individual famous bias demonstrations post-replication-crisis.

## Popular misconceptions `[D]`

- **"Willpower/decision energy depletes over the day" (decision fatigue).** Strong ego-depletion model failed a 23-lab replication.
- **"The hungry-judges study proves decision fatigue."** Confounded by non-random case ordering.
- **"More choices always overwhelm people."** Meta-analytic mean effect ≈ zero.
- **"Losses always hurt exactly twice as much as gains."** Context-dependent, not a fixed law.
- **"Nudges are a reliable, large lever."** Effects are small and publication-bias-inflated outside of defaults.
- **"You have a rational System 2 you can just switch on."** The two-system model is a contested metaphor.

## Architecture Impact

*(Per `00 §8` / `../docs/10 Engineering Principles.md §9`. Recommendations only — changes flow through the normal review + ADR/PDR gate; this document does not edit the architecture.)*

- **What changed?** (1) The evidence identifies **implementation intentions** and **defaults/friction** as the highest-confidence behavior-change levers — stronger than persuasion or motivation. (2) It **discredits decision fatigue / ego depletion** `[D]`. (3) It shows the **intention–behavior gap** is the central problem, not intention itself. (4) It cautions that **loss-framing and nudges are weaker/more contingent** than commonly assumed.
- **Why?** Gollwitzer & Sheeran (2006) `〔MA〕` `[A/B]`; Webb & Sheeran (2006) `〔MA〕`; Hagger et al. (2016) `〔MA〕` `[D]`; Mertens (2022)/Maier (2022)/DellaVigna & Linos (2022) `[C]`; Gal & Rucker (2018) `[C]`.
- **Which documents should be updated?**
  - `06 Decision Engine.md` — elevate **if-then implementation-intention capture** and **freely-chosen precommitment** to first-class flows; add explicit **"is this a deliberative decision or an automatic habit?"** classification before choosing an intervention (§15); ensure the time-horizon reframe does not rely on a fixed loss-aversion multiplier (§5).
  - `03 Human Model.md` — represent the user's decision as governed by **present bias + hot–cold state**, and carry the deliberative-vs-habitual distinction.
  - `07 Coaching Engine.md` — de-emphasize persuasion/motivation moves in favor of volitional moves (help the user form an if-then plan) given the intention–behavior gap.
  - `14 Notification Engine.md` — temper expected nudge effect sizes; prefer cue-based reminders tied to a user's own implementation intention over generic motivational nudges.
- **What assumptions should now be challenged?**
  - Any latent assumption that **"protecting limited daily willpower/decision energy"** is a real mechanism — **it is not** `[D]`; do not design around it.
  - Any assumption that **loss-framing the Future Self** is a reliable, large motivator — it is contingent and may recruit avoidance motivation (`01 §8`).
  - Any assumption that **motivating the user harder** closes the gap — the gap is largely volitional/enactment, not motivational.

## Product implications for Impulse `〔IH〕`

1. **Make implementation intentions a core Decision-Engine mechanic** — capture "if [cue], then [Future-Self-aligned action]" at the moment of intent. Highest-confidence lever here. `[A/B]`
2. **Offer freely-chosen precommitment**, never imposed (autonomy + Constitution). `[B]`
3. **Classify the moment**: deliberative fork vs. automatic habit → different interventions (§15). `[B]`
4. **Design the option presentation with reference-dependence in mind** (framing is real) — but **do not** hard-code a loss-aversion multiplier. `[A]`/`[C]`
5. **Prefer structural levers (defaults, friction, ability) over clever nudges**, and instrument for small effects. `[A]`/`[C]`
6. **Anticipate the hot state in cold-state planning** — plans must survive the visceral moment. `[B]`
7. **Stop treating non-action as low motivation** — the intention–behavior gap is the real enemy. `[A/B]`

## Open research questions

- Do implementation intentions retain the d ≈ 0.65 effect when formed *with an AI coach* and for *emotionally charged* impulse decisions (most lab work is mundane goals)?
- Can Impulse reliably classify, in real time, a deliberative decision vs. an automatic habit from a user's message?
- What is the real, honestly-measured effect size of an in-app nudge for our population — and does it survive our own publication-bias-free measurement?
- Does framing toward Future-Self *gain* outperform *loss*-framing on real decisions (ties to `01 §8` approach/avoidance)?

## Sources requiring verification

**Directly verified this run (reliable):** Scheibehenne, Greifeneder & Todd (2010, *JCR*); Hagger et al. (2016, *Perspectives on Psych Science*); Danziger et al. (2011, *PNAS*) + Weinshall-Margel & Shapard (2011, *PNAS*); Mertens et al. (2022, *PNAS*) + Maier et al. (2022, *PNAS*); Gollwitzer & Sheeran (2006, *Advances in Exp. Soc. Psych.* 38); Gal & Rucker (2018, *JCP* 28).

**Cited from established knowledge (author/year/venue high-confidence; verify exact figures before external publication):** Simon (1955, *QJE*); Kahneman & Tversky (1979, *Econometrica*); Tversky & Kahneman (1981, *Science* 211; 1992, *J. Risk & Uncertainty* — λ ≈ 2.25); Kahneman (2011); Melnikoff & Bargh (2018, *TiCS*); Keren & Schul (2009); Iyengar & Lepper (2000, *JPSP*); Chernev, Böckenholt & Goodman (2015, *JCP*); Danziger effect magnitude critique — Glöckner (2016, *Judgment & Decision Making*); Damasio (1994); Slovic et al. (affect heuristic); Loewenstein et al. (2001, *risk as feelings*, *Psych Bulletin*); Loewenstein (1996, 2005, hot–cold gap); Ellsberg (1961); Laibson (1997, *QJE*); O'Donoghue & Rabin (1999, *AER*); Ainslie (hyperbolic discounting); Ariely & Wertenbroch (2002, *Psych Science*); Thaler & Benartzi (2004, *JPE*, Save More Tomorrow); Webb & Sheeran (2006, *Psych Bulletin*); DellaVigna & Linos (2022, *Econometrica*); Wood & Neal (habits — see `03`). Thaler & Sunstein, *Nudge* (`〔Pop〕`/`〔TM〕`).

## References (verified this run)

1. Scheibehenne, Greifeneder & Todd (2010). Can There Ever Be Too Many Options? A Meta-Analytic Review of Choice Overload. *Journal of Consumer Research*, 37(3), 409–425. https://academic.oup.com/jcr/article-abstract/37/3/409/1827647
2. Hagger et al. (2016). A Multilab Preregistered Replication of the Ego-Depletion Effect. *Perspectives on Psychological Science*, 11(4), 546–573. https://journals.sagepub.com/doi/10.1177/1745691616652873
3. Danziger, Levav & Avnaim-Pesso (2011). Extraneous factors in judicial decisions. *PNAS*. https://www.pnas.org/doi/10.1073/pnas.1018033108 — critique: Weinshall-Margel & Shapard (2011), *PNAS*. https://www.pnas.org/doi/10.1073/pnas.1110910108
4. Mertens, Herberz, Hahnel & Brosch (2022). The effectiveness of nudging: A meta-analysis. *PNAS*. https://www.pnas.org/doi/10.1073/pnas.2107346118 — re-analysis: Maier et al. (2022), No evidence for nudging after adjusting for publication bias, *PNAS*. https://www.pnas.org/doi/10.1073/pnas.2200300119
5. Gollwitzer & Sheeran (2006). Implementation Intentions and Goal Achievement: A Meta-Analysis of Effects and Processes. *Advances in Experimental Social Psychology*, 38, 69–119. https://www.semanticscholar.org/paper/Implementation-intentions-and-goal-achievement:-A-Gollwitzer-Sheeran/c4deb3507fe725ce6363c1735f1ba83bab20d665
6. Gal & Rucker (2018). The Loss of Loss Aversion: Will It Loom Larger Than Its Gain? *Journal of Consumer Psychology*, 28, 497–516. https://myscp.onlinelibrary.wiley.com/doi/abs/10.1002/jcpy.1047
