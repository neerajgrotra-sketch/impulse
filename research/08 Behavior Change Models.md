# 08 · Behavior Change Models — A Comparison

> **Status:** Draft v0.2 — 2026-07 (cited standard; adds cross-model comparison, evidence matrix, one-vs-synthesis verdict, and claim-discipline sections). **Role:** Chief Research Officer / scientific reviewer — not designer. **Purpose:** compare the major behavior-change frameworks by **explanatory power, predictive value, empirical support, and real-world applicability** — not popularity or elegance.
>
> The organizing question is deliberately *not* "which model is best?" but **"what parts of each model survive contact with the evidence?"** Labels: `〔MA〕`meta-analysis/review · `〔PR〕`peer-reviewed (incl. RCT) · `〔TM〕`theory · `〔PW〕`primary · `〔PInt〕`practitioner · `〔Pop〕`popular. Tiers `[A]`–`[D]`. AI-transfer graded **High / Moderate / Low / Unknown** — transfer is never inferred without a basis.

---

## The frameworks

Each is assessed on the same eight questions: **Core assumption · Mechanism · Evidence · Strengths · Limitations · Blind spots · Compatibility with 01–05 · AI transfer.**

### 1. COM-B & the Behaviour Change Wheel (Michie, van Stralen & West, 2011) `〔TM〕`
- **Core assumption:** behavior requires **Capability, Opportunity, and Motivation** simultaneously (C+O+M→B).
- **Mechanism:** diagnose which of C/O/M is deficient, then select intervention functions (BCW) and techniques (BCT Taxonomy v1: 93 techniques, Michie et al., 2013).
- **Evidence:** `[B]` as a **comprehensive, coherent taxonomy** evaluated for completeness; **weak as a predictive theory** — it organizes causes rather than forecasting behavior. Not falsifiable in the usual sense.
- **Strengths:** the most complete integrating map; forces attention to opportunity/environment, which motivation-only models omit.
- **Limitations:** near-unfalsifiable; "motivation" is a broad bucket; being able to *classify* an intervention is not evidence it *works*.
- **Blind spots:** dynamics over time; the intention–behavior gap within "motivation"; emotion.
- **Compatibility (01–05):** high and useful — its Opportunity term matches the environment/context evidence (03, 02); it correctly refuses "motivation alone."
- **AI transfer:** **Moderate** — as a diagnostic scaffold it is fully deliverable; but it prescribes *what* to target, not *how* an agent should do it.

### 2. Motivational Interviewing (Miller & Rollnick) `〔PW〕`
- **Core assumption:** behavior change is blocked by **ambivalence**, resolved by evoking the person's own change-talk (autonomy).
- **Mechanism:** reflective listening, open questions, affirmations, rolling with resistance → self-articulated motivation.
- **Evidence:** `[B]` — beats advice/no-treatment (Rubak 2005, 72 RCTs) but **not significantly better than other active treatments** (Lundahl 2010, g≈0.28 weak / 0.09 active).
- **Strengths:** autonomy-preserving, low-harm, strong for ambivalence and substance use.
- **Limitations:** no clear edge over other active methods; efficacy depends on practitioner skill/fidelity.
- **Blind spots:** the volitional phase — MI builds motivation but says little about *enactment* once willing.
- **Compatibility (01–05):** very high — converges with SDT autonomy (01) and coaching alliance/autonomy support (05).
- **AI transfer:** **Moderate** — reflection/open questions are imitable; fidelity and non-sycophantic evocation are the risk (05 transfer table).

