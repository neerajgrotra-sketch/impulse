# 03 · Human Model — How We Computationally Represent a Person

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define the psychological core of Impulse — the three lenses (Identity, Emotion, Behavior) through which we represent a human being, why each is grounded in specific behavioral science, how the representation updates without ossifying into a stereotype, and how it composes into the context the Coach Engine consumes. If you are building the Identity Engine, the Emotion Engine, or reasoning about what "understanding the user" *means* in code, this document is your foundation.

This doc owns the **person model**. It defers to `04 AI Brain.md` for engine topology and orchestration, `06 Decision Engine.md` for how a decision is structured and scored, and `05 Onboarding.md` for how the model is first populated. It never displays anything to the user — that is `11 iOS Navigation.md`.

---

## 1. Why a model at all — and why *this* shape

Principle #3 is **understand before advising**. You cannot understand a person you have not represented. But *how* you represent them silently encodes what you believe a person *is*. A to-do app models a person as a list of tasks. A habit tracker models a person as a set of streaks. Both are honest about their shallowness.

We are building a **decision coach**, and coaching a human requires modeling three things that a task list cannot see:

1. **Who they are trying to become** — because principle #4 is *identity over goals*, and identity is the only stable reference frame for judging a decision.
2. **How they feel right now** — because emotion is the water an **Impulse Moment** swims in; the same decision at valence −0.6 is a different decision than at +0.4.
3. **How they actually decide** — because humans are not rational agents, and a coach that assumes they are will give advice that bounces off.

So the Human Model is a triple: **Identity ⊕ Emotion ⊕ Behavior**. Identity is *who*, and it is slow-changing and durable. Emotion is *state*, and it is fast and momentary. Behavior is the *mechanics* of how who-you-are and how-you-feel collide into a choice. Each lens is grounded below in named science, because a model built on folk psychology is a model that will confidently mislead.

---

## 2. The Identity model — the root, not the goal

Per canon §5, **Identity is the root aggregate**, and per principle #4, this is deliberate and structural. Everything else — a **Decision**, an **Outcome**, a **Reflection** — hangs off identity, not off a goal object. There is no `Goal` aggregate in our data model. This section explains why that is a considered bet, not an oversight.

### 2.1 What Identity holds

```
Identity (root aggregate)
  ├─ values[]                 — what the user holds dear ("honesty", "presence with my kids")
  ├─ identity_statements[]     — first-person, present-tense claims ("I am someone who…")
  ├─ future_self_narrative     — a prose description of the person they are becoming
  ├─ virtues[]                 — character dispositions the user is cultivating (courage, patience)
  └─ updated_at
```

These are the canon fields (§5) — nothing invented here. Note what is *absent*: no personality-test score, no fixed "type," no diagnosis. Identity is a set of **claims and aspirations**, not a set of measured traits. That distinction is the whole ethical spine of this document (§6).

### 2.2 Why identity is the root — the four thinkers

- **James Clear (identity-based habit change).** Clear's core claim: durable behavior change flows *from* identity, not toward it. You don't "try to run"; you "become a runner," and the runs follow. Goals are outcomes; identity is the system that produces outcomes. If we rooted the model in goals, we would be optimizing the thing Clear says is downstream. An **Identity Statement** ("I am someone who moves my body daily") is causally upstream of a thousand future decisions in a way "run 3x/week" never is. This is why the atomic user commitment is a statement about *being*, not a target about *doing*.

- **Albert Bandura (self-efficacy).** A person acts on the belief that they *can* act. Self-efficacy — the belief in one's capacity to execute — predicts whether an identity statement translates into a decision. We model this implicitly: **Recovery** (canon §2) is weighted heaviest in our metrics precisely because recovering after a **Lapse** is the single strongest builder of self-efficacy ("I am someone who gets back up"). The Learning Engine watches recoveries as evidence that efficacy is rising or falling.

- **Carol Dweck (growth mindset).** Identity as we model it is **fluid, not fixed**. A fixed-mindset representation ("you are a procrastinator") is both scientifically wrong and coaching-poison. Every field in Identity is revisable, and the *language* we attach to it is process-oriented ("becoming," "practicing") never trait-fixed ("is lazy"). The banned-word list in canon §2 (*fail, weak, bad…*) is the surface enforcement of a growth-mindset model underneath.

- **Aristotle (telos and virtue).** `future_self_narrative` is the user's **telos** — the end they are oriented toward — and `virtues[]` are the Aristotelian character dispositions cultivated through repeated action (we become just by doing just acts). This is why virtues are first-class: a virtue is not a goal you complete but a disposition you build one **Impulse Moment** at a time. Aristotle also gives us *phronesis* (practical wisdom) as the coaching ideal — the Coach helps the user exercise judgment, it does not supply the answer (principle #2, *coach never parent*).

