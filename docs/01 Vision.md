# 01 · Vision — Why Impulse Exists, the Wedge, the 10-Year Bet

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Establish why Impulse must exist now, the one narrow decision it wins first, and the durable relationship it is building toward — so every later document can assume the *why* is settled and argue only the *how*.

This document owns the reason for the company. It defers all mechanics to their owners: the principles to `02 Product Philosophy.md`, the human model to `03 Human Model.md`, the engines to `04 AI Brain.md`, the promise to `15 Constitution.md`.

---

## 1. The problem: the gap is not a knowledge problem

Almost nobody who eats the late-night pint of ice cream, sends the angry text, or opens the trading app at 1 a.m. is *confused about what's good for them*. They know. They knew this morning. They'll know again tomorrow. The gap between intention and action is not an information deficit, and this single fact invalidates most of the products aimed at it.

What actually happens is a predictable failure of how humans value time. Present Self and Future Self are, functionally, different people with different interests — and Present Self is holding the phone. This is **hyperbolic discounting** (present bias): the future is discounted so steeply that a small reward *now* outranks a large reward *later*, and the discount curve is not exponential but sharply front-loaded, so preferences reverse the instant temptation is proximate. Kahneman's fast **System 1** — emotional, associative, immediate — captures the decision before the slow, deliberate **System 2** is even consulted. Thaler's work on limited self-control and the planner–doer conflict describes the same split from the economic side: the planner sets the alarm across the room; the doer hits snooze anyway.

So the design failure of the incumbent category is precise. **Willpower-and-tracking apps fight the wrong war.**

- **Trackers** assume the problem is *measurement*. They give System 2 a dashboard. But at the Impulse Moment System 2 is offline; a beautiful chart of your intentions is exactly the thing present bias ignores.
- **Willpower apps** assume the problem is *insufficient resolve* and prescribe more of it. Resolve is a depletable resource under load, and prescribing more of a thing the user is already out of is not a strategy — it's a guilt engine.
- **Streak mechanics** convert a lapse — a normal, expected event — into a **fail** state. The user who breaks a 40-day streak doesn't recommit; they disengage, because the product has told them the run is ruined. This is the opposite of what the science says helps.

The Gap is not closed by knowing more or trying harder. It is closed by having *better thinking available in the exact moment System 1 is in control* — thinking that Present Self would endorse if they weren't, right now, present-biased. That is a coaching problem, and until very recently it was not a tractable software problem.

---

## 2. Jobs-to-be-Done: what a person hires Impulse to do

Christensen's discipline: people don't buy products, they **hire** them to make progress in a specific circumstance. The circumstance is not "I want to be healthier." It's a moment. So look at the moment.

**The scene.** It's 11:04 p.m. The user is on the couch, phone in hand, three days into telling themselves they're "someone who sleeps well and doesn't drink on weeknights." The wine is in the kitchen. The pour is fifteen seconds away and it would feel good. They are not deliberating; they are already half-standing. This is an **Impulse Moment**: Present Self and Future Self in open tension, and Present Self winning by default.

What gets hired here has three layers:

- **The functional job:** *Help me make a decision I won't regret in the morning — without deciding for me.* Not "stop me." Not "tell me the answer." Help me actually see the choice — the real tradeoff, the bias I'm under, the time-horizon I've collapsed — fast enough that it lands before I've already poured. (This is the **Decision Engine**'s reason to exist; see `06 Decision Engine.md`.)
- **The emotional job:** *Meet me without judging me, so I can be honest.* The user will only surface the real trigger — the stressful day, the argument, the loneliness — to something that has demonstrably never shamed them. Shame makes people hide the data the coach needs. Safety of feeling *is* a functional requirement, not a nicety.
- **The social job:** *Let me become the person I told myself I am — and, quietly, the person I'd want others to see.* The user is protecting an identity, not hitting a number. The pull is toward being *someone who*, not toward a metric.

Back to the couch. What the user actually hires, if we've built it right, is thirty seconds that change the frame: not "don't," but "what's this really about tonight?" — a question that surfaces the argument they had at dinner, names the present bias out loud without accusation, and re-attaches the choice to the identity they claimed three days ago. Sometimes they pour anyway. That's a **Lapse**, and it's fine — the job we're *most* hired for is the next night, the **Recovery**, when the same coach greets them without a trace of "you failed" and asks what they learned. A product that treats the second night as a fresh start rather than a ruined streak is doing the actual work.

The competing products for this job are not other apps. They are: pouring the glass (does the emotional job instantly, betrays the functional one), texting a friend (great, but not available at 11 p.m. for the 200th time), and doing nothing. Impulse wins the moment only if it is faster and less costly than the pour and less depleting than solo willpower. If we are slow, preachy, or absent when the phone is in hand, we lose to ice cream. That constraint drives the entire architecture — the offline-first client in `11 iOS Navigation.md` exists because *the moment of temptation often has no signal*, and a coach that isn't there when System 1 takes over is not a coach.

---

## 3. The wedge: one high-emotion decision, won completely

We start absurdly narrow: **one high-emotion, high-frequency decision domain** — the recurring evening self-regulation moment (the weeknight drink / the doomscroll / the impulse spend, pick the single sharpest one for the beachhead in `09 Roadmap.md`). Not "life coaching." Not "wellness." One decision, one moment, coached better than anything else on earth.

Narrow beats broad here for reasons that are structural, not tactical:

1. **Understanding compounds within a domain.** Our first principle of *understand before advising* means the **Identity Engine** and **Memory Engine** must learn a specific person deeply. Depth in one domain — the triggers, the times, the recovery patterns — produces coaching that visibly *gets you* far sooner than shallow breadth ever could. A coach who knows one thing about you cold beats a coach who knows nothing about everything.
2. **High emotion is where the Gap is widest and the value is most legible.** In low-stakes decisions the intention–action gap is small and nobody notices we helped. In the 11 p.m. moment the gap is a canyon; closing it once is unforgettable. We want the domain where a single win earns trust.
3. **The North Star is measurable in a narrow domain.** Recovery-weighted **Aligned Decision Rate** (canon §7) only means something when the Impulse Moments are comparable. One domain gives us a clean signal to learn from and honest evals to build against.
4. **A narrow product can be opinionated.** Breadth forces blandness. One domain lets us hold a real point of view about what good looks like.

The bet is that mastery of one decision *transfers*: the person who learns, with us, to see and recover from the weeknight lapse has learned a portable skill and, more importantly, a durable relationship with a coach they trust — which is what we expand along, not feature-by-feature.

---

## 4. Positioning: Apple Health meets Calm meets an executive coach

Three parents. We take one thing from each and explicitly refuse another.

| Parent | What we take | What we reject |
|---|---|---|
| **Apple Health** | A trustworthy, private, longitudinal *system of record* for the self — data you own, that persists, that earns its place. | Passive dashboards. Health shows you numbers and stops; it never helps you *decide*. Data with no coach is a mirror, not a friend. |
| **Calm** | Emotional attunement, calm tone, respect for the user's nervous system; the sense of a space that lowers arousal rather than raising it. | Content-as-treadmill and the ambient pressure to *engage*. Calm's job ends at soothing; ours begins there. Feeling better is not the same as choosing better. |
| **Executive coach** | The core mechanic: a coach *understands you, then helps you think* — asks the question, holds the mirror, never hands you the answer. Identity-level, not task-level. | The $500/hour, once-a-week, business-hours access model. The moment that matters is 11 p.m., not Tuesday's 3 p.m. slot. |

The one-line synthesis: **the private longitudinal understanding of Apple Health, the emotional register of Calm, and the mechanic of an executive coach — available in the moment, at software scale.** None of the three exists in the moment of temptation. That empty quadrant is the position.

We are explicitly **not** a chatbot (a chatbot answers; a coach understands first — canon §1) and **not** a habit tracker (a tracker counts; a coach helps you choose).

---

## 5. Why now: understanding got cheap

Coaching has always been possible; it was never *scalable*, because it requires understanding, and understanding — inferring what a person means, feels, and is avoiding from a few messy sentences at 11 p.m. — was until recently something only humans could do.

The unlock is not that LLMs can *answer*. Answers were never the bottleneck; the user already knows the answer. The unlock is that LLMs make real-time **understanding** cheap for the first time: reading the emotional subtext of a message, structuring an unstructured decision, spotting the bias the user is under, holding the thread of who this person is becoming across months. That is what the **Emotion Engine**, **Decision Engine**, and **Coach Engine** turn into product (see `04 AI Brain.md`).

Three enabling shifts converge in 2026, and all three are load-bearing:

- **Capability:** models can infer state and reason about a decision at a quality that clears the bar for coaching, not just chat.
- **Cost/latency tiering:** cheap fast models (Haiku-class) can run understanding — emotion, bias, safety triage — on *every* inbound message, so understanding is ambient, not rationed; mid-tier models (Sonnet-class) carry real-time dialogue; heavy models (Opus-class) do latency-tolerant weekly synthesis. The economics in canon §6 are why "understand before advise" is affordable rather than aspirational.
- **On-device + private inference maturing:** the intimate data a real coach needs can increasingly be handled without surrendering the user's dignity — which is the precondition for earning the right to hold it (principle 7; `15 Constitution.md`).

The shift, compressed:

| | Before | Now |
|---|---|---|
| **Understanding** | scarce, human-only, hourly | ambient, machine-assisted, per-message |
| **Coaching access** | Tuesday 3 p.m., $500/hr | 11 p.m., at software cost |
| **The bottleneck** | inferring what a person means | earning the right to know it |

The bottleneck moved from *capability* to *trust* — which is exactly why the Covenant, not the model, is the hard part.

Crucially, cheap understanding is *dangerous* in the wrong hands — the same capability powers the engagement casinos we refuse to build (§7). "Why now" is therefore also "why us, with a Covenant." The technology arrived; the discipline is the moat.

---

## 6. The 10-year bet

The wedge is one decision. The bet is a relationship.

**In ten years, Impulse is a person's durable relationship with their Future Self — a personal alignment layer that sits under the decisions of their life.** The domain we won first is just the doorway. What accrues is *understanding*: an Identity model, a Memory of every Impulse Moment and Recovery, a learned map of a specific human's Gap. That asset is not transferable to a competitor and gets more valuable every day it's used — the coach that has been with you for six years is not replaceable by a better prompt.

Three claims sit underneath the bet:

1. **Understanding is the moat, not the model.** Models commoditize; the longitudinal, consented understanding of *one specific person* does not. Whoever holds that relationship holds the position.
2. **Alignment generalizes.** Once a person trusts us with the weeknight decision, the same mechanic — understand, expose the tradeoff, protect Future Self *with consent* — serves the career decision, the money decision, the relationship decision. We expand along trust, not along features.
3. **The relationship is the product.** Not the app, not the streak, not the content. The thing worth ten years is that a person, at a hard moment, reaches for us the way they'd reach for the wisest, calmest, least judgmental person they know — one who happens to remember everything and is always awake.

If we succeed, "check with my coach" becomes as ordinary as "check my calendar," and it means *reconcile this impulse with the life I'm trying to build.*

---

## 7. Anti-vision: what we refuse to become

A vision without a stated anti-vision drifts, because the anti-vision is where the money is easiest. We name it so we can refuse it on purpose. This section is the product-strategy face of the anti-metrics in canon §7 and the non-negotiables in `15 Constitution.md`.

- **We refuse to be an engagement casino.** We will not optimize daily active minutes, session count, or time-in-app. Attention is the user's, not ours to farm. A user who needs us *less* over time because they've grown is a **win**, not churn — and our metrics must be able to say so.
- **We refuse to be a notification casino.** The **Notification Engine** (`14 Notification Engine.md`) defaults to *silence* and treats every **Nudge** as spending trust. Consent is a gate, not a checkbox (canon §8). A push notification sent to goose a metric is a Covenant violation, not a growth tactic.
- **We refuse to be judgmental.** The banned-word list (canon §2) — *fail, cheat, streak-broken, weak, guilt* — is enforced in code by a tone pass on Coach output. A **Lapse** is expected; **Recovery** is what we coach and weight heaviest. We are *coach, never parent* — we never decide for the user and never scold them.
- **We refuse to be a streak machine.** Streaks convert the normal into catastrophe and trade long-term identity change for short-term anxiety. Engagement bought with anxiety is a loss on our books, stated as such.
- **We refuse to monetize the data or the dependency.** Trust is the product; the moment we sell attention or vulnerability, we've become the thing we exist to protect people from.

The unifying rule: **if a growth tactic works by exploiting Present Self against Future Self, it is off the table** — because it is precisely the mechanism we exist to counter, and turning it on ourselves would be the deepest betrayal available to us.

---

## 8. What success looks like

Success is not downloads or minutes. Tied to the North Star in canon §7:

- **Primary:** the recovery-weighted **Aligned Decision Rate** rises for a cohort over time — more Impulse Moments end aligned with the user's stated identity, and post-**Lapse** **Recoveries** (counted double) climb. The Gap measurably narrows.
- **The trust guardrails hold:** self-reported *trust* and *"the app gets me"* stay high; crisis handoff is correct every time (the **Safety Engine** gates launch, canon §4); notification opt-out stays low because we earned the sends; **zero shaming-language incidents**.
- **The human signal:** users describe us not as an app they use but as *a coach who understands them* — and the person they reach for at 11 p.m.
- **The paradox we accept:** the healthiest outcome may be a user who needs us less often but trusts us more deeply. A vision that can't call that success is measuring the wrong thing.

---

## Open questions / What we're deliberately NOT doing

**Open questions**
- **Which single domain is the beachhead?** This document commits to *narrow*; the specific first decision is owned by `09 Roadmap.md`. The wrong pick delays the first unforgettable win.
- **How far does alignment transfer, and how fast?** The 10-year bet assumes mastery of one decision transfers to others. We should instrument transfer explicitly rather than assume it.
- **What is the honest metric for "needed us less because they grew"** vs. churn from failure? Until we can distinguish these, our North Star is incomplete.
- **Where is the line between coaching and clinical care?** The Safety Engine draws the hard stop (`15 Constitution.md`); the softer boundary — how much emotional weight a non-clinical coach should carry — is unresolved.

**What we are deliberately NOT doing**
- **Not going broad first.** No "life OS," no multi-domain launch. One decision, won completely.
- **Not building a chatbot or a tracker.** Both are explicitly rejected positions (§4), not adjacent products we might add.
- **Not deciding for the user, ever.** *Coach, never parent* (canon §3). We are not a blocker, a lock, or an accountability enforcer.
- **Not optimizing engagement, streaks, or attention.** The anti-metrics (canon §7) are refusals, not KPIs we've deprioritized.
- **Not shipping any feature whose growth depends on Present Self beating Future Self.**
