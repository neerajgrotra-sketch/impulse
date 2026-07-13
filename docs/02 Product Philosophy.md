# 02 · Product Philosophy — The Seven Principles & The Tensions We Hold

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Turn the seven principles from `00 Canon.md` §3 into design law — the WHY behind each, the concrete thing it forces us to build or refuse, the tensions we deliberately hold, and the precedence order when they collide. `01 Vision.md` says why Impulse should exist; this doc says what kind of product it is allowed to become.

This document does not redefine terms — it uses `00 Canon.md` §2 verbatim (Present Self, Future Self, the Gap, Alignment, Impulse Moment, Lapse, Recovery, Nudge). It owns the principles and tensions; everything downstream (`06 Decision Engine.md`, `07 Coaching Engine.md`, `14 Notification Engine.md`) inherits them.

A principle that changes no decision is decoration. Each subsection below therefore ends with a **Design implication** — what we are obligated to build, and what we are obligated to refuse. If a feature proposal survives all seven, it is probably ours. If it violates one, the burden is on the feature, not the principle.

The seven are not equal in a collision — §3 fixes the order. But they are equal in one respect: each has veto power. A feature can win on six principles and still be killed by the seventh, because the seventh is usually the one protecting the user from us at our most well-intentioned.

---

## 1. The Seven Principles

### 1.1 Future Self is our customer
*Present Self feels temptation; Future Self pays the cost; we protect Future Self.*

**Why.** Every consumer app on the phone already serves Present Self — the part of the user that wants relief, dopamine, and the path of least resistance right now. That market is saturated and, at its worst, predatory. The person nobody is building for is the Future Self: the one who inherits the consequences of tonight's choice and had no vote in it. Hyperbolic discounting is not a bug in the user we can patch; it is the human condition we exist to counterweight. If we optimize for the self holding the phone, we become one more thing to resist. Our entire reason to exist is that we are on the *other* side of that pull.

**Design implication.** Our north-star metric is Aligned Decision Rate, recovery-weighted (`00 Canon.md` §7), never minutes or sessions — we measure whether Future Self won, not whether Present Self stayed. This forces us to *refuse* engagement mechanics that feel good and serve nobody's tomorrow. Critically, "protect Future Self" is not license to override the user: see Tension (a) — we protect Future Self *only with Present Self's consent*, because Present Self is the one who can withdraw, and a Future Self defended by coercion is not a Future Self anyone chose.

### 1.2 Coach, never parent
*We never decide for the user; we help them think better.*

**Why.** Autonomy is not a nicety we grant; it is the mechanism by which change lasts. A decision the user reasons their way to is owned; a decision handed down is complied with until we look away. Parenting also cannot scale to an adult's whole life — the moment we position ourselves as the authority who knows best, every lapse becomes disobedience and every session becomes surveillance. That relationship breeds the exact shame we've banned (`00 Canon.md` §2). Coaching keeps the locus of control where behavior change research (Bandura) says it must live for self-efficacy to grow: with the user.

**Design implication.** The Coach's vocabulary is Coaching Moves — Reflect, Reframe, Question, Contrast, Commit, Affirm, Hold-Silence (`00 Canon.md` §2) — not directives. We build the Coach to ask more than it tells, and we *refuse* the tempting "just tell me what to do" shortcut as a default output (see Tension (b)). The banned-word list — *should have, weak, bad* — is the parent's vocabulary; a tone/lint pass on Coach output (`00 Canon.md` §8) enforces its absence in code, not in guidelines.

### 1.3 Understand before advising
*Never coach before understanding.*

**Why.** Advice without understanding is a horoscope — it may land, but only by luck, and the user knows it. Worse, premature advice teaches the user that we don't actually see them, which forfeits the one thing we're selling: "the app gets me" (`00 Canon.md` §7 guardrail). Understanding is also what separates coaching from search. Anyone can retrieve generic wisdom; the value is in wisdom fitted to *this* Identity, *this* Emotion, *this* history. You cannot fit what you haven't first modeled.

**Design implication.** This is the one principle we enforce structurally: the Coach Engine cannot emit advice-type moves until the Decision + Identity context meets a completeness threshold (`00 Canon.md` §8, §4). Onboarding (`05 Onboarding.md`) exists largely to satisfy this before the first real Impulse Moment. It forces us to build the Identity, Emotion, and Memory Engines as *prerequisites* to the Coach Engine, not accessories — and to refuse any flow where a fresh user gets prescriptive output on turn one.

### 1.4 Identity over goals
*Help users become someone, not merely accomplish something.*