### 3. Acceptance & Commitment Therapy (Hayes) `〔TM〕`
- **Core assumption:** suffering/avoidance drives maladaptive behavior; change comes from **psychological flexibility** (acceptance + values-based action), not symptom control.
- **Mechanism:** defusion, acceptance, present-moment contact, values clarification, committed action.
- **Evidence:** `[B]` — effective vs controls (A-Tjak 2015, g≈0.57) but **not significantly superior to CBT**; component/process evidence is mixed.
- **Strengths:** targets the emotion/avoidance layer other models ignore; values→action link.
- **Limitations:** not better than existing CBT; "psychological flexibility" is broad and hard to measure.
- **Blind spots:** habit automaticity; environmental determinants.
- **Compatibility (01–05):** high on emotion regulation (04, and forthcoming 07) and values/identity (01); complements rather than competes.
- **AI transfer:** **Low–Moderate** — acceptance/defusion exercises can be scripted; whether they produce the experiential shift via text is unproven.

### 4. Implementation Intentions / if-then planning (Gollwitzer) `〔MA〕`
- **Core assumption:** the gap is **volitional** — willing is not doing; behavior needs a pre-specified cue→response.
- **Mechanism:** "If [situation], then [action]" delegates initiation to an environmental cue, bypassing in-the-moment deliberation.
- **Evidence:** `[A/B]` — **the strongest single-technique evidence here** (Gollwitzer & Sheeran 2006, 94 tests, d≈0.65). MCII/WOOP (Oettingen) adds mental contrasting `[B]`.
- **Strengths:** cheap, specific, robust, mechanistically clear; directly attacks the intention–behavior gap.
- **Limitations:** stronger for initiation than complex/willpower-heavy goals; fades if the cue never recurs.
- **Blind spots:** motivation source; emotion; long-term maintenance.
- **Compatibility (01–05):** extremely high — the enactment lever named repeatedly (02, 03, 12).
- **AI transfer:** **High** — helping a user form and store an if-then plan is squarely within an agent's reach.

### 5. Transtheoretical Model / Stages of Change (Prochaska & DiClemente) `〔TM〕`
- **Core assumption:** people move through discrete **stages** (precontemplation→…→maintenance); interventions should be **stage-matched**.
- **Mechanism:** match processes of change to the current stage.
- **Evidence:** `[C]` — widely used, widely criticized; **Cochrane reviews (e.g., stage-matched smoking cessation, TTM weight-loss) find stage-matching does not reliably outperform non-staged interventions**; stage boundaries are arbitrary (West, 2005).
- **Strengths:** intuitive, popular, drew attention to readiness.
- **Limitations:** the central practical claim (stage-matching superiority) is largely unsupported.
- **Blind spots:** change is often continuous/non-linear, not stepwise.
- **Compatibility (01–05):** low — conflicts with the continuous, cue-and-context view (02, 03).
- **AI transfer:** **Unknown/Low** — easy to *implement* stage logic, but the logic itself lacks support, so transfer is moot.

### 6. Health Action Process Approach (Schwarzer) `〔TM〕`
- **Core assumption:** behavior change has a **motivational phase** (forming intention) and a **volitional phase** (planning, action control) — explicitly bridging the intention–behavior gap.
- **Mechanism:** risk perception + outcome expectancies + **action self-efficacy** → intention; **action & coping planning** + maintenance self-efficacy → behavior.
- **Evidence:** `[B]` — meta-analytic support that self-efficacy and planning predict behavior and mediate intention→action (HAPA meta-analysis).
- **Strengths:** one of the few models that takes the *gap* seriously; integrates self-efficacy + planning.
- **Limitations:** correlational base; many parameters; predicts more than it produces (fewer intervention RCTs).
- **Blind spots:** automaticity/habit; social and emotional dynamics.
- **Compatibility (01–05):** very high — unifies self-efficacy (01), implementation intentions (02), and the enactment gap (12).
- **AI transfer:** **Moderate–High** — its levers (self-efficacy support, planning prompts) are deliverable; the phase logic is a usable scaffold.

