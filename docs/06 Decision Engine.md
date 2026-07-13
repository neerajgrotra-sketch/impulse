# 06 · Decision Engine — Structuring the Impulse Moment

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define how we turn a raw **Impulse Moment** into a structured **Decision** — options, tradeoffs, a time-horizon reframe, and honest **bias_flags** — that the Coach Engine (`07 Coaching Engine.md`) can coach against. This document owns the decision-coaching flow and bias exposure. It does *not* own dialogue, tone, or move selection (that is `07`), nor the identity model it reads from (`03 Human Model.md`).

The Decision Engine is the part of the brain that thinks *structurally* so the Coach can speak *humanly*. It produces a frame; it never talks to the user. Keeping these separate is deliberate: structure benefits from being deterministic, inspectable, and testable, while dialogue benefits from warmth and judgment. Blur them and you get a coach that lectures — the exact behavior canon forbids.

---

## 1. What this engine produces (the Decision frame)

Per `00 Canon.md` §5, a **Decision** is the stored aggregate for one Impulse Moment. This engine is responsible for populating and evolving it:

```
Decision {
  trigger            # the raw thing that happened ("almost bought the flight")
  context            # time, place, emotional signal, recent history
  options[]          # the live choices, including the null/wait option
  tradeoffs          # per option: what Present Self gains, what Future Self pays
  time_horizon_view  # the 10-10-10 and Future-Self contrast reframe
  bias_flags[]       # named cognitive biases likely in play (NOT verdicts)
  alignment_score    # 0–1, per candidate option; never surfaced as a number
  status             # open | resolved
}
```

The "frame" is everything except the final choice. The Coach consumes the frame; the user makes the choice; the **Outcome** records what happened. We build the frame *fast and quietly* and let the Coach reveal only the parts that help.

**WHY a frame and not an answer:** principle #2, *Coach, never parent* — we never decide for the user. The engine's job is to make the decision *legible*, not to resolve it. A resolved-for-you decision teaches nothing and violates the covenant of agency.

---

## 2. Capture: the 11pm-phone-in-hand case

The design constraint that dominates everything else: **the moment is hostile to friction.** It is 11pm, the user is tired, emotionally activated, and one tap from the choice they'll regret. A coach you cannot reach in three seconds is a coach that does not exist. Speed is not a nicety here; it is the product.

So capture is ruthlessly minimal:

- **One entry point, always warm.** A single "What's going on?" field. No forms, no dropdowns, no "categorize your impulse." The user types or speaks one line: *"about to order the thing again."* That is a complete, valid Impulse Moment.
- **Offline-first (canon §6).** The moment of temptation often has no signal. Capture writes to the local SwiftData store immediately and syncs later. The frame can begin building on-device with cached identity + a small local classifier; the full frame reconciles when connectivity returns. We never block the user on the network at 11pm.
- **Voice and one-tap re-entry.** Typing is friction. We support dictation and a lock-screen/Shortcut entry so the gap between urge and reaching us is near zero. (Client details in `11 iOS Navigation.md`.)
- **Context is inferred, not interrogated.** Time, recent decisions, and the **EmotionSignal** from the Emotion Engine are attached automatically. We do *not* ask "how are you feeling 1–10." Asking a person in a System-1 state to fill out metadata is how you lose them.

**WHY minimal:** every field we add is a reason to close the app and make the choice unobserved. The frame can be enriched *during* the conversation — capture only needs enough to open a Decision (`status: open`) and hand the Coach something real.

---

## 3. Structuring: from a System-1 urge to a System-2 view

Once a Decision is open, the engine builds structure. The mental model is Kahneman's two systems: the impulse is **System 1** (fast, hot, certain). Our job is to make a **System 2** view *available* — slower, cooler, wider — without forcing the user through it and without lecturing. Structure is offered as a lens, never imposed as a lesson.

### 3.1 Options — including the option to wait

We extract the live options from the user's line plus memory. Critically, we always include the **null option** ("do nothing / wait / sleep on it") as a first-class choice, because the impulse frames the world as binary (buy / don't buy, text / don't text) when the real third door — *decide tomorrow* — is usually the aligned one. Making "wait" an explicit option is itself a gentle intervention.