**Why.** Goals are brittle: they end (you hit the number, then what?), they invite all-or-nothing framing, and a missed goal reads as failure. Identity compounds. "I am someone who trains" survives a missed workout in a way "run a marathon by June" does not — the missed day is one data point against a self-image, not a broken contract. This is Clear's identity-based-change insight and it is why our root aggregate is Identity, not Goal (`00 Canon.md` §5, §8). We are in the business of who, not what.

**Design implication.** The user model is rooted in the Identity Statement — first-person, present-tense ("I am someone who…") (`00 Canon.md` §2). Alignment is scored against that identity, not against a task list. We *refuse* to build a goal-completion tracker as the spine of the product; goals may exist as evidence in service of an identity, never as the root. The Gap we measure is the distance between behavior and *claimed identity* — a who-shaped metric, not a to-do count.

### 1.5 Progress over perfection
*Recovery matters more than streaks.*

**Why.** Perfection frameworks (streaks, "don't break the chain") manufacture a cliff: one Lapse and the entire structure reads as destroyed, which triggers the what-the-hell effect and the spiral we most need to prevent. A Lapse is expected and is not a failure (`00 Canon.md` §2) — treating it as one is both false and harmful. Dweck's work is explicit: a growth frame turns the setback into information; a fixed frame turns it into a verdict. The decision *after* the lapse — the Recovery — is where the actual learning and the actual coaching live.

**Design implication.** Recovery is weighted heaviest in our metrics — the north star counts post-lapse recoveries double (`00 Canon.md` §7). Raw streak length is an explicit anti-metric we refuse to optimize (`00 Canon.md` §7). We build the product to make the Recovery moment easy to enter and free of shame, and we refuse any UI that renders a broken streak as loss. *Streak-broken* and *failure* are banned words for this exact reason.

### 1.6 Alignment over discipline
*The goal is that today's decisions align with tomorrow's life.*

**Why.** Discipline is a finite, depleting resource, and a product that runs on the user's willpower will fail the moment their willpower does — which is precisely the low-sleep, high-stress moment they need us most. Alignment is a better target because it can be *designed for* rather than *summoned*: reframe the choice, surface the bias, contrast the horizons, and the aligned option becomes the one the user actually wants, no gritted teeth required. We'd rather make the good decision obvious than make the user heroic. This is the Stoic dichotomy of control applied inward: we don't coach users to white-knuckle what they can't sustain; we coach them to see clearly what's theirs to choose.

**Design implication.** Alignment is our core unit of value, scored 0–1 by the Decision Engine and never shown as a grade (`00 Canon.md` §2, §5). The Decision Engine's job is to make the aligned option *legible* — options, tradeoffs, bias flags, time-horizon reframe (`00 Canon.md` §4) — so choice, not stamina, does the work. We refuse to build motivational pressure (guilt, urgency, willpower challenges) as a lever.

### 1.7 Earn the right to hold this data
*Trust is the product; privacy and safety are architecture, not features.*

**Why.** We are asking the user to tell us the truth about their temptations, their lapses, and who they're afraid they are. No one does that with a party they don't trust, and trust, once broken, does not return. This is why the principle is load-bearing (`00 Canon.md` §3, and the full reasoning in `15 Constitution.md`): the quality of every other engine depends on honest input, and honest input depends on earned trust. Privacy and safety implemented as afterthought features can be toggled off, degraded, or exempted under pressure. Implemented as architecture, they cannot.

**Design implication.** Consent is a gate, not a checkbox — every proactive action checks a consent scope (`00 Canon.md` §8, `14 Notification Engine.md`). Safety pre-empts everything: the Safety Engine gates launch and can hard-stop any coaching turn (`00 Canon.md` §4, §8). Explainability is mandatory — every Insight carries evidence_refs; we never assert a pattern we can't show (`00 Canon.md` §8). We build these as structural constraints and refuse to ship the first version without them, even though a lesser product could ship sooner. The binding form of this promise is the Covenant (`15 Constitution.md`).

---

## 2. The Tensions We Deliberately Hold

Some conflicts are not bugs to resolve once and forget — they are permanent tensions that a serious product holds in balance every day. Pretending they don't exist is how products drift into harm: the tension gets resolved implicitly, in a thousand small design decisions, in whatever direction is easiest that week. For each tension below we name it and fix the resolution rule now, so the answer is a written policy and not a mood — and so a future engineer can point to this doc when the easy direction beckons.

### (a) Future Self's interests vs Present Self's consent
Principle 1.1 says we protect Future Self. But Present Self holds the phone, and Present Self can revoke everything. The danger is obvious: a Coach zealous for Future Self becomes coercive, paternalistic, and — per 1.2 — a parent.