### 7. Self-Regulation Theory (Carver & Scheier control theory; Kanfer; Baumeister) `〔TM〕`
- **Core assumption:** behavior is governed by **feedback loops** — compare current state to a goal/standard, act to reduce the discrepancy.
- **Mechanism:** goal-setting → monitoring → discrepancy detection → adjustment.
- **Evidence:** `[B]` for the monitoring component specifically (Harkin 2016, d+≈0.40); the broader theory is `[B/C]` (the willpower-as-resource strand is `[D]`, per 00/02).
- **Strengths:** explains monitoring's power; general and integrative.
- **Limitations:** very broad; parts (ego depletion) are discredited.
- **Blind spots:** why the standard is set; emotion; automatic behavior outside conscious loops.
- **Compatibility (01–05):** high on monitoring (05); the depletion strand conflicts with the evidence (02, 12).
- **AI transfer:** **High** for monitoring/feedback loops (mechanistic, non-relational); low for the discredited willpower parts.

### 8. Social Cognitive Theory (Bandura) `〔TM〕`
- **Core assumption:** behavior arises from **reciprocal determinism** among person (esp. self-efficacy), environment, and behavior.
- **Mechanism:** mastery experiences, modeling, social persuasion, outcome expectancies → self-efficacy → behavior.
- **Evidence:** `[B]` — self-efficacy is well-supported (01; Stajkovic & Luthans r≈.38); the full theory is broad and hard to falsify.
- **Strengths:** self-efficacy is one of the most durable constructs across all documents.
- **Limitations:** breadth verges on unfalsifiable; predicts many things loosely.
- **Blind spots:** in-the-moment automaticity; present bias.
- **Compatibility (01–05):** very high — self-efficacy recurs everywhere (01, 03, 05).
- **AI transfer:** **Moderate** — efficacy-building via engineered small wins and modeling is plausible via an agent; unproven for outcomes.

### 9. Fogg Behavior Model — B = MAP (Fogg) `〔PInt〕`
- **Core assumption:** behavior occurs when **Motivation, Ability, and a Prompt** converge simultaneously.
- **Mechanism:** raise ability (make it tiny) and prompt at the right moment rather than rely on motivation.
- **Evidence:** `[B/C]` — parsimonious and practitioner-validated; more design wisdom than RCT program.
- **Strengths:** actionable; correctly de-emphasizes motivation in favor of ability/prompt.
- **Limitations:** thin independent empirical base as a *model*; borrows validated pieces (prompts≈cues, ability≈friction).
- **Blind spots:** maintenance; emotion; why motivation varies.
- **Compatibility (01–05):** high — ability/prompt align with friction and cue evidence (02, 03).
- **AI transfer:** **Moderate–High** — prompting and ability-reduction framing are deliverable; timing quality is the open question.

### 10. Nudge Theory / Choice Architecture (Thaler & Sunstein) `〔TM〕`/`〔Pop〕`
- **Core assumption:** behavior is shaped by how choices are **structured** (defaults, friction, framing), often below awareness.
- **Mechanism:** re-architect the choice environment.
- **Evidence:** **defaults `[A]`; broad nudge effects `[C]`** — meta d≈0.43 (Mertens 2022) but *no effect after publication-bias correction* (Maier 2022); nudge-unit field effects far smaller (DellaVigna & Linos 2022).
- **Strengths:** structural, scalable; defaults are among the most reliable levers known.
- **Limitations:** effects small/contested outside defaults; often changes the environment, which an app coaching a person does not fully control.
- **Blind spots:** durable internalized change; autonomy (covert nudging conflicts with SDT — 01, 12).
- **Compatibility (01–05):** mixed — defaults compatible; covert manipulation conflicts with autonomy/Constitution.
- **AI transfer:** **Low–Moderate** — an app can structure *its own* choices, not the user's world.

### 11. Tiny Habits (Fogg) `〔Pop〕`/`〔PInt〕`
- **Core assumption:** start absurdly small; anchor to an existing routine; celebrate.
- **Mechanism:** anchor (cue) + tiny behavior + immediate positive affect.
- **Evidence:** anchoring≈implementation intentions `[B]`, tininess≈ability `[B]`; **celebration-cements-habit is weakly evidenced `[C]`** (03).
- **Strengths:** operationalizes ability + cueing well.
- **Limitations:** a repackaging; the novel bit (celebration) is the least evidenced.
- **Blind spots:** motivation, maintenance, recovery.
- **Compatibility (01–05):** high for the borrowed pieces.
- **AI transfer:** **Moderate–High** (anchoring/tininess); **Unknown** for celebration effects.