### 3.2 Tradeoffs — who gains, who pays

For each option we articulate the tradeoff in canon's own terms: what **Present Self** gains (relief, dopamine, the end of craving) and what **Future Self** pays (money, sleep, the small erosion of an **Identity Statement**). We name the Present-Self gain *honestly and without judgment* — pretending the impulse has no upside is a lie the user can feel, and it costs us trust. Understanding before advising (principle #3) means we credit the pull before we widen the view.

### 3.3 Time-horizon reframing

Impulses collapse time. The whole trick of System-2 access is *re-expanding* the horizon. Two tools, chosen because they work without preaching:

- **10-10-10 (Suzy Welch):** How will this feel in 10 minutes, 10 months, 10 years? This is powerful precisely because the 10-minute answer is *honest* ("great, honestly") — we don't deny the immediate reward, we just place it next to the other two horizons and let the contrast do the work.
- **Future Self contrast:** We surface the user's own **Future Self narrative** (from the Identity Engine) beside the choice. Not "you shouldn't" — rather "the person you said you're becoming is standing here too." Identity over goals (principle #4): we contrast against *who they are becoming*, never against a target number.

The engine computes these; the Coach decides *whether and how* to voice them. A frame may contain a 10-10-10 view that the Coach never uses because the moment calls for silence instead.

---

## 4. Bias exposure — surface, never diagnose

We expose cognitive biases because naming the machinery of a bad decision is often enough to loosen its grip. But we do this as a **question, never a diagnosis.** "You're being irrational" is a parent. "I notice the urge feels huge right now — do you think it'll feel this big tomorrow?" is a coach.

The engine detects likely biases (a Haiku-4.5 classifier + rules over the trigger, options, and EmotionSignal — canon §6) and writes them to `bias_flags[]` on the Decision. Each flag is a *hypothesis with evidence*, mirroring the explainability constraint (§8). The three we prioritize, all from Kahneman:

| Bias | What it does in an Impulse Moment | How we surface it (as a question) |
|---|---|---|
| **Present bias / hyperbolic discounting** | Over-weights the immediate reward, near-zero weight on Future Self. | "Is this a now-you decision or a tomorrow-you decision?" |
| **Loss aversion** | The *sale ends tonight* / *last chance* framing makes not-acting feel like a loss. | "What are you actually afraid of losing if you wait?" |
| **Affective forecasting error** | We overestimate how good the impulse will feel and how long it'll last (Gilbert). | "How good do you think this'll actually feel an hour after?" |

**Contract with the Coach:** `bias_flags[]` is *input to move selection*, not a script. The engine says "present bias, confidence 0.7, evidence: 11pm + 'right now' + prior late-night lapses." The Coach may turn that into a Question move, a Contrast move, or choose to say nothing. Crucially, **we never display the bias label to the user.** "You are exhibiting loss aversion" is a diagnosis; it's condescending and it's banned in spirit by canon §2 (no shaming, no parenting). The bias informs the *shape* of a gentle question; the user never sees the term.

**WHY hypotheses, not verdicts:** we are frequently wrong about which bias is in play, and a confident wrong diagnosis destroys trust faster than silence. Flags carry confidence and evidence so the Coach can hedge, and so the Learning Engine (`07`/`04`) can later check whether a flag predicted the outcome.

---

## 5. The pause — friction as a gift (Thaler)

Thaler's insight: friction is a design material. A well-placed pause is not a wall that blocks the user — it is a **gift of time** returned to Future Self. But friction the user didn't consent to is manipulation, so the pause is always *offered and framed*, never silently imposed.

- **When:** we suggest a cooling-off period when the EmotionSignal shows high arousal *and* a bias flag fires *and* the option is reversible-by-waiting (you can almost always buy the thing tomorrow; you cannot un-send the text). Low-arousal, well-reasoned decisions get *no* pause — friction there is just annoyance.
- **How long:** short and concrete. A 10-minute "let's sit with it" for consumer impulses; "sleep on it, I'll be here in the morning" for bigger ones. We never invent a punitive countdown. The pause ends early the instant the user wants it to — it is a suggestion, not a lock.
- **How framed:** as siding *with* the user, not against them. "No rush — want to give tomorrow-you a vote?" The pause is the physical form of principle #1 (protect Future Self *with Present Self's consent*).