### 2.3 Why not goals

A goal-rooted model fails in three concrete ways: (1) goals complete or expire, leaving the model empty between them; (2) goal failure is a natural shaming vector, which violates canon §8 *no shaming ever*; (3) goals fragment the person into unrelated targets, so the model can never reason across a life. Identity is continuous, non-completable, and unifying. **The Gap** (canon §2) is defined *against* identity — the distance between behavior and the claimed self — and that definition is only coherent because identity is the root.

---

## 3. The Emotion model — dimensional first, categorical second

The **Emotion Engine** (canon §4) infers state and emits an **EmotionSignal**. The representation is deliberately **dimensional with categorical labels layered on top**, not the reverse.

### 3.1 The representation

```
EmotionSignal (canon §5)
  ├─ valence   (-1 .. 1)   — unpleasant ←→ pleasant
  ├─ arousal   (0 .. 1)    — calm ←→ activated
  ├─ labels[]              — optional categorical tags ("anxious", "restless")
  ├─ confidence            — how much we trust this inference (0 .. 1)
  └─ source                — text | time | context | composite
```

### 3.2 Why dimensional beats pure categories

- **Russell's circumplex model.** Russell showed affect is well-described by two continuous, orthogonal dimensions — valence and arousal — with named emotions sitting as *regions* on that plane, not as discrete atoms. "Anxious" is high-arousal/negative; "content" is low-arousal/positive; "bored" and "serene" both sit low-arousal but differ in valence. A coach needs the *gradient*: the difference between arousal 0.4 and 0.8 at the same negative valence is the difference between a Reflect move and a Hold-Silence move. Pure category labels ("angry"/"sad"/"happy") throw that gradient away.

- **Lisa Feldman Barrett (theory of constructed emotion).** Barrett's evidence is that discrete emotion categories are not universal biological types with fixed fingerprints; they are *constructed* by the brain from core affect (valence + arousal) plus context and learned concepts. This has a hard engineering consequence: **we cannot reliably classify a discrete emotion from a text snippet, and we should not pretend to.** What we *can* estimate more robustly is core affect — the dimensional substrate. So dimensions are our ground truth; labels are convenience tags with lower confidence, always derived, never authoritative.

- **Practical payoff.** Dimensions are continuous (good for reasoning over trends and for the Learning Engine), model-agnostic (a small classifier can regress valence/arousal), and degrade gracefully — an uncertain signal is still a usable point on the plane, whereas an uncertain category is just noise.

### 3.3 How the signal is produced, and how uncertainty is handled

The Emotion Engine is an **alive classifier** (canon §4), tiered to run on Haiku 4.5 for cost (canon §6). It ingests message text, time-of-day, and context signals, and regresses valence/arousal, attaching optional labels and a **confidence** score. Uncertainty is not swept under the rug — it is a first-class field with three rules:

1. **Low confidence widens the Coach's stance.** Below a threshold, the Coach Engine does not act on the inferred emotion; it *asks* ("How are you sitting with this right now?"). Guessing an emotion wrong is a direct hit to the guardrail metric *"the app gets me"* (canon §7), so we treat false confidence as more expensive than admitted ignorance.
2. **We never display an inferred emotion as fact.** Explainability (canon §8) means an emotion is offered tentatively and is user-correctable (§6).
3. **Safety pre-empts.** Certain signals (extreme negative valence + specific content) route to the **Safety Engine** (canon §4, §8) regardless of confidence — safety errs toward the human, never toward the model's composure.

---

## 4. The Behavioral model — how a choice actually happens

Identity says *who*; Emotion says *how it feels*; the Behavioral model explains the *mechanics* of the **Impulse Moment** — why Present Self and Future Self (canon §2) end up in tension at all. This is not stored as an aggregate; it is the **explanatory theory** the Decision Engine and Coach Engine reason *with*. Four frameworks, each earning its place.

- **Kahneman — dual-system (System 1 / System 2).** System 1 is fast, automatic, emotional; System 2 is slow, effortful, deliberate. An **Impulse Moment** is very nearly the *definition* of a System-1 impulse pulling against a System-2 commitment. The entire coaching act is, mechanically, an intervention that recruits System 2 into a moment System 1 would otherwise own — not by lecturing, but by inserting a beat of reflection. This is why the product is a *coach in the moment*, not a planner after the fact.

- **Hyperbolic discounting / present bias.** Humans discount the future steeply and non-exponentially: a reward now vastly outweighs a larger reward later, and the discount curve is bowed so we reverse our own preferences as temptation nears. This is the mathematical heart of the Present/Future Self split. The Decision Engine's **time-horizon reframe** (canon §4) exists precisely to counter this — it makes the future consequence *vivid and present* so the discounting is partly undone. Present bias is *the* bias we most systematically flag in `bias_flags[]`.