### 12. Atomic Habits (Clear) `〔Pop〕`
- **Core assumption:** habits compound; behavior flows from **identity** ("become the type of person…").
- **Mechanism:** four laws (obvious/attractive/easy/satisfying) + environment + identity.
- **Evidence:** environment/cue `[B]`; identity→behavior `[C]` (behavior→identity better supported, 03 §3); "1% compounding" `[D]` (illustrative).
- **Strengths:** excellent synthesis of cue/environment/identity framing.
- **Limitations:** confident causal claims outrun evidence; identity-first is the weaker direction.
- **Blind spots:** the intention–behavior gap; recovery.
- **Compatibility (01–05):** partial — environment yes; identity-as-cause contested (03, 12).
- **AI transfer:** **Moderate** (environment/cue framing); **Low** for identity causation claims.

### 13. The Power of Habit (Duhigg) `〔Pop〕`/journalism
- **Core assumption:** habits run on **cue → routine → reward**; some are "keystone."
- **Mechanism:** identify the loop; keep cue+reward, swap the routine.
- **Evidence:** loop `[C]` (reasonable gloss); **keystone habits `[D]`** (not a validated construct).
- **Strengths:** communicable; popularized cue/reward.
- **Limitations:** journalistic; keystone claim unsupported.
- **Blind spots:** motivation, planning, maintenance.
- **Compatibility (01–05):** partial — loop compatible; keystone not.
- **AI transfer:** **Low–Moderate** — loop analysis is scriptable; explanatory value is thin.

### 14. Relapse Prevention Model (Marlatt & Gordon) `〔TM〕`/`〔PW〕`
- **Core assumption:** lapses are normal; whether a **lapse becomes relapse depends on its construal** (abstinence-violation effect).
- **Mechanism:** identify high-risk situations, build coping, reframe lapses as specific/controllable, prevent the shame spiral.
- **Evidence:** `[B]` — meta-analytic support for reducing substance use (Irvin 1999, 26 studies, N≈9,504); AVE well-supported.
- **Strengths:** the only listed model that centers **recovery** — Impulse's likely core (03 §6, 12).
- **Limitations:** developed in addiction; generalization to everyday behavior is plausible but less tested.
- **Blind spots:** initial acquisition; positive-habit formation.
- **Compatibility (01–05):** very high — converges with recovery/self-compassion (03) and no-shaming (05, Constitution).
- **AI transfer:** **Moderate** — risk-planning and reframing are deliverable; crisis-adjacent cases need human care (05, Constitution).

### 15. (Added, stronger evidence than several above) Goal-Setting Theory (Locke & Latham) `〔TM〕`/`〔MA〕`
Included per the directive's invitation because its evidence exceeds TTM and the habit-books. **Core assumption:** specific, difficult, committed goals direct effort. **Mechanism:** goals focus attention, energize, increase persistence, and cue strategy. **Evidence:** `[A/B]` (one of the most replicated in organizational psychology; effect sizes .42–.80 for specific-difficult vs "do your best"). **Limitations/blind spots:** the "goals gone wild" dark side (tunnel vision, unethical shortcuts, Ordóñez); says little about *enactment* or emotion. **Compatibility:** high (01, 05). **AI transfer:** **High** (goal elicitation/specification is squarely deliverable).

---

## Cross-Model Comparison

