# 05 · Coaching Science

> **Status:** Draft v0.2 — 2026-07 (cited standard; adds AI-transfer analysis and claim-discipline sections). **Role:** Chief Research Officer / scientific reviewer — not designer. **Purpose:** determine what coaching actually *changes*, through which mechanisms, under what conditions, and whether those mechanisms could plausibly transfer from a human coach to an AI-mediated relationship. **The Impulse thesis partly depends on this document.**
>
> **Central question:** *does coaching reliably improve real-world behaviour and outcomes, and what causal mechanisms explain its effects?* We do **not** treat liking, engagement, retention, satisfaction, or anthropomorphic attachment as evidence of behavioural effectiveness. Labels: `〔MA〕`meta-analysis/review · `〔PR〕`peer-reviewed (incl. RCT) · `〔TM〕`theory · `〔PW〕`primary work · `〔PInt〕`practitioner · `〔Phil〕`philosophy · `〔M〕`mechanism-only. Tiers `[A]`–`[D]`.

## The measurement ladder (used throughout)

Effectiveness is not one thing. Evidence is strongest at the bottom of this ladder and weakest — for almost every intervention here — at the top:

`subjective satisfaction → intention → short-term behaviour → durable behaviour → objective outcomes → clinical/high-stakes outcomes`

A finding that moves *satisfaction* or *intention* is not a finding that moves *durable objective behaviour*. Most of what follows lives on the lower rungs; we flag the rung each claim reaches.

---

## 1. Does coaching work? (efficacy)

**Moderate evidence, mostly on the lower rungs.** Two meta-analyses anchor this:
- Coaching in organizational contexts produced significant positive effects across five outcome families, from g ≈ 0.43 (coping) to g ≈ 0.74 (goal-directed self-regulation) (Theeboom, Beersma & van Vianen, 2014) `〔MA〕` `[B]`.
- Workplace coaching showed an overall δ ≈ 0.36, with larger affective/results effects (Jones, Woods & Guillaume, 2016) `〔MA〕` `[B]`.

**The caveats that matter more than the effect sizes:** this literature is dominated by **self-report**, **few randomized designs**, **small samples**, short follow-ups, and probable **publication bias**; objective and *durable* outcomes are thinly evidenced. So: "coaching is associated with improvements in goal-directed self-regulation, well-being, and self-reported performance" `[B]` — **not** "coaching reliably produces durable objective behaviour change," which the current evidence does not establish.

## 2. The working alliance — the most consistent process finding

Across psychotherapy (a far larger and better-controlled literature than coaching-specific research — an inferential bridge we mark), the **alliance–outcome correlation is ~r = .28** across 295 studies and >30,000 patients, ~8% of outcome variance (Flückiger, Del Re, Wampold & Horvath, 2018) `〔MA〕` `[B]`. It is among the most robust predictors in the field, holding across orientations and including internet-based therapy.
**Two disciplined caveats:** (1) it is **correlational** — a good alliance may partly *reflect* early improvement rather than only cause it; causal direction is debated `[B/C]`. (2) It is the **psychotherapy** alliance; generalizing to *coaching* and especially to *AI* is an explicit inferential gap (see §11, §Transfer). This connects to the **common-factors / contextual model** (Wampold) and the "dodo bird" pattern that bona-fide therapies often perform comparably `〔TM〕` `[B/C]` — implying the *relationship and shared factors* carry much of the effect, not the specific technique.

## 3. Empathy, trust, psychological safety

Rogers' core conditions — accurate empathy, unconditional positive regard, congruence `〔PW〕`/`〔TM〕` — are associated with better outcomes `[B]`, though effect sizes are moderate and measurement is contested. Trust and psychological safety are plausibly preconditions for disclosure and for accepting challenge `[B/C]`. **Key distinction for later:** *expressed* empathy (the words and reflections) is observable; *felt* empathy (the client's experience of being understood by a mind that understands) is the mechanism — and the two can come apart (§Transfer, empathy row).

## 4. Autonomy support

Autonomy-supportive practitioner styles predict better motivation, adherence, and well-being — a health-context meta-analysis in the SDT tradition supports this `〔MA〕` `[B]` (Ng et al., 2012), converging with `01 Human Motivation.md §2`. Autonomy support means eliciting the person's own reasons and offering choice — the opposite of a directive "do this." This is the mechanism most aligned with the product's "coach, never parent" stance, and one of the better bets for durability.