**Resolution rule: the Coach acts only with Present Self's consent.** We advocate hard for Future Self *inside* dialogue the user chose to have, and we never act on Future Self's behalf outside the bounds Present Self set. Consent is the gate (`00 Canon.md` §8). This is the load-bearing rule of the whole product: it is what makes "protect Future Self" a form of coaching rather than control. Where the two genuinely conflict, consent wins — because a Future Self imposed on an unwilling Present Self is neither achievable nor ours to impose.

### (b) Coaching vs answering
Users will often ask us to just tell them what to do. Sometimes answering *is* the kind move — withholding a clear answer to a factual sub-question is its own form of condescension. But answer by default and we've abandoned 1.2 and stopped building self-efficacy.

**Resolution rule: coach the decision, answer the fact.** We default to Coaching Moves for the decision itself — the thing where Present and Future Self are in tension. We may answer bounded, factual, non-decisional questions directly. The line: if answering would decide *for* the user, we coach instead; if it merely removes an information gap so the user can decide, we answer. A useful test: after we respond, is the choice still visibly the user's? If yes, we answered; if the choice has quietly become ours, we should have coached. (Detailed move selection lives in `07 Coaching Engine.md`.)

### (c) Engagement vs wellbeing
Every retention lever we know how to pull — streaks, variable reward, guilt-nudges, notification pressure — works. They also corrode the user. Engagement bought with anxiety is a loss (`00 Canon.md` §7).

**Resolution rule: wellbeing wins; engagement must be a byproduct, never a target.** We encode this in the metric set: minutes, session count, and streak length are anti-metrics we refuse to optimize; trust and "the app gets me" are guardrails that must not degrade (`00 Canon.md` §7). The Notification Engine's default is silence, not reach (`14 Notification Engine.md`). We would rather be opened less and trusted more.

### (d) Personalization vs privacy
The Coach is only as good as its model of the user, and that model is built from the most sensitive data a person has. More data means better coaching *and* more to protect and more to lose.

**Resolution rule: personalize on the minimum that earns its keep, held under the Covenant.** We collect what measurably improves coaching and no more; we store it under the privacy-at-rest guarantees of `08 Database Architecture.md`; and every proactive use passes a consent scope. Personalization is never a justification that overrides 1.7 — when the two conflict, privacy wins, because the trust that makes honest input possible is worth more than any single inference. Explainability keeps us honest: if we can't show the evidence for a personalization, we don't act on it.

---

## 3. Precedence — Who Wins When Principles Collide

Principles collide in real turns. A fixed order prevents us from resolving each collision by convenience. The order:

```
Safety  >  Consent  >  Understand-before-advise  >  {Coach-never-parent,
           Identity-over-goals, Progress-over-perfection, Alignment-over-discipline}
           >  Engagement (never a tiebreaker in its own right)
```

**Justification, top to bottom.**

1. **Safety first, always.** A person in crisis is not a coaching problem. The Safety Engine sees every inbound message and can hard-stop any turn and route to human resources (`00 Canon.md` §4, §8). No principle — not consent, not autonomy — outranks not-harming a user. If we're wrong about risk, we're wrong in the direction of a human.
2. **Consent next.** Below safety, nothing we do is legitimate without Present Self's consent (Tension (a)). This is what keeps "protect Future Self" from becoming coercion. Consent outranks understanding and coaching quality because a perfectly-understood, perfectly-coached action the user didn't consent to is still a violation.
3. **Understand-before-advise next.** Once an action is safe and consented, it must still be *earned* by understanding (1.3). This sits above the coaching-quality principles because it is their precondition — you cannot coach identity, progress, or alignment well from a model you haven't built. It is enforced in code (`00 Canon.md` §8).
4. **The four coaching-quality principles are peers.** Coach-never-parent, Identity-over-goals, Progress-over-perfection, and Alignment-over-discipline shape *how* we coach once the gates above are cleared. They rarely hard-conflict; when they trade off, `07 Coaching Engine.md` governs the specific move, and none of them automatically overrides another — they are held in balance, not ranked.
5. **Engagement is never a tiebreaker.** It does not appear as a principle and cannot break a tie between principles. If the only argument for an action is that it drives engagement, that is not an argument (Tension (c)).

Principle 1.7 (*Earn the right to hold this data*) is not a single rung — it is realized *through* this whole order: Safety and Consent are its enforcement, Explainability its proof.

---

## 4. Intellectual Inspirations — Mapped, Not Copied

We stand on a body of work. But a principle is inspired by an idea, not a transcription of it — we take the mechanism and fit it to our architecture, and we drop the parts that would make us a parent, a nag, or a lab. The map:

| Thinker(s) | Idea we take | Principle it inspires | How it *inspires* (not copies) our architecture |
|---|---|---|---|
| **Kahneman / Thaler & Sunstein** | Systematic bias; the nudge | 1.1 Future Self; 1.6 Alignment | The Decision Engine surfaces bias_flags and a time-horizon reframe (`00 Canon.md` §4). We take the *nudge*, permissioned (`00 Canon.md` §2 Nudge), and refuse the dark-pattern nudge that serves the platform. |
| **BJ Fogg** | Behavior = f(motivation, ability, prompt) | 1.6 Alignment over discipline | We lower the difficulty of the aligned choice and time the prompt (Notification Engine), rather than demanding more motivation. Alignment-by-design is Fogg's *ability* and *prompt*, minus the manipulation. |
| **James Clear** | Identity-based habit change | 1.4 Identity over goals | Literally structural: Identity is the root aggregate; the Identity Statement is the model's root (`00 Canon.md` §5). We take "become someone" and refuse the habit-streak scaffolding Clear also popularized (streaks are an anti-metric). |
| **Carol Dweck** | Growth vs fixed mindset | 1.5 Progress over perfection | Recovery is weighted double; Lapse is not failure (`00 Canon.md` §2, §7). The whole banned-word list operationalizes a growth frame in the Coach's tone pass. |
| **Albert Bandura** | Self-efficacy; internal locus of control | 1.2 Coach, never parent | We help users think rather than decide for them, because efficacy grows only when the user owns the decision. Coaching Moves are built to hand agency back, not take it. |
| **Stoics — Aurelius, Epictetus** | Dichotomy of control | 1.6 Alignment; 1.1 Future Self | We coach clarity about what is the user's to choose instead of white-knuckle discipline over what isn't. The Coach separates the controllable choice from the uncontrollable outcome. |
| **Aristotle** | Virtue, *telos*, habituation toward a good life | 1.4 Identity; 1.1 Future Self | The Identity model carries values[] and virtues[] (`00 Canon.md` §5); Future Self is a *telos*, a life aimed at, not a KPI. Character formed by repeated aligned choice is Aristotelian habituation. |
| **Jobs / Rams / Krug** | Design restraint; "less, but better"; don't make me think | 1.7 Trust; all principles' *refusals* | Restraint is why our anti-metrics and banned words exist, why the Notification default is silence, and why this doc spends as much effort on what we *refuse* as what we build. Rams's "less, but better" is the house style (`00 Canon.md` §10). |

The through-line: behavioral science tells us *how* people change (Fogg, Clear, Dweck, Bandura), moral philosophy tells us *toward what* (Aristotle, the Stoics), cognitive science tells us *what's working against them* (Kahneman, Thaler), and design discipline tells us *what to leave out* (Jobs, Rams, Krug). None of them is the product. The product is the synthesis, fitted to the engines in `00 Canon.md` §4.

---

## Open questions / What we're deliberately NOT doing

**Open questions**
- **Consent granularity vs. friction.** Tension (a) and (d) both lean on consent scopes. How fine-grained can scopes get before consent becomes the checkbox we swore it wouldn't be? Resolved jointly with `14 Notification Engine.md` and `15 Constitution.md`.
- **Where exactly is the coach/answer line (b)?** "Coach the decision, answer the fact" is a rule, not an algorithm. The operational boundary is owned by `07 Coaching Engine.md`; this doc only fixes the principle.
- **Peer-principle conflicts (§3 rung 4).** We assert the four coaching-quality principles are balanced case-by-case rather than ranked. If a recurring hard conflict emerges, it may force a finer order — a signal to revisit this doc, not to improvise.
- **Measuring the Gap against a moving identity.** Identity Statements evolve. When the user's claimed identity shifts, how do we score Alignment during the transition without penalizing growth? Feeds `03 Human Model.md` and the Learning Engine.

**What we're deliberately NOT doing**
- **Not deciding for the user** — no autopilot, no "we handled it," no action taken on Future Self's behalf without Present Self's consent (1.2, Tension (a)).
- **Not optimizing engagement** — no streaks, no variable-reward loops, no guilt-nudges, no minutes/sessions as targets (1.5, Tension (c), anti-metrics in `00 Canon.md` §7).
- **Not shipping a goal-tracker** — Identity is the root; a to-do/goal list will never be the spine of the product (1.4).
- **Not running on willpower** — we design the aligned choice to be legible and low-friction; we do not sell discipline challenges (1.6).
- **Not treating a Lapse as failure** — no failure states, no broken-chain UI, none of the banned words in any surface (1.5, `00 Canon.md` §2).
- **Not personalizing beyond what earns its keep** — no data collected "because it might help later"; privacy wins ties with personalization (1.7, Tension (d)).
- **Not letting any principle outrank Safety or Consent** — the precedence order in §3 is not negotiable per-feature.
- **Not treating these inspirations as authorities** — §4 is a map of what we took and adapted, not a reading list we defer to. When a source and a user's reality disagree, the user wins.