**Mechanisms that appear repeatedly** (cross-framework convergence — the strongest signal):
- **Self-efficacy** (SCT, HAPA, SRT, MI-adjacent, 01) — nearly universal.
- **Cues / environment / opportunity** (COM-B, FBM, Nudge, Atomic/Power of Habit, ImpInt, 02/03).
- **Planning / if-then / volition** (ImpInt, HAPA, MCII, SRT).
- **Monitoring & feedback loops** (SRT, COM-B, Goal-Setting, 05/Harkin).
- **Autonomy / self-generated motivation** (MI, SDT-in-COM-B-motivation, 01/05).

**Mechanisms almost no model discusses:**
- **Recovery after lapse** — only Relapse Prevention centers it; a striking gap given lapses are the norm (03, 12).
- **Emotion regulation** — only ACT (and implicitly MI) engages it; most models treat the decider as unemotional (contradicts 04).
- **In-the-moment physiological state** (stress/sleep/load) — essentially absent everywhere, yet decisive in 04.
- **Present bias / hot–cold dynamics** — implicit at best (contradicts 02, 04).

**Common assumptions:** most assume behavior is at least partly *goal-directed and modifiable via cognition/planning*, and most now concede *environment matters*.

**Conflicting assumptions:** **motivation-centric** (MI, TTM, SCT) vs **volition/structure-centric** (ImpInt, Nudge, FBM); **stages** (TTM) vs **continuous** (most others); **identity-first** (Atomic Habits) vs **behavior→identity** (03); **willpower-as-resource** (older SRT strand) vs its collapse (02, 12).

**Strongest cumulative evidence** (mechanism, across frameworks): **implementation intentions/planning** and **self-monitoring**, followed by **self-efficacy**, **environment/defaults**, and **autonomy support**. The weakest: **stage-matching**, **keystone habits**, **celebration-cementing**, **identity-as-primary-cause**.

---

## Evidence Matrix

Mechanism strength *as supported within / emphasized by* each framework. **S**trong · **M**oderate · **W**eak · **A**bsent · **U**nknown. Columns: COM-B, MI, ACT, II (implementation intentions), TTM, HAPA, SRT (self-regulation), SCT (social cognitive), FBM, Nudge, RP (relapse prevention), GST (goal-setting).

| Mechanism | COM-B | MI | ACT | II | TTM | HAPA | SRT | SCT | FBM | Nudge | RP | GST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Autonomy | M | S | M | A | W | M | W | M | A | W | M | W |
| Implementation intentions | M | A | S | S | A | S | M | A | M | A | M | W |
| Self-monitoring | M | W | A | A | W | M | S | M | A | A | M | S |
| Feedback | M | M | A | A | W | M | S | M | W | W | M | S |
| Environment design | S | A | W | M | A | W | A | M | S | S | M | A |
| Reflection | M | S | S | A | M | W | M | W | A | A | M | A |
| Values | W | M | S | A | A | W | W | M | A | A | W | M |
| Acceptance | A | M | S | A | A | A | A | A | A | A | M | A |
| Exposure | A | A | M | A | A | A | A | W | A | A | M | A |
| Habit repetition | M | A | A | M | A | W | W | W | S | W | M | A |
| Identity | W | M | M | A | A | A | W | M | A | A | W | W |
| Social support | M | M | W | A | W | M | W | S | W | W | M | W |
| Friction | M | A | A | M | A | A | A | A | S | S | W | A |
| Recovery | W | M | M | A | W | M | M | W | A | A | S | A |
| Emotion regulation | W | M | S | A | A | W | M | W | A | A | M | A |

*(Reading note: the matrix maps coverage/emphasis, not proof of effectiveness. The rows with the most S/M across columns — planning, monitoring, environment, autonomy, self-efficacy-adjacent — are the mechanisms with the broadest cross-framework support; the sparse rows — acceptance, exposure, recovery, emotion regulation — are under-covered by mainstream behavior-change models, a gap noted above.)*

---

## Special question: one framework, or a synthesis?