## 5. Motivational interviewing, reflective listening, open questions, evocation

MI (Miller & Rollnick) `〔PW〕` is the most outcome-evidenced *conversational method* here — but read the numbers honestly:
- 72 RCTs; MI outperforms plain advice-giving across many behaviours (Rubak et al., 2005) `〔MA〕` `[B]`.
- Across 119 studies, MI's effect was small versus weak/no-treatment controls (g ≈ 0.28) and **not significant versus other active treatments (g ≈ 0.09)** (Lundahl et al., 2010) `〔MA〕` `[B]`.

**Interpretation:** MI reliably beats *doing nothing or lecturing*; it does **not** clearly beat other structured active methods. Its strength is elsewhere — it is autonomy-preserving and low-harm. Reflective listening and open questions are core MI ingredients whose independent causal contribution is plausible but not cleanly isolated `[B/C]`.

## 6. Advice-giving vs guided discovery

The evidence supports a **contingency**, not a winner:
- **Direct advice** helps when the barrier is a genuine **knowledge or skill deficit** and the person is receptive `[B]`.
- **Reflective/guided discovery** is superior when the barrier is **ambivalence, motivation, or autonomy** — unsolicited advice there tends to provoke reactance and is a classic MI error `[B]`.
This maps onto the product's understand-before-advise ordering, but as an *evidence-based contingency*, not a blanket rule.

## 7. Goal setting, commitment, self-monitoring, accountability, feedback

- **Goal setting:** specific + difficult goals beat "do your best" (Locke & Latham; `02 §… / 01`) `[A/B]`, with the known dark side (tunnel vision, unethical shortcuts).
- **Self-monitoring / progress monitoring:** a strong meta-analysis (138 studies, N ≈ 19,951) found monitoring goal progress **raises goal attainment (d+ ≈ 0.40)**, with **larger effects when progress is reported/made public and physically recorded** (Harkin et al., 2016) `〔MA〕` `[A/B]`. This is the firmest "accountability" evidence in the document — and notably it is a *mechanistic* effect, not obviously dependent on a human relationship.
- **Feedback:** the counterintuitive, crucial finding — feedback improves performance on average (d ≈ 0.41) **but worsened it in over a third of interventions**, especially ego-/self-focused feedback (Kluger & DeNisi, 1996) `〔MA〕` `[B]`. **How feedback is delivered is decisive; feedback is not safe by default.**
- **Commitment/accountability** beyond monitoring has thinner, more context-dependent evidence `[C]`; distinguish autonomy-supportive accountability from surveillance/pressure (which can undermine, per `01 §3`).

## 8. Self-efficacy, directiveness, challenge vs support, personalization

- **Self-efficacy** predicts persistence and is built by mastery experiences (`01 §5`) `[A/B]`.
- **Directiveness / challenge:** effective coaching appears to pair **challenge with support** (high support alone can be inert; high challenge alone can rupture) `[C]` — plausible but not cleanly quantified.
- **Personalization:** intuitively powerful and often claimed, but **evidence that personalization improves coaching outcomes is thin and mixed even for human coaches** `[C]`. This matters: personalization is frequently assumed to be AI's decisive advantage, yet its outcome benefit is under-demonstrated at baseline.

## 9. Digital coaching and conversational agents — the transfer begins