- **Fogg Behavior Model (B = MAP).** Behavior happens when **M**otivation, **A**bility, and a **P**rompt converge at the same moment. This gives us a diagnostic vocabulary for a lapse: was motivation low, was the aligned action too hard (low ability), or was there no prompt? It also constrains our own **Nudge** design (canon §2, `14 Notification Engine.md`): a nudge is a *prompt*, and firing a prompt when ability is absent just manufactures the failure we refuse to name. B=MAP tells us when *not* to nudge.

- **Duhigg — cue → routine → reward.** Habits are loops: a **cue** triggers a **routine** that delivers a **reward**. This maps directly onto our data model: the Decision's `trigger` and `context` are the *cue*, the `chosen_option` is the *routine*, and the **Outcome**'s `felt_after` captures the *reward* (real or anticipated). Modeling the loop lets the Learning Engine surface an **Insight** like *"you lapse most on low-sleep evenings"* (canon §2) — that is a detected cue, and naming the cue is the first lever of change.

### 4.1 How these compose to explain one Impulse Moment

> It is 10 pm. The user's **Identity Statement** is *"I am someone who protects my mornings."* A notification (Duhigg **cue**) triggers the urge to start a series (System-1 **routine**). Emotion Engine reads valence −0.3, arousal 0.6 (restless) at moderate confidence. **Present bias** makes "one episode now" feel larger than "a clear head tomorrow." Fogg says motivation-to-rest is real but ability-to-stop-once-started is low. The Decision Engine frames the tradeoff and applies a **time-horizon reframe**; the Coach picks a **Coaching Move** — here, Contrast — surfacing the gap between the routine and the claimed identity, *without* deciding for the user.

Every framework above is load-bearing in that single paragraph. That is why they are in the model and not in a footnote.

---

## 5. How the model updates — learning without overfitting

A static model of a person is a stereotype with a timestamp. The model must move, but movement must be *earned by evidence and resistant to overreach*.

### 5.1 The update loop

```
 Decisions ──┐
 Reflections ─┼──▶  Learning Engine  ──▶  Insights (evidence-backed)
 Outcomes ───┘            │                └─▶ updated user priors
                          ▼
             Identity / Emotion priors revised
             (values, statement salience, affect baselines)
```

The **Learning Engine** (canon §4, *stub → v1.1*) consumes **Outcomes** (aligned / lapse / recovery), **Reflections**, and decision history. It does two things: emits **Insights** (each carrying `evidence_refs[]`, canon §5, §8) and nudges the priors — which **values** are active, which **Identity Statements** the user is actually living, what an individual's affect baseline looks like (Barrett: affect is person-relative, so a personalized valence baseline beats a population one).

### 5.2 Guarding against overfitting and stereotyping

This is where most person-modeling goes ethically and statistically wrong. Our defenses:

- **Evidence thresholds, not vibes.** We assert no pattern we cannot show (canon §8). An **Insight** needs sufficient corroborating events before it surfaces; n=1 is a data point, not a trait.
- **Decay and recency.** Priors decay. A pattern from six months ago that has not recurred loses weight. People change (Dweck); a model that never forgets becomes a cage.
- **Confidence travels with everything.** EmotionSignal, Insight, and prior all carry confidence. Downstream engines are required to *widen their behavior* under low confidence rather than commit.
- **Regularize toward the population, correct toward the person.** We start from sensible priors and move toward the individual only as evidence accumulates — the classic bias/variance guard against overfitting a person from a handful of noisy observations.
- **Identity claims outrank inferred behavior.** If the model infers a pattern that contradicts who the user *says* they are becoming, the claim wins as the coaching reference frame. We coach toward the aspiration, never anchor them to the inferred rut. (This is also the anti-stereotype rule: behavior informs, identity governs.)
- **No protected-attribute modeling.** We do not infer or store demographic categories to predict behavior. Ever.

---

## 6. Ethical guardrails on modeling a human

Modeling a person is an act of power. Principle #7 — *earn the right to hold this data* — and **The Covenant** (canon §2, `15 Constitution.md`) bind this section. These are not aspirations; they are constraints on the schema and the code.