**If forced to build a behavior-change company on a single framework, the evidence says: do not.** Reasoning, evidence-only:
- **No single framework holds both broad coverage and strong predictive/interventional evidence.** The most *comprehensive* (COM-B) is a taxonomy that does not predict; the most *evidenced single technique* (implementation intentions) is narrow (initiation, not maintenance or emotion); the most *popular* (TTM, habit books) are among the least supported.
- **The highest-evidence mechanisms are distributed across traditions:** planning (ImpInt/HAPA), monitoring (SRT/Goal-Setting/Harkin), self-efficacy (SCT/HAPA), environment/defaults (Nudge/COM-B), autonomy (MI/SDT), recovery (Relapse Prevention). No one model contains them all; several models *omit* mechanisms that 01–05 show are decisive (recovery, emotion, state).
- **Frameworks converge on a shared skeleton** — a *motivational* phase and a *volitional/enactment* phase, embedded in an environment — which is itself the argument for integration over allegiance.

**Conclusion:** the evidence points to a **synthesis organized around the mechanisms with the strongest cumulative support**, not adoption of any one named model. (This is an evidentiary conclusion, not a proposed framework or product — naming and building such a synthesis belongs to the founders.)

---

## 1 · Established Evidence

- **Implementation intentions / if-then planning** reliably improve enactment (d≈0.65). `[A/B]`
- **Self-monitoring** improves goal attainment (d+≈0.40), stronger when recorded/public. `[A/B]`
- **Self-efficacy** predicts behavior across SCT/HAPA/SDT. `[B]`
- **Defaults** are a highly reliable structural lever; broad nudges are not. `[A]`/`[C]`
- **MI** beats advice/no-treatment but not other active treatments. `[B]`
- **ACT** works vs controls, equals CBT. `[B]`
- **Lapse construal governs relapse** (AVE); relapse-prevention reduces substance use. `[B]`
- **Stage-matching (TTM) does not reliably outperform** non-staged interventions. `[C]`

## 2 · Architectural Implications *(implications only; nothing changed)*

- **Strengthened:** the existing emphasis (across `../docs/06`, `07`, `14`) on *enactment* levers (planning, monitoring, environment/friction) and *autonomy* is well-founded; recovery-centrality (Relapse Prevention) supports the existing Recovery emphasis.
- **Weakened:** any reliance on stage-models, keystone habits, identity-as-primary-cause, or broad "nudging works" assumptions.
- **May later warrant review:** `06 Decision Engine` (planning/monitoring as core; recovery as first-class); `14 Notification Engine` (prompts as Fogg-style ability+timing, not volume; monitoring framing); `07 Coaching Engine` (MI-consistent evocation; ACT-style acceptance for the emotion layer). *Review, not rewrite.*
- **Too uncertain to encode:** any single model as "the" engine of change; celebration-cementing; personalization superiority.

## 3 · Unknowns

- Which *combination* of high-evidence mechanisms is synergistic vs redundant when delivered together?
- Do implementation intentions retain d≈0.65 for emotionally charged, in-the-moment impulse decisions (most tests are mundane)?
- Does any model's maintenance phase produce durable objective change (echoing 05 §12)?
- Can the under-covered mechanisms (recovery, emotion regulation, state) be integrated without diluting the evidenced core?

## 4 · Innovation Opportunities *(research opportunities only — not features)*

- **Recovery is under-modeled** by mainstream frameworks despite being the modal course of change — a genuine gap (only Relapse Prevention centers it).
- **Emotion and physiological state are largely absent** from behavior-change models, yet 04 shows them decisive — an integration gap.
- **Component/dismantling studies** (which mechanisms carry the effect when combined) are scarce — an evidence gap the field itself has.
- **Field-wide weakness:** the most-marketed frameworks (stages, keystone habits) are among the least supported — a gap between popularity and evidence.

## 5 · First Principles *(exactly five; highest explanatory power)*

1. **The evidence lives in mechanisms, not models** — no single framework has both broad coverage and strong predictive validity.
2. **The strongest, most AI-transferable levers are volitional/structural** — implementation intentions, self-monitoring, environment/defaults — not motivation-boosting.
3. **Change has a motivational phase and a volitional phase; models earn their keep by bridging the intention–behaviour gap** (HAPA, implementation intentions).
4. **Self-efficacy and autonomy support are cross-framework multipliers** that raise the yield of the structural levers.
5. **Stage-matching and willpower-as-resource assumptions do not survive the evidence** and should not anchor design.