**WHY not a hard block:** a wall provokes reactance and teaches the user to route around the coach. A gift invites collaboration and builds the muscle we actually want — the user choosing to wait. We are building agency, not compliance.

---

## 6. The Recovery flow — the most important moment we coach

Canon §2 and §7 are unambiguous: the **Recovery** — the decision *after* a **Lapse** — matters more than any single aligned choice, and it is recovery-weighted **double** in the North Star. This section is therefore the most important in the document.

A Lapse is expected and is *never* a failure (banned words, §2). When a Decision resolves as a lapse, the Decision Engine does not close the book — it opens the door to the next Decision and marks it as a Recovery candidate. The flow:

1. **No shame, immediately.** The first frame after a lapse must not contain a single accusatory element. We suppress "what went wrong" framing entirely. The Coach's opening is warmth, not autopsy.
2. **Re-anchor to identity, not to the slip.** We pull the **Identity Statement** most relevant to the lapse and frame the moment forward: "you're still someone who's becoming X — this is just the next move." Progress over perfection (#5) is literally the recovery mechanic.
3. **Make the next aligned decision *easy* (Fogg).** BJ Fogg: Behavior = Motivation × Ability × Prompt. After a lapse, motivation is low and self-blame tanks ability. So we do *not* ask for a heroic correction. We shrink the next aligned action to something almost effortless — one tiny, obviously-doable step — and prompt it gently. The Recovery frame deliberately lowers the bar.
4. **Weight it and learn from it.** The Outcome is recorded with `kind: recovery`, which the North Star counts double and which the Learning Engine treats as high-signal. A recovery well-coached is worth more to the user's trajectory than an impulse well-avoided.

**WHY double-weight recovers over avoidance:** anyone can be aligned on an easy day. The person's *life* is decided by what they do after they slip. Optimizing for streaks teaches fragility; optimizing for recovery teaches resilience. This is the philosophy made arithmetic.

---

## 7. Alignment scoring — 0–1, and why it stays hidden

The engine computes an **alignment_score** (0–1) for each candidate option and stores it on the Decision (canon §5). Conceptually it is a function of the *identity model* and the *choice*:

> `alignment_score ≈ f(option, identity_statements, values, Future Self narrative, context)`

In practice: we embed the option and its tradeoffs, compare against the user's identity vectors and stated values (Identity/Memory Engines), adjust for context (a rest-day "lapse" from a fitness identity may be aligned, not misaligned), and produce a calibrated 0–1. Method, not code: it is a *learned, evidence-weighted similarity between this choice and who the user said they're becoming*, not a moral score.

**It is NEVER shown as a number or a grade.** This is a hard rule, not a preference. Reasons:

- **A grade is a judgment, and judgment is parenting.** "This choice: 0.3/1.0" is shaming with a decimal point. It violates §2 and the banned-word spirit.
- **Numbers invite gaming and anxiety.** The instant a score is visible it becomes a target; the user optimizes the metric instead of living the life. That is exactly the engagement-bought-with-anxiety loss canon §7 refuses.
- **A single number flattens a human decision.** Alignment is contextual and uncertain; presenting it as a crisp grade over-claims precision we don't have.

What the score *does*, invisibly:

1. **Drives coaching.** A low score nudges the Coach toward Contrast/Question moves; a high score toward Affirm. The score shapes *how we talk*, never *what we report*.
2. **Feeds the North Star.** Aggregated across decisions (recovery-weighted), it is the Aligned Decision Rate — canon §7. Aggregate signal for us; never a personal grade for them.

The user experiences alignment as *understanding* ("the app gets me") — never as a score card.

---

## 8. The Decision state machine

A Decision is `open` at capture and `resolved` when the user chooses (or explicitly abandons). The **Outcome** attached at resolution carries the `kind`: `aligned | lapse | recovery`. Note that `recovery` is only reachable if the *prior* Decision resolved as a `lapse` — recovery is defined relationally, per canon §2.

```
                         capture (11pm, one line)
                                  │
                                  ▼
                             ┌─────────┐
             enrich frame ──▶│  OPEN   │◀── pause / cooling-off
        (options, tradeoffs, └─────────┘    (Thaler; timer is soft,
         horizon, bias_flags) │  │  │        user can end early)
                              │  │  │
             ┌────────────────┘  │  └────────────────┐
             ▼                    ▼                   ▼
        user chooses         user chooses        user waits out
        aligned option       misaligned          the pause / defers
             │                    │                   │
             ▼                    ▼                   ▼
     ┌───────────────┐    ┌───────────────┐   (stays OPEN until
     │   RESOLVED    │    │   RESOLVED    │    resolved or expires
     │ kind=aligned  │    │  kind=lapse   │    → default aligned:
     └───────────────┘    └───────────────┘     "waited" is a win)
             │                    │
             │                    │ opens next Decision,
             │                    │ flagged recovery-candidate
             │                    ▼
             │             ┌───────────────┐
             │             │  OPEN (next)  │──▶ Recovery flow (§6):
             │             └───────────────┘    no shame, re-anchor,
             │                    │              make next step easy
             │                    ▼
             │             ┌───────────────┐
             │             │   RESOLVED    │  ← counts DOUBLE
             │             │ kind=recovery │    in the North Star
             │             └───────────────┘
             │                    │
             └────────┬───────────┘
                      ▼
              Outcome recorded → Learning Engine + Memory Engine
              (felt_after captured later feeds affective-forecasting calibration)
```

Two design notes worth their ink:

- **Waiting resolves as aligned.** If a user opens a Decision and simply rides out the pause without acting, we treat that as an aligned outcome. Choosing not to act *is* a decision, and it's usually the one Future Self wanted. Rewarding it reinforces the pause.
- **`felt_after` closes the loop on affective forecasting.** The Outcome captures how the choice actually felt (later, lightly). Comparing predicted-good to felt-good is how the Learning Engine calibrates our affective-forecasting flag — turning bias exposure from a guess into an evidenced pattern over time.

---

## 9. Interfaces (who we talk to)

- **Reads from:** Identity Engine / `03 Human Model.md` (identity statements, values, Future Self narrative), Emotion Engine (EmotionSignal on the moment), Memory Engine (prior decisions, patterns).
- **Writes:** the Decision aggregate and its Outcome (canon §5) onto the event bus (canon §4, `12 Backend Architecture.md`); we never write into another engine's store.
- **Hands to the Coach Engine (`07 Coaching Engine.md`):** the frame — options, tradeoffs, time_horizon_view, bias_flags, and the hidden alignment_score. The Coach owns everything the user actually hears.
- **Gated by:** the Safety Engine (canon §4, §8). If a message carries crisis/clinical risk, safety pre-empts the entire flow — we do not "coach a decision" through a crisis. This is a hard stop, not a branch.

---

## 10. Open questions / What we're deliberately NOT doing

**Open questions**
- **Detection vs. self-report.** MVP captures Impulse Moments the user *brings* us. When do we earn the right to *detect* them (calendar, spend, location) — and how do we do so without surveillance dread? Defer to consent scopes (canon §8) and `14 Notification Engine.md`.
- **Bias-flag calibration.** How many false-positive flags before the Coach learns to distrust a class of flag? Needs the eval harness (canon §6) and `felt_after` data before we tune thresholds.
- **Pause length personalization.** Fixed 10-min / sleep-on-it in v1. Should length adapt to a user's demonstrated recovery patterns? Learning Engine, v1.1.
- **Reversibility inference.** We lean on "can you do this tomorrow?" to decide whether to pause. Classifying reversibility reliably (especially for social/relational impulses) is unsolved.

**What we're deliberately NOT doing**
- **No numeric or letter grade, ever** — alignment_score is internal-only (§7). Non-negotiable.
- **No bias *diagnoses* to the user** — we surface biases only as gentle questions; the label never leaves the engine (§4).
- **No hard blocks or punitive countdowns** — friction is an offered gift, never a wall (§5).
- **No deciding for the user** — we frame; they choose (principle #2). The engine has no "recommended option" field by design.
- **No shame path after a lapse** — there is no "what went wrong" flow; the only path out of a lapse is Recovery (§6).
- **We do not own dialogue or tone** — that is `07 Coaching Engine.md`. This engine produces structure and stays silent.
