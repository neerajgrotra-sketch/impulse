# 05 · Onboarding — The First Moment of Being Understood

> **Status:** Draft v0.1 — 2026-07
> **Purpose:** Own the first-run experience and make **understand before advising** concrete. This document specifies the opening sequence — welcome, identity capture, first Reflection, the Covenant, first coaching touch — and the rationale behind each step. It defers the visual and navigation treatment to `11 iOS Navigation.md`, the model internals to `03 Human Model.md` and `04 AI Brain.md`, and the ethical guarantees to `15 Constitution.md`.

---

## 1. Thesis: onboarding is not setup

Most apps treat onboarding as configuration — collect an email, request permissions, offer a tour, tick the boxes, drop the user at a dashboard. We reject that framing entirely.

**Onboarding's job is to produce the first moment the user feels understood.** Everything else — accounts, consent, notification permissions — is subordinate to that single feeling. If a user finishes our first run having granted every permission but never felt seen, onboarding failed. If a user grants almost nothing but leaves thinking *"this thing actually gets what I'm trying to do,"* onboarding succeeded.

WHY this and not completion: our entire product rests on principle #3, **understand before advising**. A coach who hasn't earned understanding has no right to advise, and a user who hasn't *felt* understood has no reason to trust advice. Onboarding is where that trust is either born or lost. It is the first — and highest-stakes — application of the principle, before we have any history to lean on.

### The metric

- **Primary: Time-to-First-Feeling-Understood (TTFU).** The elapsed time from first launch to the moment the Coach reflects the user's own words back in a way that lands. We approximate "lands" with a lightweight in-context signal (see §8) and validate it against the north-star guardrail *"the app gets me."*
- **We explicitly do NOT optimize completion rate.** Completion rate rewards interrogation and dark-pattern coercion — exactly the anti-metrics in Canon §7 (raw engagement, streaks, session count). A high completion rate bought by trapping the user in a form is a loss, not a win.
- Guardrails carried from Canon §7: zero shaming-language incidents, correct crisis handoff (see §9), and a *low* volume of questions asked before value is delivered.

This reframing is the whole document. Every step below is judged by whether it moves TTFU down without cheapening the feeling.

---

## 2. Design constraints we inherit

Before the sequence, the rules that shape it:

