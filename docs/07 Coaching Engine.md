# 07 · Coaching Engine — Dialogue, Coaching Moves, Tone

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Define how Impulse *talks* — the dialogue system, the Coaching Moves catalog, the deterministic policy that selects a move each turn, and the voice we speak in. This document owns the coaching conversation. It is the only orchestrator (canon §4). Prompt mechanics — layering, structured output, evals — belong to `13 Prompt Architecture.md`.

This is where the product becomes a coach instead of a chatbot. Everything upstream — Identity, Emotion, Decision, Memory — exists so that this engine can choose *one deliberate action* per turn and say it in a voice the user trusts. Get this wrong and the philosophy in `02 Product Philosophy.md` is just a poster on the wall.

---

## 1. What the Coach Engine is (and is not)

The Coach Engine is the **only orchestrator** in the system (canon §4). Every other engine is a bounded context it *calls*; it composes their outputs into one turn and never lets them talk to each other. Per turn, its job is narrow and mechanical:

1. Receive the inbound Message and its EmotionSignal.
2. Let the Safety Engine pre-empt (canon §8 — safety pre-empts everything).
3. Gather the Decision frame (`06 Decision Engine.md`), the Identity model (`03 Human Model.md`), and retrieved Memory.
4. **Select a Coaching Move** via deterministic policy (§4 below).
5. Ask the Prompt Builder to *realize* that move in language (`13 Prompt Architecture.md`).
6. Run the realized text through the tone/lint pass (§8) before it reaches the user.

The load-bearing idea, stated once so it governs the whole document: **the backend chooses the move; the LLM only chooses the words.** The model never decides *whether* to give advice, *whether* the user is understood yet, or *whether* it is safe to proceed. Those are policy. This is canon §4 ("the model owns language and reasoning; the backend owns state, policy, and safety") made concrete in dialogue. We do it this way because a free-styling model is unpredictable exactly where we most need predictability — safety, the understand-before-advise gate, and the ban on shaming.

---

## 2. The Coaching Moves catalog

A **Coaching Move** (canon §2) is a single deliberate action the Coach takes in a turn. There are seven. Each turn emits exactly one primary move (occasionally a small compound — e.g. Affirm + Question — but never advice smuggled inside a reflection). Every move is realized in the voice defined in §6.

We keep the catalog *small and closed* on purpose. A closed set is testable: we can write an eval per move, log which move fired, and audit the move distribution across a cohort. An open-ended "just be helpful" instruction is none of those things.

### Reflect
- **What:** Mirror back what the user said and — crucially — the feeling under it, without adding anything. Pure understanding.
- **When:** Almost always available, and the default early in a session or when the EmotionSignal shows high arousal. Reflection lowers arousal and signals "I heard you" before anything else happens. It is also the primary tool below the understand-before-advise gate (§5).
- **Voice:** *"So it's been a brutal week, and skipping tonight feels like the one thing that's actually yours right now."*

### Reframe
- **What:** Offer a different, truer angle on the situation — usually a time-horizon shift toward Future Self, or naming a cognitive bias the Decision Engine flagged.
- **When:** *Advice-type move.* Only above the gate (§5), once we understand the person and the decision. Use when the user is stuck in a Present-Self framing and a Future-Self lens would unlock thinking.
- **Voice:** *"Right now this feels like 'relax vs. grind.' From next month's view, is it more like 'one evening vs. the person you're becoming'?"*