## 6 · Claims Impulse Could Defensibly Make *(conservative)*

- "Impulse draws on behaviour-change methods with meta-analytic support — if-then implementation intentions, progress monitoring, specific goal-setting, and relapse-prevention-style lapse reframing."
- "Monitoring progress is associated with greater goal attainment."
- "Planning *when/where/how* improves follow-through more than intention alone."
- Always hedged: *associated with, in trials of the technique, short-to-medium term.*

## 7 · Claims Impulse Must NOT Yet Make

- **That any single model is validated as producing durable objective change** — none is (05 §12).
- **That combining mechanisms yields additive/durable effects** — synergy is unproven.
- **That stage-based, keystone-habit, or identity-first mechanisms are evidence-based** — they are weak/contested.
- **That nudging reliably changes behaviour** — only defaults are robust; the app doesn't control the user's environment anyway.
- **That imitating a technique's language equals delivering its mechanism** (carried over from 05).

## 8 · Sources Requiring Verification

**Directly verified this run (reliable):** A-Tjak et al. (2015, ACT meta-analysis, g≈0.57, = CBT); Cochrane reviews on TTM stage-matching (Mastellos 2014 weight-loss; Cahill 2010 smoking — stage-matching not superior); HAPA meta-analysis (self-efficacy + planning mediation); Michie, van Stralen & West (2011, *Implementation Science* 6:42, BCW/COM-B) + BCT Taxonomy v1 (Michie et al., 2013, *Annals of Behavioral Medicine*).
**Verified in prior documents (reused):** Gollwitzer & Sheeran (2006, d≈0.65 — `02`/`03`); Rubak (2005) & Lundahl (2010) MI (`05`); Harkin et al. (2016, monitoring d+≈0.40 — `05`); Mertens (2022)/Maier (2022)/DellaVigna & Linos (2022) nudges (`02`); Irvin et al. (1999) relapse prevention (`03`); Lally (2010) habit formation (`03`); Locke & Latham (goal-setting — `01`/`02`); Stajkovic & Luthans (1998) self-efficacy (`01`).
**Cited from established knowledge (verify exact figures before external use):** West (2005, TTM critique); Schwarzer (HAPA primary; Zhang et al. 2019 HAPA meta-analysis — verify authorship/year); Carver & Scheier (control theory); Bandura (Social Cognitive Theory); Fogg (2009, FBM, *Persuasive '09*); Hayes (ACT primary); Oettingen (MCII/WOOP); Ordóñez et al. (2009, goals-gone-wild — `05`); Thaler & Sunstein (*Nudge*).

**Links (verified this run):**
1. Michie, van Stralen & West (2011), *Implementation Science*. https://implementationscience.biomedcentral.com/articles/10.1186/1748-5908-6-42
2. A-Tjak et al. (2015), ACT meta-analysis. https://www.researchgate.net/publication/266139846
3. Mastellos et al. (2014), Cochrane — TTM for weight loss. https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD008066.pub3/full
4. Cahill et al. (2010), Cochrane — stage-based smoking cessation. https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD004492.pub4/abstract
5. HAPA meta-analysis. https://www.researchgate.net/publication/332362796_A_Meta-Analysis_of_the_Health_Action_Process_Approach
6. Gollwitzer & Sheeran (2006). https://www.semanticscholar.org/paper/Implementation-intentions-and-goal-achievement:-A-Gollwitzer-Sheeran/c4deb3507fe725ce6363c1735f1ba83bab20d665
7. Harkin et al. (2016). https://www.apa.org/pubs/journals/releases/bul-bul0000025.pdf
8. Rubak et al. (2005). https://bjgp.org/content/55/513/305