- **Progressive disclosure (Krug, *Don't Make Me Think*).** Ask for the minimum needed for the *next* moment of value, never for a hypothetical future feature. The user should never wonder "why are you asking this?"
- **Start tiny (Fogg, *Tiny Habits*).** The first behavior we request must be almost embarrassingly small. Tiny actions succeed; success breeds the next action. A large first ask is a large first failure.
- **Identity over goals (principle #4).** We elicit who the user wants to *become*, not what they want to *accomplish*. This is structural, not cosmetic — the root aggregate is **Identity**, not Goal (Canon §5).
- **Consent is a gate, not a checkbox (Canon §8).** The Covenant is a promise we make, presented as such — not a legal wall to click past.
- **Safety pre-empts everything (Canon §8).** The Safety Engine inspects every inbound message *including the first one typed during onboarding.*

---

## 3. The sequence

Five moments. Each is a beat, not a screen — the client may compose them differently (see `11 iOS Navigation.md`); the *order of felt experience* is what's fixed.

```
  Welcome ──▶ Identity ──▶ First ──▶ Covenant ──▶ First
  (framing)   Capture     Reflection  + Consent    Coaching Touch
     │           │            │           │             │
     │      seeds Identity  first     the promise   proves we
  Present/    Engine      Memory     (15 Const.)   listened first
  Future                  created                  (understand-
  Self                                             before-advise)
```

The arc is deliberate: we *frame* who this is for, *listen* to who they are, *let them act* tinily, *promise* how we'll treat them, then *demonstrate* the promise by reflecting rather than advising. Understanding is built up before a single piece of guidance is offered.

---

### Step 1 — Welcome: the Future Self framing

**What happens.** A short, warm welcome that introduces one idea and only one: there is a **Present Self** who holds the phone right now, and a **Future Self** who lives with today's choices — and Impulse exists to help the two of them get along. We say it in plain human language. No mention of "hyperbolic discounting," "alignment scoring," "engines," or "the Gap." No feature list.

**WHY.** The Present/Future Self frame is the conceptual spine of the whole product (Canon §1–2). If the user leaves with nothing else, they should leave with this mental model, because every later interaction — a Nudge, a Reflection, a hard question — makes sense only through it. We introduce it first so the rest of onboarding has a frame to hang on.

**WHY gently, no jargon.** Jargon is a tax the user pays to talk to us; it signals the product is about the product, not about them. Canon §10 forbids inventing synonyms for canon terms in *documents*, but in the *product surface* we translate the concept into the user's language and let the term earn its way in later. The first screen must feel like a conversation with a wise friend, not an onboarding funnel.

**What we do NOT do here.** No account creation yet. No permission prompts. No "get started" checklist. The welcome asks for nothing but attention.

---

### Step 2 — Identity capture (NOT goal-setting)

**What happens.** We ask, in one or two open, gentle prompts: *"Who do you want to become?"* and, if they stall, a softer scaffold like *"When you imagine yourself a year from now, at your best — what's true about that person?"* We accept free text, voice, or a few tap-to-pick starters (e.g. "someone who's present with my kids," "someone who's calm under pressure"). The starters exist only to unstick the blank page, never to constrain the answer.

We then reflect their words back and offer to shape them into one or two **Identity Statements** — first-person, present-tense claims ("I am someone who…"). Crucially, *the user confirms or edits the statement.* We propose; they own.

**WHY identity, not goals.** This is principle #4 made literal. Goals are brittle — they're binary, they expire, and missing one reads as failure (a banned frame, Canon §2/§37). Identity is durable and generative: "I am someone who stays calm" survives a bad day in a way that "meditate 10 minutes daily" does not. A lapse against a goal is a broken streak; a lapse against an identity is just a moment that didn't match who you are — recoverable, which is exactly what principle #5 (progress over perfection) needs.

**WHY elicit rather than assign.** We never hand the user an identity. The Coach doesn't decide who they should become (principle #2, coach never parent). We elicit, reflect, and let them ratify. The act of *saying it in their own words and confirming it* is itself the first small commitment — and the first data point that is unambiguously theirs.

**How answers become structure.** The raw answers are handed to the **Identity Engine** (Canon §4), which produces the initial **Identity** aggregate (Canon §5): `values[]`, `identity_statements[]`, and a first sketch of the `future_self_narrative`. Extraction of values and virtues from free text is an LLM-assisted, human-confirmed step — the model proposes candidate structure through the **Prompt Builder**, the user approves the surfaced statements, and only confirmed content is persisted. See §7 for the hand-off contract and `03 Human Model.md` for how the Identity model is represented thereafter.

**What we do NOT ask.** No demographics beyond locale. No "rate your life in these 8 domains." No exhaustive values inventory. One good Identity Statement beats twenty survey answers.

---

### Step 3 — A first, tiny Reflection

**What happens.** We invite one small look-back, sized to seconds not minutes: *"Think of one recent moment that either matched — or didn't match — the person you just described. What happened?"* A sentence is plenty. If they'd rather not, they skip freely (see §9).

This produces the user's first **Reflection** (Canon §5) and, from it, the first **Memory** (episodic type) written to the Memory Engine.

**WHY tiny (Fogg).** The first action must be small enough that success is nearly guaranteed. A tiny reflection that *succeeds* teaches the user that engaging with Impulse is light and safe; a heavyweight journaling prompt on day one teaches the opposite and predicts churn. We are buying the *second* interaction, not maximizing the first.

**WHY a reflection specifically, and WHY now.** It converts the abstract Identity Statement into a concrete, personal memory — grounding "who I want to become" in a real moment from the user's actual life. That grounding is what makes the Step 5 coaching touch land: the Coach will have something true and specific to reflect back, not a generic affirmation. This is understand-before-advise operating in miniature: we gather a real datum before we say anything coach-like.

**What we do NOT do.** We do not evaluate, score, or judge the reflection. We do not surface an Insight yet — one data point is not a pattern, and Canon §8 forbids asserting a pattern we can't evidence. We simply receive it.

---

### Step 4 — The Covenant + consent moment

**What happens.** Before we ask for anything ongoing (notifications, calendar signals, always-on context), we present **the Covenant** (Canon §2, `15 Constitution.md`) — our binding promise about how we treat the user's data and dignity. It's phrased as a promise *from us to them*, in the second person, human and specific: what we will do, what we will never do, and that they can walk away with their data at any time. Consent scopes are requested *individually, in plain language, each tied to the value it unlocks* — never bundled into one accept-all.

**WHY a promise, not a legal wall.** Principle #7 — **earn the right to hold this data** — means trust is the product. A wall of legalese that the user clicks past has extracted compliance, not trust; it actively signals that we expect to do something they wouldn't like. Presenting the Covenant as a promise inverts that: we go first with our commitments before asking for theirs. This is also why the Covenant comes *after* they've already given us something (their Identity Statement, a reflection) — we're now promising to protect something real, which makes the promise mean something.

**Consent scopes we ask for (each optional, each explained):**
- **Store your reflections and decisions** so the Coach can remember you over time (this is the baseline that makes coaching possible; declining is allowed but limits memory — see §9).
- **Send you Nudges** at helpful moments — clearly framed as permissioned and never a guilt-trip (Canon §2, `14 Notification Engine.md`). Off by default; opt-in.
- **Later, higher-trust scopes** (calendar/context signals for detecting Impulse Moments) are *not* requested on day one — they're deferred until the user has reason to want them.

**Consent scopes we deliberately do NOT ask for:**
- No contacts, no social graph, no location history, no cross-app tracking.
- No blanket "we may use your data to improve our services" catch-all.
- Nothing whose value we can't explain in one honest sentence.

Consent state is persisted on the **User** aggregate (`consent flags`, `covenant_version`, Canon §5), and every later proactive action re-checks the relevant scope (Canon §8: consent is a gate). The `covenant_version` is recorded so that if the promise ever changes, we re-earn consent rather than silently grandfathering it.

---

### Step 5 — A first, light coaching touch

**What happens.** The Coach responds to what the user shared in Step 3 — using a **Reflect** or **Affirm** Coaching Move (Canon §2), *not* advice. It might say, in the user's own words: *"You said you want to be someone who's present with your kids, and you mentioned putting your phone down at dinner last night. That's the exact thing, isn't it."* Then it stops. No plan, no tip, no "here's what you should do tomorrow."

**WHY reflect, not advise.** This is the payoff of the entire sequence and the literal enactment of principle #3. The very first thing the Coach *does* is prove it listened. Advice on day one — before understanding is earned — would violate the principle and, worse, feel like every other app. By reflecting the user's own words and identity back, we generate the target feeling: *this thing gets me.* That is the TTFU moment.

**WHY it's enforced, not just intended.** Canon §8 states understand-before-advise is enforced in code: the Coach Engine cannot emit advice-type moves until Decision + Identity context meets a completeness threshold. During onboarding that threshold is deliberately *not* met — there's no resolved Decision and only a seed Identity — so the Coach Engine is *structurally incapable* of advising here even if a prompt tried. The available move set is restricted to Reflect / Affirm / Question. See `07 Coaching Engine.md` for the move gating and `04 AI Brain.md` for how the Coach Engine composes the other engines this turn.

**What we do NOT do.** No goal-setting, no "your plan," no dashboard reveal, no gamified reward. The user leaves onboarding having been *heard*, holding a mental model, an Identity Statement they own, one memory, and a promise — and nothing they were coerced into.

---

## 4. What we deliberately don't ask on day one

Progressive disclosure is a first-class design decision, not laziness. On day one we do **not** ask for:

- **Demographics, health data, or life-domain surveys.** They feel like intake at a clinic, not a conversation with a coach. Nothing here improves the Step 5 moment.
- **Multiple goals or a full values inventory.** One Identity Statement is enough to begin. More is interrogation (Krug: every extra question is friction the user pays for and we may never repay).
- **High-trust permissions** (calendar, location, always-on context). We haven't earned them; asking early signals we value our roadmap over their comfort.
- **Payment / commitment.** Trust precedes transaction.

WHY, in one line: **every question we don't ask is respect we don't have to earn back.** The interrogation-style onboarding trades the user's goodwill for our database completeness — a trade that costs us the guardrail metric ("the app gets me") we most need to protect. We ask later, in context, when the user has a reason to want to answer.

---

## 5. How onboarding seeds the engines

Onboarding is the Identity and Memory engines' cold-start. It is the *only* moment they run with zero prior history, so its outputs are load-bearing for everything downstream.

**Identity Engine hand-off (`03 Human Model.md`, `04 AI Brain.md`):**
- Input: raw identity-capture answers (Step 2), the tiny reflection (Step 3).
- Output persisted: initial **Identity** aggregate — `values[]`, `identity_statements[]` (user-confirmed), seed `future_self_narrative`, empty/low-confidence `virtues[]`.
- Contract note: statements are marked *user-confirmed*; model-proposed-but-unconfirmed candidates are not persisted as fact. The Identity Engine treats this as v0 of a model it will refine from every future Reflection and Decision (Canon §4).

**Memory Engine hand-off (`04 AI Brain.md`):**
- Input: the Step 3 reflection.
- Output persisted: first **Memory** (`type: episodic`), with `source_ref` pointing at the Reflection, an embedding for later retrieval, and an initial `salience` (Canon §5).
- WHY salience from the start: this first memory is disproportionately likely to be retrieved early (it's the only one), so it seeds the very coaching touch that closes onboarding — a clean, deliberate loop from capture to demonstration.

**Not seeded on day one:** Decision Engine (no Impulse Moment yet), Learning Engine (no outcomes to learn from — and it's a stub until v1.1, Canon §4), Notification Engine (fires only if the Nudge scope was granted, and never on day one). This restraint is intentional: we don't manufacture activity to look busy.

---

## 6. Failure and empathy cases

Onboarding must be graceful precisely where a form would be brittle. Two cases matter most.

### 6.1 The user who won't share

Some users arrive guarded — they skip the identity prompt, decline the reflection, refuse memory storage. **This is allowed, and it must never be punished.** There is no "you must complete this to continue" wall (that would optimize completion rate — the metric we reject in §1).

- If they skip identity capture, we offer a gentler entry (a tap-to-pick starter, or "we can come back to this") and proceed. The Coach can still frame Present/Future Self and demonstrate listening on *whatever* they gave us, even a single word.
- If they decline memory storage, we explain plainly what that limits (the Coach's ability to remember them) without a guilt frame — banned words apply (Canon §2/§37). Coaching degrades gracefully to session-only.
- If they share nothing at all, onboarding ends warmly, not with a nag. The door stays open. WHY: a guarded user who feels respected on day one is a user we can earn later; a guarded user who feels pressured is gone.

### 6.2 The user in crisis on day one

A user may disclose acute distress in the very first reflection — self-harm, abuse, a crisis. **The Safety Engine inspects every inbound message, including onboarding text** (Canon §4, §8). Onboarding has no exemption.

- If the Safety Engine returns an elevated risk level, it **pre-empts the entire onboarding sequence.** We do not continue asking about Future Self or present a Covenant screen to someone in crisis — that would be grotesque.
- The mandated response takes over: acknowledge, express care in plain human language, and route to appropriate human/professional resources per the Safety Engine's handoff policy. Impulse is a decision coach, not a clinician or crisis service, and says so honestly.
- Crisis-handoff correctness is a launch-gating guardrail (Canon §4, §7). Getting this right on day one — when we know the user least — is the hardest and most important case.
- See `15 Constitution.md` for the non-negotiables and the exact resource-routing policy; this document only asserts that onboarding is fully subordinate to it.

WHY these two cases share a section: both are moments where a lesser product optimizes for its own funnel at the user's expense. Our answer to both is the same — the user's dignity and safety outrank our data and our completion rate, every time (principles #2 and #7).

---

## 7. Engine hand-off contract (summary)

| Onboarding step | Engine seeded | Persisted output (Canon §5) | Confirmation model |
|---|---|---|---|
| 2 · Identity capture | Identity Engine | `Identity` (values, statements, narrative seed) | User confirms each statement |
| 3 · Tiny reflection | Memory Engine + Reflection | `Reflection`, `Memory` (episodic) | Received, not judged |
| 4 · Covenant/consent | User aggregate | `consent flags`, `covenant_version` | Explicit, per-scope |
| 5 · Coaching touch | Coach Engine (read-only compose) | `CoachingSession` (anchor: reflection) | Reflect/Affirm move only |

Every inbound text at every step also passes through the **Safety Engine** before anything else runs (Canon §8). Prompt assembly for Steps 2 and 5 goes through the **Prompt Builder** with the Constitution layer attached — no raw model access (Canon §6).

---

## 8. Measuring TTFU without gaming it

- We timestamp first launch and the Step 5 coaching turn; the raw delta is the mechanical TTFU.
- "Feeling understood" is inferred conservatively — a lightweight positive signal in the moment (e.g. the user continues, edits their statement approvingly, responds warmly) — and *validated*, not replaced, by the periodic self-report guardrail "the app gets me" (Canon §7).
- We refuse to shorten TTFU by cutting the listening. A fast onboarding that skips understanding optimizes the clock while destroying the thing the clock is a proxy for. If TTFU and the "gets me" guardrail ever diverge, the guardrail wins.

---

## 9. Open questions / What we're deliberately NOT doing

**Open questions:**
- What is the minimum viable Identity Statement quality before Step 5 can land? Is there a floor below which the coaching touch should stay purely affirming rather than reflective?
- How do we detect "the reflection landed" in-session without adding a question that itself becomes friction (and re-inflates TTFU)?
- For a returning user who abandoned onboarding mid-way, do we resume the sequence or restart the *feeling* (re-welcome)? Leaning toward resume-state, re-welcome-feeling.
- Should the tap-to-pick identity starters be personalized/localized, and does that risk steering the user toward an identity that isn't theirs (principle #2 tension)?
- Voice vs. text for identity capture — does voice lower TTFU (more natural) or raise the safety/parsing burden? Needs a spike.

**What we're deliberately NOT doing:**
- **Not** measuring or optimizing completion rate as a success metric (§1).
- **Not** setting goals, showing a dashboard, or gamifying anything during first run (§3).
- **Not** requesting high-trust permissions (calendar, location, contacts) or payment on day one (§4).
- **Not** asking demographic or life-domain surveys (§4).
- **Not** surfacing Insights from a single data point (§3; Canon §8).
- **Not** specifying screens, layout, or navigation — that belongs to `11 iOS Navigation.md`.
- **Not** defining the Identity/Memory model internals — those belong to `03 Human Model.md` and `04 AI Brain.md`.
- **Not** exempting onboarding from Safety or consent gating — ever (§6.2; `15 Constitution.md`).

---

*Cross-links: `00 Canon.md` (vocabulary, principles, engines, metrics), `03 Human Model.md` (Identity/Memory representation), `04 AI Brain.md` (engine orchestration), `07 Coaching Engine.md` (Coaching Moves, move gating), `11 iOS Navigation.md` (visual/nav treatment), `14 Notification Engine.md` (Nudge consent), `15 Constitution.md` (Covenant, safety, consent).*