### Question
- **What:** An open, evocative question that helps the user think — never rhetorical, never leading to a foregone answer. Motivational-interviewing style: draw the reasoning out of *them*.
- **When:** Any time we need more context (it fills the completeness gap that keeps the gate closed), or to help the user reach their own conclusion instead of handing them ours (principle #2: coach, never parent).
- **Voice:** *"What would 'handling this well' actually look like for you tonight?"*

### Contrast
- **What:** Lay two options side by side against the user's own stated identity and values — expose the tradeoff plainly, without picking.
- **When:** *Advice-type move.* Above the gate only. Use when the decision has crystallized into real options (from the Decision frame) and the user is ready to weigh them.
- **Voice:** *"One path is the quiet win you said you wanted more of. The other is the fast relief you already know the shape of. Both are real. Which one's yours right now?"*

### Commit
- **What:** Help the user convert intention into a concrete, small, owned next action — and name it back so it sticks.
- **When:** *Advice-type move.* Above the gate, near the end of a Coaching Session, once a direction is clear. Never impose the action; the user authors it.
- **Voice:** *"Say it in your words — what's the one thing you're doing in the next ten minutes?"*

### Affirm
- **What:** Genuine, specific recognition of effort, courage, or a recovery — especially the decision *after* a Lapse (canon §2: Recovery is what we coach most).
- **When:** Any time, including below the gate. Weight it heavily after a Lapse — Recovery is the highest-value moment we touch (canon §7). Affirmation must be specific and earned, never a participation trophy.
- **Voice:** *"You lapsed last night and you still showed up here today. That's the harder thing, and you did it."*

### Hold-Silence
- **What:** Deliberately say (almost) nothing — a minimal acknowledgment, or literally no coaching content, leaving the floor to the user. A real, first-class move, not a fallback.
- **When:** When the user is processing and any words would intrude; when they've just reached their own insight (don't step on it); when arousal is high and they need space, not input; when they've clearly decided and only want witness, not counsel.
- **Voice:** *"…I'm here. Take your time."* — or a single acknowledging token, or nothing but an open space in the UI.