- **No fixed labels.** The model contains claims and revisable estimates, never verdicts. There is no field that says what a person *is* — only what they are *becoming* (identity) and how they *seem to feel right now* (emotion, with confidence). No diagnoses, no personality types, no trait scores.
- **Every part is revisable — by us and by them.** Priors decay; Insights can be dismissed (`dismissed?`, canon §5); Identity is edited by the user at will.
- **The user can see and correct their model.** This is explainability (canon §8) made personal. A user can view their **values**, **Identity Statements**, `future_self_narrative`, and the **Insights** we hold — each with its evidence — and correct or delete them. A model the subject cannot inspect is surveillance, not coaching. Correction is not a settings-page afterthought; it is a coaching moment (the user teaching the coach who they are).
- **Emotion is offered, never asserted.** See §3.3. We never tell a user how they feel.
- **Consent gates modeling depth.** Consent is a gate, not a checkbox (canon §8). Inferring patterns and acting on them proactively (Nudges) checks a consent scope.
- **Safety overrides the model.** The **Safety Engine** can hard-stop any coaching turn (canon §8) irrespective of what the Human Model believes about the user's state.

The test we hold ourselves to: *would the user, seeing their full model, feel understood — or surveilled?* If surveilled, the model is wrong regardless of its accuracy.

---

## 7. How the three lenses compose into Coach context

The Coach Engine is the only orchestrator (canon §4). Per turn, it composes the three lenses of the Human Model with the Decision frame and retrieved Memory into the context the Prompt Builder assembles. The Human Model owns the left column below; the rest is shown for wiring only.

```
                         THE HUMAN MODEL
        ┌───────────────────────────────────────────────┐
        │  IDENTITY (root, slow)                         │
        │    values · identity_statements ·              │
        │    future_self_narrative · virtues             │  ← who they're becoming
        │                                                │
        │  EMOTION (state, fast)                         │
        │    valence · arousal · labels · confidence     │  ← how they feel now
        │                                                │
        │  BEHAVIOR (mechanics, explanatory)             │
        │    dual-system · present-bias ·                │
        │    B=MAP · cue→routine→reward                  │  ← how they decide
        └───────────────────┬───────────────────────────┘
                            │  composed per turn
                            ▼
        ┌───────────────────────────────────────────────┐
        │  COACH CONTEXT  (assembled by Prompt Builder)  │
        │    Human Model  +  Decision frame  +  Memory   │
        └───────────────────┬───────────────────────────┘
                            ▼
                Coach Engine → chosen Coaching Move → LLM turn
                            │
                            ▼
                Outcome / Reflection  ──▶  Learning Engine
                            │
                            └───▶ updates the Human Model (§5)
```

The loop closes: the model shapes the coaching, the coaching produces outcomes, the outcomes revise the model. That circularity — done with evidence thresholds and decay (§5) — is what lets Impulse *understand you better over time* rather than fossilize a first impression.

---

## Open questions / What we're deliberately NOT doing

**Open questions:**
- **Emotion ground truth.** Dimensional inference from text is noisy. Do we ever ask the user to calibrate their own valence/arousal baseline, and does that risk making the app feel clinical? (Feeds `05 Onboarding.md`.)
- **Virtue representation.** `virtues[]` is currently a flat list. Do we need to model a virtue's *maturity* (Aristotle's habituation is graded), and if so, how without it becoming a score to game?
- **Prior decay rate.** How fast should a stale pattern lose weight? Too fast and we forget real traits; too slow and we cage the user. This needs empirical tuning once the Learning Engine is past stub.
- **Multiple identity statements in tension.** When two Identity Statements conflict in one decision, whose frame governs? Currently unresolved; likely a Coach-surfaced tension rather than a model resolution.
- **Cross-person priors without stereotyping.** How much population prior is too much? (§5.2 states the principle; the line is not yet drawn.)

**What we are deliberately NOT doing:**
- **No personality typing** — no Big Five scores, no MBTI, no fixed types. Barrett and Dweck both forbid it, and it invites shaming.
- **No clinical diagnosis** — we are a coach, not a clinician. Clinical risk routes to the Safety Engine and human resources, never to a label in our model.
- **No demographic behavior modeling** — we do not predict behavior from protected attributes.
- **No hidden model** — nothing about a user exists that the user cannot see and correct (§6).
- **No Goal aggregate** — behavior and outcomes attach to Identity, per principle #4 and canon §5. Goals may appear as UI affordances but never as the root of the person model.
- **We do not decide the emotion for the user, nor the decision** — principle #2, *coach never parent*, is enforced upstream of this model and honored within it.

*Cross-links: canon `00 Canon.md` (§2 vocabulary, §4 engines, §5 data model, §7 metrics, §8 constraints); `02 Product Philosophy.md` (the seven principles); `04 AI Brain.md` (engine orchestration); `05 Onboarding.md` (identity capture); `06 Decision Engine.md` (bias exposure, alignment scoring); `07 Coaching Engine.md` (Coaching Moves); `15 Constitution.md` (the Covenant, safety).*