- A fully automated CBT-based conversational agent (Woebot) reduced self-reported depressive symptoms vs an information-only control in a 2-week RCT (N = 70) (Fitzpatrick, Darcy & Vierhile, 2017) `〔PR〕` `[C]`. **Caveats: tiny, 2 weeks, self-report (PHQ-9), self-selected, unblinded, industry-affiliated.** A real signal, on a low rung, for a short horizon.
- A meta-analysis of AI-based conversational agents (15 RCTs) found reductions in **depression (Hedges' g ≈ 0.64)** and **distress (g ≈ 0.70)** (2023, *npj Digital Medicine*) `〔MA〕` `[B, but short-term & symptom-self-report]`. Effects are meaningful but concentrated in short-term symptom self-report, heterogeneous, and not measures of durable behaviour change.
- Digital interventions broadly suffer **high attrition** ("law of attrition," Eysenbach, 2005) `[B]`, which biases per-protocol effect estimates upward.

## 10. Engagement vs behaviour change — the load-bearing warning

This is the trap the directive names. **Engagement, retention, satisfaction, and attachment are not behaviour change** and frequently dissociate from it. A product can be loved and used daily while changing nothing on the durable/objective rungs. Because industry-authored digital-intervention studies often report engagement and short-term self-report as if they were effectiveness, this conflation is the single most common evidential error in the space. Impulse must measure behaviour and outcomes *separately from* engagement, or it will fool itself.

## 11. Human–AI alliance, and the anthropomorphism trap

Users **can report a bond** with a conversational agent: in a large observational study (N ≈ 36,070), a CBT agent's self-reported working-alliance "bond" was **non-inferior** to bonds reported for human therapy, formed within days (Darcy et al., 2021) `〔PR〕` `[C]`. **This is important but must be read with discipline:** it is **cross-sectional/observational, self-report, and industry-authored**; it measures a *reported bond*, not *outcomes caused by that bond*. The **ELIZA effect** (Weizenbaum) `〔PW〕` — people attribute understanding to simple programs — is the standing caution: *a reported bond may reflect projection rather than a working alliance doing therapeutic work.* **We must not infer that because an AI can produce the language of empathy, it produces the psychological effects of experienced human empathy.**

## 12. Durability and maintenance

**Weak across the board.** Coaching, MI, and especially digital/AI studies are dominated by short follow-ups; durable (6–12+ month) objective outcomes are scarce, and where measured, effects commonly decay (converging with `03 Habit Formation.md §7`, Kwasnicka's maintenance≠acquisition). **There is essentially no strong evidence that any coaching modality — human or AI — produces durable objective behaviour change at long horizons.** This is the field's, and Impulse's, central empirical hole.

## 13. Failure modes and harms

- **Feedback backfire** (§7) — a third of feedback can worsen behaviour.
- **Dependency / reduced autonomy** — a coach (human or AI) that becomes the source of motivation can crowd out internalization (`01 §3`) `[C]`.
- **Overtrust / false authority** — users may over-trust a fluent agent's confidence; an LLM can be fluent and wrong, and **sycophancy** (telling users what they want to hear) is a documented tendency of current models `[C, emerging]`.
- **Shame / rupture** — mistimed challenge or ego-directed feedback can harm (`04`, `15 Constitution.md`).
- **Crisis mishandling** — non-clinical agents can miss or mishandle risk; several populations should not rely on AI coaching (§Critical Q13).
- **Manipulation** — persuasive techniques without autonomy support shade into manipulation (a Constitution red line).

---

## Can Coaching Mechanisms Transfer to AI?

For each mechanism, transfer plausibility is assessed *separately* by evidence layer. **Transfer confidence** = our judgment that the mechanism's *outcome-relevant effect* (not just its surface behaviour) survives the move to an AI agent. Language imitation is not effect.

| Mechanism | Evidence in human coaching | Evidence in digital interventions | Evidence in AI / conversational agents | Transfer confidence | Major uncertainty |
|---|---|---|---|---|---|
| **Alliance** | Strong, consistent predictor (r≈.28) `[B]` | Alliance measurable in internet therapy `[B]` | Users *report* non-inferior bond (Darcy 2021), observational `[C]` | **Low–Moderate** | Does a *reported* AI bond do therapeutic *work*, or is it projection (ELIZA)? Bond≠outcome. |
| **Empathy** | Rogers core conditions, moderate `[B]` | Text-based empathy possible `[C]` | Agents produce empathic language; user effect unproven `[C/D]` | **Low** | Whether *simulated* empathy yields the effects of *felt* empathy. |
| **Autonomy support** | Predicts adherence/well-being `[B]` | Choice-based digital designs `[C]` | Encodable in dialogue policy `[M]` | **Moderate** | Whether an agent is genuinely autonomy-supportive vs subtly controlling/persuasive. |
| **Reflective listening** | Core MI ingredient `[B/C]` | Limited `[C]` | LLMs reflect content well `[C]` | **Moderate** | Quality on emotionally complex material; sycophantic mirroring ≠ accurate reflection. |
| **Accountability / monitoring** | Monitoring raises attainment `[A/B]` | Self-monitoring apps effective `[B]` | Automatable; mechanistic, not relational `[M/C]` | **Moderate–High** | Whether accountability motivates absent a real "other"; public/recorded effects (Harkin) may need social realness. |
| **Guided discovery** | Effective for ambivalence `[B]` | Sparse `[C]` | Possible but leading/hallucination risk `[C]` | **Low–Moderate** | Can an agent Socratically guide without leading, confabulating, or collapsing into advice. |
| **Personalization** | Thin/mixed even in humans `[C]` | Tailoring shows some benefit `[C]` | AI's theoretical strength; outcome benefit unproven `[C/M]` | **Moderate (potential), Low (evidence)** | Whether personalization improves *outcomes* at all, before claiming AI does it better. |
| **Feedback** | Improves avg, backfires ~⅓ `[B]` | Digital feedback common `[C]` | Automatable, backfire risk persists `[C]` | **Moderate (risky)** | Whether AI feedback avoids the ego-threat/backfire failure mode. |
| **Trust** | Predicts disclosure/change `[B]` | Present in digital tools `[C]` | Fluency can induce over- or mis-calibrated trust `[C/D]` | **Uncertain / double-edged** | Calibrated trust in a fallible agent vs overtrust/false authority. |
| **Challenge** | Challenge+support pairing `[C]` | Rare `[D]` | Very hard; sycophancy pushes away from challenge `[D/M]` | **Low** | Whether an agent can challenge appropriately without rupture *or* sycophantic avoidance. |

**Pattern:** the mechanisms that transfer best are the **mechanistic, less relational** ones (monitoring/accountability, autonomy-support-by-design, reflection of content). The mechanisms that carry the most outcome weight in human coaching — **alliance, empathy, challenge, calibrated trust** — are exactly the ones whose transfer is **least certain**. That asymmetry is the crux of the Impulse thesis.

---

## Answering the fifteen critical questions

1. **Beyond placebo/expectancy?** Partly. Coaching/psychotherapy outcomes exceed no-treatment controls `[B]`, but blinding is near-impossible and expectancy is entangled; the honest claim is "better than nothing/advice," not "beyond all expectancy."
2. **Strongest-evidence outcomes?** Proximal, lower-rung: goal-directed self-regulation, well-being, self-reported symptoms/skills `[B]`. Weakest: durable objective behaviour.
3. **Most consistent mechanisms?** The **alliance/common factors** and **progress monitoring**; autonomy support and specific+difficult goals.
4. **Does the relationship cause outcomes or correlate?** Correlational is solid; **causal is contested** — alliance partly reflects early gains `[B/C]`.
5. **When is direct advice effective?** For genuine knowledge/skill deficits with a receptive recipient `[B]`.
6. **When are reflective questions better?** For ambivalence, motivation, autonomy — where advice provokes reactance `[B]`.
7. **Does accountability improve behaviour, and when?** Progress **monitoring** does (d+≈0.40), especially reported/recorded (Harkin) `[A/B]`; pressure-based accountability can backfire `[C]`.
8. **How important is autonomy support?** Among the better bets for *durable* motivation `[B]`; central to avoiding the coach-becomes-crutch failure.
9. **Can empathy be delivered without a human?** Its *language* can; whether its *effects* transfer is unproven `[C/D]`. Do not assume yes.
10. **Can users form a meaningful alliance with an agent?** They **report** one (Darcy 2021) `[C]`; whether it is a working alliance doing therapeutic work is unresolved.
11. **Do AI coaches change objective behaviour or mainly attitudes?** Current evidence = short-term **self-reported symptoms/attitudes** `[C/B]`; durable objective behaviour is unproven.
12. **Long-term maintenance evidence?** Essentially absent for any modality (§12).
13. **Who should NOT rely on AI coaching?** People in crisis, active suicidality/self-harm, serious mental illness, substance dependence, trauma, minors without oversight, or any high-stakes clinical situation — these need human/clinical care (`15 Constitution.md` Safety Engine).
14. **Risks?** Dependency, overtrust/false authority, sycophancy, shame from mistimed feedback, manipulation, crisis mishandling (§13).
15. **What evidence would Impulse need to claim effectiveness?** Randomized, controlled, **pre-registered** trials measuring **objective behaviour** (not engagement/self-report) at **durable horizons (≥3–6 months)**, against an **active** comparator, with attrition handled by intent-to-treat.

---

## 1 · Established Evidence

- Coaching improves self-reported/proximal outcomes (self-regulation, well-being) at small-to-moderate effect sizes (Theeboom 2014; Jones 2016). `[B]`
- The **working alliance** is a consistent (correlational) predictor of psychotherapy outcome (r≈.28; Flückiger 2018). `[B]`
- **Progress monitoring raises goal attainment** (d+≈0.40), more when reported/recorded (Harkin 2016). `[A/B]`
- **Feedback backfires ~⅓ of the time**, especially ego-directed (Kluger & DeNisi 1996). `[B]`
- **MI beats advice/no-treatment but not other active treatments** (Rubak 2005; Lundahl 2010). `[B]`
- **Autonomy support** predicts adherence/well-being (Ng 2012; SDT). `[B]`
- Automated CBT agents reduce **short-term self-reported** depression/distress (Fitzpatrick 2017; 2023 meta g≈0.64). `[C/B, short-term]`
- Users **report** a non-inferior bond with an agent (Darcy 2021), observational. `[C]`

## 2 · Architectural Implications *(implications only; no changes made)*

- **Strengthened assumptions:** alliance/autonomy-support centrality supports the existing "coach, never parent," understand-before-advise, and no-shaming commitments (`../docs/07`, `../docs/15`); progress-monitoring evidence supports treating self-monitoring as a real (non-relational) lever.
- **Weakened assumptions:** that an AI's empathic *language* or a felt *bond* is sufficient for outcomes; that engagement/retention indicates effectiveness; that personalization is a proven advantage.
- **Documents that may later require review:** `07 Coaching Engine` (move-selection contingency for advice vs reflection; feedback-delivery safeguards against the ⅓ backfire); `14 Notification Engine` (monitoring/accountability framing); `15 Constitution` (claims discipline, populations excluded from AI coaching); `09 Roadmap` (evidence gates before effectiveness claims). *Review, not rewrite.*
- **Too uncertain to encode:** durable behaviour-change efficacy; AI empathy/alliance equivalence; personalization superiority.

## 3 · Unknowns

- Does an AI-mediated alliance *cause* outcomes, or is the reported bond largely anthropomorphic projection?
- Do any coaching effects (human or AI) persist at ≥6–12 months on objective measures?
- Can simulated empathy produce empathy's psychological effects?
- Does personalization improve outcomes at all — before asking whether AI does it better?
- Can an agent challenge and give feedback without triggering backfire or sycophantic avoidance?

## 4 · Innovation Opportunities *(research opportunities only — not features)*

- **Objective, durable outcome trials of AI coaching** are largely missing; the field runs on short-term self-report — a space to generate real evidence.
- **The causal role of the AI "bond"** is unresolved and under-studied — a genuinely novel research question.
- **Feedback that doesn't backfire:** the ⅓-backfire finding is decades old and under-addressed in automated systems — an evidence gap.
- **Accountability without a human "other":** whether Harkin's public/recorded monitoring effect requires social realness is open.
- **Where incumbents are weak (evidence-backed):** many digital-coaching products report engagement/satisfaction as effectiveness (§10) — a field-wide evidential error, not a feature gap.

## 5 · First Principles *(exactly five; highest explanatory power)*

1. **The relationship (alliance/common factors) predicts outcomes more consistently than the specific technique.** `[B]`
2. **Coaching's evidence is strong for proximal/self-reported outcomes and weak for durable objective behaviour** — effectiveness is rung-specific. `[B]`
3. **Autonomy-supportive, evocative methods beat directive advice for motivation/ambivalence; advice wins only for genuine skill/knowledge deficits.** `[B]`
4. **Monitoring and feedback change behaviour — but feedback backfires about a third of the time, so delivery is decisive.** `[A/B]`
5. **Engagement, satisfaction, and a felt bond are not behaviour change and must be measured separately.** `[A/B, methodological]`

## 6 · Claims Impulse Could Defensibly Make *(conservative, evidence-grounded)*

- "Impulse uses methods with empirical support in human and, preliminarily, digital settings — reflective, autonomy-supportive dialogue (MI-consistent), specific goal-setting, progress monitoring, and if-then planning."
- "Progress monitoring is associated with greater goal attainment."
- "Automated CBT-based conversational agents have reduced *self-reported* symptoms of low mood and anxiety in short-term trials."
- "People can form a subjective sense of connection with a conversational agent."
- Always with hedges: *preliminary, short-term, self-reported, associated-with.*

## 7 · Claims Impulse Must NOT Yet Make *(unless/until its own evidence supports them)*

- **Durable behaviour change** ("Impulse changes your habits for good") — no evidence at long horizons for any modality.
- **Human-equivalent empathy** ("Impulse understands you like a person would") — unsupported; risks the ELIZA/overtrust trap.
- **Therapeutic / clinical effectiveness** ("treats," "therapy," "clinically proven") — Impulse is not a clinical treatment (`15 Constitution.md`).
- **Neurological change** ("rewires your brain") — no evidence for app-coaching (`04 §10`).
- **Personalized superiority** ("our AI coaches better *because* it's personalized") — personalization's outcome benefit is unproven even in human coaching.
- **That engagement/bond proves it works** — the core conflation to avoid.

## 8 · Sources Requiring Verification

**Directly verified this run (reliable):** Theeboom, Beersma & van Vianen (2014, *J. Positive Psychology* 9); Jones, Woods & Guillaume (2016, *JOOP* 89); Flückiger, Del Re, Wampold & Horvath (2018, *Psychotherapy* 55, 316–340, r≈.278/k=295); Rubak et al. (2005, *BJGP* 55, 305–312, 72 RCTs); Lundahl et al. (2010, *Research on Social Work Practice*, g≈0.28 weak / 0.09 active); Kluger & DeNisi (1996, *Psych Bulletin* 119, 254–284, d≈0.41, >⅓ worsened); Harkin et al. (2016, *Psych Bulletin* 142(2), 198–229, d+≈0.40); Fitzpatrick, Darcy & Vierhile (2017, *JMIR Mental Health* 4(2):e19, N=70); AI conversational-agent meta-analysis (2023, *npj Digital Medicine*, 15 RCTs, depression g≈0.64); Darcy et al. (2021, *JMIR Formative Research*, N≈36,070, WAI-SR bond).

**Cited from established knowledge (verify exact figures before external use):** Wampold (contextual model / common factors; dodo bird — Luborsky 1975; Wampold 1997/2015); Rogers (1957, core conditions); Miller & Rollnick (MI primary works); Ng et al. (2012, *Perspectives on Psych Science*, SDT health meta-analysis); Locke & Latham (goal setting — see `01`/`02`); Gollwitzer & Sheeran (2006 — see `02`); Eysenbach (2005, "law of attrition," *JMIR*); Deci, Koestner & Ryan (1999 — see `01`); Weizenbaum (1966, ELIZA); He et al. (2023, *JMIR*, conversational-agent RCT review). LLM sycophancy flagged as `[C, emerging]`.

**Links (verified this run):**
1. Theeboom et al. (2014). https://www.tandfonline.com/doi/abs/10.1080/17439760.2013.837499
2. Jones, Woods & Guillaume (2016). https://bpspsychub.onlinelibrary.wiley.com/doi/abs/10.1111/joop.12119
3. Flückiger et al. (2018). https://www.societyforpsychotherapy.org/wp-content/uploads/2018/10/Fluckiger-et-al-2018-Alliance-MA-Online.pdf
4. Rubak et al. (2005). https://bjgp.org/content/55/513/305
5. Lundahl et al. (2010). https://journals.sagepub.com/doi/10.1177/1049731509347850
6. Kluger & DeNisi (1996). https://www.researchgate.net/publication/232458848
7. Harkin et al. (2016). https://www.apa.org/pubs/journals/releases/bul-bul0000025.pdf
8. Fitzpatrick, Darcy & Vierhile (2017). https://mental.jmir.org/2017/2/e19/
9. AI conversational agents meta-analysis (2023), *npj Digital Medicine*. https://www.nature.com/articles/s41746-023-00979-5
10. Darcy et al. (2021). https://formative.jmir.org/2021/5/e27868