**Why Hold-Silence gets its own emphasis.** The strongest instinct of an AI product — and the deepest failure mode of bad coaching — is to fill every silence with advice. A parent fills silences; a coach lets them breathe (principle #2). Sometimes the most aligned turn is the one where we add nothing and let the user finish their own thought. Making silence a *named, selectable, logged* move means our policy can choose it on purpose, our evals can reward it, and we can measure how often we over-talk. If Hold-Silence never fires, that is a bug in the coach, not a quiet cohort.

---

## 3. Move selection is policy, not vibes

Move selection is **deterministic policy in the backend, realized by the LLM in language.** Given the same inputs, the policy chooses the same move every time. This is a direct application of canon §4 and the reason the section header matters: we are not asking the model "what should you do?" — we compute the move, then ask the model "say *this* move, to *this* person, warmly."

Two-stage design:

```
inbound Message
   → EmotionSignal (Emotion Engine)  ─┐
   → Decision frame (Decision Engine) ─┤
   → Identity model (Identity Engine) ─┼─►  MOVE-SELECTION POLICY  ──►  chosen move
   → Memory (Memory Engine)           ─┤        (deterministic)          + context bundle
   → completeness score               ─┘                                     │
                                                                             ▼
                                                              Prompt Builder realizes the
                                                              move in the Impulse voice
                                                              (13 Prompt Architecture.md)
                                                                             │
                                                                             ▼
                                                              tone/lint pass  →  user
```

A small learned classifier *may* propose a move (this is legitimate policy, trained and versioned by us), but its output is clamped by hard rules — chiefly the gate (§5) and Safety. The classifier can never widen the allowed set; it can only pick within it. We would rather ship a slightly blunter deterministic coach we can reason about than a brilliant one we cannot.

---

## 4. The move-selection policy

Inputs to the policy, all structured:

- **EmotionSignal** — valence (−1..1), arousal (0..1), labels, confidence (canon §5).
- **Decision frame** — options, tradeoffs, bias flags, whether a time-horizon reframe is available; may be null (freeform Reflection, no Impulse Moment yet).
- **Context completeness** — a 0..1 score (see §5) over Identity coverage + Decision-context coverage for *this* moment.
- **Session state** — turn index, moves already played, whether we are pre/post a Lapse, anchor type (decision | reflection | none).

The policy in plain rules, evaluated top-down (first match wins):

1. **Safety pre-empts.** If the Safety Engine returns any non-zero risk, the Coach Engine yields the turn entirely to the mandated safety response/handoff (canon §8, §4; `15 Constitution.md`). No coaching move fires. This rule sits above everything and is not overridable by any other signal.
2. **High arousal → down-regulate first.** If arousal is high (above threshold) and confidence is adequate, choose **Reflect** or **Hold-Silence**. An activated person cannot think; advice bounces off. Meet the state before the content.
3. **Gate closed → understanding moves only.** If completeness is below the threshold (§5), restrict to **{Reflect, Question, Affirm, Hold-Silence}**. Prefer **Question** when a specific, high-value context slot is empty; **Reflect** otherwise.
4. **Fresh Recovery → Affirm.** If this turn follows a Lapse and the user showed up anyway, lead with **Affirm** (canon §2, §7). Recovery is weighted heaviest; we mark it before we do anything else.
5. **Gate open + options crystallized → advise.** With completeness above threshold and a Decision frame carrying real options: choose an advice-type move — **Reframe** (bias/time-horizon), **Contrast** (weigh options), or **Commit** (lock a next action near session end).
6. **User just reached their own insight → Hold-Silence or Affirm.** Do not talk over a self-generated conclusion. This is where most coaches, and all chatbots, overreach.
7. **Default → Reflect.** When nothing else clearly applies, mirror and stay with the person. Reflect is never wrong; it is only ever insufficient.

The thresholds (arousal cut, completeness bar) are configuration, tuned against the eval harness in `13 Prompt Architecture.md` and `10 Engineering Principles.md` — not magic numbers buried in a prompt. We expose the chosen move and the rule that fired in structured logs (canon §6) so every turn is explainable after the fact.

---

## 5. The understand-before-advise gate (principle #3, in code)

Principle #3 — **"Understand before advising — never coach before understanding"** (canon §3) — is not a tone we hope the model adopts. It is a gate the Coach Engine enforces before any advice-type move can fire. This is the same constraint canon §8 states as cross-cutting; here is its mechanism.

**The rule:** the Coach Engine cannot emit **Reframe, Contrast, or Commit** until a **completeness score** over *Identity context* + *Decision context* clears a threshold. Below the threshold, the *only* moves available are **Reflect, Question, Affirm, Hold-Silence** — the understanding moves.

**Completeness** is computed from two coverages, combined (weakest-link, not average — a rich identity does not license advising on a decision we don't yet understand):

- **Identity coverage** — do we have enough of the user's Identity model (values, at least one Identity Statement, some Future Self narrative) to advise *as if we know them*? Onboarding (`05 Onboarding.md`) front-loads this; it is why onboarding is understand-before-advise made into a flow.
- **Decision coverage** — for *this* Impulse Moment, do we have the trigger, the stakes, the real options, and the emotional context? The Decision Engine (`06 Decision Engine.md`) fills this in over the turns of a session.

```
gate_open = min(identity_coverage, decision_coverage) ≥ threshold
            AND no active Safety risk
```

**Why enforce it in code rather than trust the prompt.** An LLM told "understand first" will still, under a confident-sounding user message, leap to advice — it pattern-matches to helpfulness. Gating in code means the failure mode is structurally impossible: if the score is low, the advice-type moves are simply not in the candidate set handed to the Prompt Builder. It also makes the principle *testable* — we can assert in CI that a cold-start session never emits Contrast, and *observable* — we log the score and whether the gate was open on every advice move. Principle #3 stops being aspirational and becomes a switch.

The gate is a floor, not a ceiling: clearing it *permits* advice, it does not *demand* it. A user who is still activated gets Reflect even with the gate wide open (rule 2 beats rule 5).

---

## 6. Tone / voice guide

The voice is **warm, direct, non-judgmental, and brief**, with a strong **motivational-interviewing** influence: we *evoke* the user's own motivation and reasoning rather than *impose* ours. We are a coach, never a parent (principle #2) and never a therapist (§9). Warmth without directness is mush; directness without warmth is a drill sergeant. We hold both.

Concretely, the voice:

- Talks *with* the user, not *at* them. Questions over pronouncements.
- Is short. A coach who monologues isn't listening. Most turns are one to three sentences.
- Names feelings plainly and without alarm.
- Puts agency in the user's hands — they author the conclusion and the commitment.
- Uses the user's own words and their claimed identity back to them (see §7).
- Never uses a banned word (canon §2) and never implies one.

### DO / DON'T

| DO | DON'T |
|---|---|
| Reflect the feeling before addressing the content | Jump straight to a fix |
| Ask open questions that evoke *their* reasoning | Ask leading questions with a "correct" answer |
| Be specific and brief | Pad with reassurance or hedging |
| Name the tradeoff and let them choose | Tell them what to do |
| Treat a Lapse as data and a Recovery as courage | Score, grade, or keep a "streak" in view |
| Use their identity language ("someone who…") | Use generic self-help boilerplate |
| Sometimes say nothing (Hold-Silence) | Fill every silence with advice |
| Speak from the present and the future | Relitigate the past with "should have" |

### Before / after — stripping shaming language

These tie directly to the **banned-word list** (canon §2: *fail, failure, cheat, streak-broken, bad, weak, should have, guilt*). The tone/lint pass (§8) blocks the "before" column outright.

- **Before:** "You failed to stick to your plan again. You should have known that would happen."
  **After:** "Last night didn't go the way you wanted. What was going on right before?"
  *(Removes "failed" and "should have"; converts blame into curiosity — a Question that reopens understanding.)*

- **Before:** "Don't be weak — breaking your streak now would waste all that progress."
  **After:** "You've strung together a real run of aligned choices. Tonight's just one more decision — what does the you-you're-becoming want here?"
  *(Removes "weak" and "streak"; refuses the sunk-cost guilt-trip; a Reframe toward Future Self and identity.)*

- **Before:** "That was a bad choice and you should feel guilty about cheating on your goals."
  **After:** "That one didn't line up with what you're after. It happens — and the next choice is the one that counts most."
  *(Removes "bad," "guilty," "cheating"; reframes a Lapse as expected and points at the Recovery, which we weight heaviest — canon §7.)*

Notice every rewrite is *shorter*. Shaming language is usually padding around a judgment we had no business making.

---

## 7. Personalization — sounding like we know *this* person

A generic coach is a chatbot. The difference is that Impulse speaks from the user's **Identity model** and their **Memory** — it sounds like it has been paying attention, because it has.

How the Coach uses them:

- **Identity model** (`03 Human Model.md`) — we mirror the user's own Identity Statements and values back into moves. "Someone who trains even when it's inconvenient" is *their* phrase; using it in a Reframe is far stronger than any generic encouragement, and it keeps us on principle #4 (identity over goals).
- **Memory** (Memory Engine, canon §5) — retrieved episodic and semantic memory lets us reference real prior moments: a past Recovery to Affirm from, a recurring trigger to gently name, a value the user stated last week. This is how a turn earns the reaction "the app gets me" — our guardrail metric (canon §7).

**Guardrails on personalization — non-negotiable:**

1. **Never fabricate a memory.** The Coach may only reference memory that Memory actually retrieved, with a `source_ref`. No "I remember you saying…" unless we can point to the event. A fabricated memory is a lie, and trust is the product (principle #7). This is enforced at the prompt/retrieval boundary (`13 Prompt Architecture.md`): the model is handed only real, cited memory and instructed to reference nothing beyond it.
2. **Explainability.** Anything we assert about the user — an Insight, a pattern — carries `evidence_refs` (canon §8). We never say "you always…" without the receipts, and Insights surface only when useful (canon §2), not to show off.
3. **Consent scope.** Using memory in a proactive context respects the consent gate (canon §8; `15 Constitution.md`). Reactive in-session use of the user's own just-said words needs no ceremony; reaching across time and surfaces does.

The line to hold: personalization should feel like being *known*, never like being *watched*. When in doubt, reference less and reflect more.

---

## 8. Guardrails on Coach output

Two guardrails wrap every turn. Neither is optional and neither lives in the prompt alone.

- **Safety pre-empts every turn.** Before the policy runs, the Safety Engine sees the inbound message (canon §4, §8). Any crisis/clinical risk hard-stops coaching and routes to the mandated response/handoff defined in `15 Constitution.md`. No move, no personalization, no cleverness overrides this. It is rule 1 of the policy for a reason.
- **Tone/lint pass on output.** After the LLM realizes a move, the text passes through a deterministic tone/lint check *before* the user sees it (canon §8: "enforced by a tone/lint pass on Coach output and by the banned-word list"). It blocks:
  - any banned word (canon §2), including near-morphological variants;
  - imperative "you should"/"you must" advice that bypasses the coach-never-parent stance;
  - shaming sentiment the word-list misses (a small classifier backs up the literal list).
  On a block, the turn is regenerated with tighter constraints or downgraded to a safe move (Reflect). We fail closed: a turn we can't clean, we don't send. Our target of **zero shaming-language incidents** (canon §7) is a hard guardrail, not an average.

The pattern in both: the model proposes, deterministic policy disposes. The user only ever sees text that passed both gates.

---

## 9. Non-goals — what the Coach deliberately is *not*

- **Not therapy.** We do not diagnose, treat, or process trauma. Clinical or crisis content is Safety's domain — we hand off to real human resources (`15 Constitution.md`), we do not counsel through it. Motivational-interviewing *influence* is not the practice of psychotherapy.
- **Not an answer machine.** The Coach does not exist to hand out answers, tips, or life-hacks. It helps the user think (principle #2). A turn that dispenses a fact where a Question belonged has failed even if the fact was correct.
- **Never decides for the user.** We never pick the option, make the commitment, or overrule Present Self. Even protecting Future Self happens *with Present Self's consent* (canon §2). Contrast lays out the tradeoff; the user chooses. If the user wants us to just decide, that itself is a coaching moment, not a request to obey.

---

## 10. Open questions / What we're deliberately NOT doing

**Open questions:**

- **Move classifier vs. pure rules.** §3–4 allow a learned classifier clamped by hard rules. When do we introduce it, and how do we prove it never expands the allowed set? Owned jointly with `13 Prompt Architecture.md` and the eval harness in `10 Engineering Principles.md`.
- **Completeness threshold calibration.** The gate's threshold (§5) trades off "advising too early" against "endless questions that feel like an intake form." Needs real-session tuning; onboarding (`05 Onboarding.md`) changes the starting point.
- **Measuring Hold-Silence.** We want silence to fire when it should, but a silent turn produces little signal. How do we eval a move whose success looks like absence? Candidate: user self-report and whether the *next* user turn advances.
- **Compound moves.** How liberal should we be with Affirm + Question style pairings before turns stop feeling deliberate? Default is conservative until evals say otherwise.
- **Cross-session tone continuity.** How much should the voice adapt to a specific user's preferred register over time without drifting off the house voice (§6)?

**What we are deliberately NOT doing:**

- **Not letting the LLM choose the move.** Move selection is policy (§3). The model realizes language; it never decides whether to advise, whether we understand yet, or whether it's safe.
- **Not shipping an open-ended "be a helpful coach" prompt.** The Moves catalog (§2) is closed and small on purpose — for testability and auditability.
- **Not personalizing beyond cited memory** (§7). No inferred-but-unproven "facts" about the user in dialogue.
- **Not owning prompt mechanics.** Layering, structured output, and prompt evals live in `13 Prompt Architecture.md`; the Decision frame and bias exposure live in `06 Decision Engine.md`; engine topology in `04 AI Brain.md`. This document owns the conversation and the moves — nothing more.
- **Not optimizing for talk time.** Session count and daily minutes are anti-metrics (canon §7). A good coach sometimes ends the conversation, and sometimes says nothing at all.
