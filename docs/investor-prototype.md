# Investor Prototype — The First 10 Minutes

> **Status:** Draft v0.1 — 2026-07. **Purpose:** a single, narrow, throwaway-quality artifact that proves one claim — *Impulse can understand a human being better than any app they have ever used* — in the time an investor will actually give us. **Scope:** onboarding → Human Blueprint only. Nothing else.
>
> **This document does not supersede [`05 Onboarding.md`](05%20Onboarding.md).** That document specifies production onboarding inside the full nine-engine system. This document specifies a **separate, temporary, single-purpose build** that reuses its psychology (Present/Future Self framing, identity-over-goals, consent-as-gate, understand-before-advise) but intentionally strips its infrastructure. Where the two disagree on scope, this document wins *for the prototype only*; where they disagree on principle (tone, consent, no personality-typing), [`15 Constitution.md`](15%20Constitution.md) wins, always, even here. That constraint is not a compliance tax on this prototype — it is why the demo works. An investor who has sat through a hundred apps can smell a system that's cold-reading them. The moment the Blueprint asserts something about the user instead of *reflecting their own words back with unsettling precision*, the magic breaks. Evidence-discipline and demo-magic point the same direction here.
>
> **Frontend update — 2026-07.** §6 originally specified a Swift/SwiftUI client and §7 a Swift build roadmap, and `prototype/ios/` was built out fully against them (Welcome through Understanding Confirmation, "Demo Polish Mode"). That Swift build is now frozen as the **design specification** — screens, copy, timings, psychology — not the shipped app. The **active build** is `prototype/expo/` (React Native + Expo), chosen so the demo runs on a physical iPhone via Expo Go / EAS Build with no Mac anywhere in the workflow (GitHub → Codespaces → Claude Code → Expo → EAS → iPhone). This is a frontend-technology change only: the psychology, the eight questions, the Human Blueprint schema, and the backend below are unchanged and reused as-is. §6's stack section and §7's roadmap are left below as historical record of what `prototype/ios/` was built against; for the active implementation's architecture and milestone status, see [`prototype/expo/README.md`](../prototype/expo/README.md).

---

## 0 · The one sentence this whole document serves

**Eight spoken questions, ~90 seconds of thinking, and a page the user did not expect that makes them say "that's exactly me."**

Everything below either serves that sentence or it gets cut. Per the brief's own test: *if removing a screen still leaves the investor believing Impulse understands the user, remove it.* Four screens survive that test. Not more.

---

## 1 · Investor Demo Story

A live, in-person demo, phone in the investor's hand or the founder's, ~10 minutes, no slides before it. The founder says almost nothing during the flow — the product has to do the talking. Silence from the founder is itself part of the pitch: it signals confidence that the thing works unaided.

| Time | What happens on screen | What the investor feels | What the demo subject feels |
|---|---|---|---|
| 0:00–0:15 | Founder hands over the phone. One screen: a dark, calm background, a single line — *"Before we begin — who are you becoming?"* — and one button, **Begin**. No logo wall, no feature list, no "welcome to Impulse!" | Mild skepticism — *another onboarding.* Braces for a form. | Curiosity. The question is personal, not transactional. |
| 0:15–0:45 | One consent screen. Plain English, one paragraph: what's recorded (voice, transcribed to text), why (to answer well), how to delete it (one tap, anytime). One switch, on by default, one **Agree & begin** button. | Notices the brevity — most apps bury this in six paragraphs no one reads. Small trust deposit #1. | Doesn't feel harvested. Feels asked. |
| 0:45–2:30 | Voice conversation begins. A soft orb breathes while listening; a live transcript scrolls underneath as the subject speaks. Two questions land here — a proud moment, a moment of regret (§2, Q1–Q2). No text input anywhere. | This isn't a chatbot with a mic bolted on — it's paced like a real conversation: a pause after the answer, a one-line acknowledgment before the next question, never a canned "Got it!" | Slight vulnerability, then relief — nothing judgmental came back. |
| 2:30–4:30 | Two more questions — the future Tuesday, the gap (§2, Q3–Q4). Mid-transcript, on a specific phrase the subject just said, a soft underline appears for half a second — barely noticeable, deliberately restrained — then fades. | This is the one manufactured "magic trick" in the demo: proof, without a popup or a toast, that *something is listening for signal, not just recording audio.* Investors who notice it ask about it unprompted — that question is the best possible outcome of this demo. | No visible reaction — the underline is for the investor's eye, not the subject's attention. |
| 4:30–6:00 | Three sharper questions — decision-making at their best/worst, the specific trigger, self-talk after a slip (§2, Q5–Q7). | Notices the questions are getting *more specific*, not more generic — this doesn't read like a personality quiz. Starts to suspect the questions themselves were designed by someone who understands behavior change, not just someone who wanted more data fields. | Answers get a little more candid — the questions have earned it by not judging the first five. |
| 6:00–6:45 | Final question: *"What should I never do, as your coach?"* (§2, Q8). | The turn. This is the moment an investor stops thinking "onboarding" and starts thinking "this product respects the user's authority over it." Most competitors never ask this question at all. | Feels like the product just handed back control, not asked for more. |
| 6:45–7:15 | A single transition screen. No spinner theatrics, no fake "Analyzing your personality..." copy. One line, calm: *"Thinking about what you told me."* Real latency underneath (§6), not padded. | A sophisticated investor has seen fake loading screens before and distrusts them. The absence of one is itself a signal of taste. | Anticipation, not anxiety — the tone stayed calm through the wait. |
| 7:15–9:30 | The Human Blueprint (§5) reveals, one section at a time, scroll-paced — title, then the opening line in the subject's own words, then the Gap narrative, then 2–4 Identity Statements each sitting on a direct quote from what they said, then one gently-worded Pattern Noticed, then the boundary they set at 6:00 reflected back verbatim, then a closing line. | **The target reaction.** Not "wow, AI" — investors are numb to that. The target is quieter and stronger: the investor reads a stranger's transcript-derived page and thinks *"if this is real, every coaching app I've seen is now obsolete."* | Reads their own words assembled into something they didn't write but instantly recognize. The described target reaction is *"that's exactly me."* |
| 9:30–10:00 | Founder, one line, no slide: *"Eight questions. Ninety seconds of thinking. Now imagine this compounding every day for a year."* Stop talking. | Whatever they say next is the read on the meeting. | — |

**What this demo is not trying to do:** prove retention, prove the coaching actually changes behavior, prove the AI adapts over time, or prove this scales past one user on one phone. It proves exactly one claim, stated in §0. Anything added to "also prove" something else dilutes the ten minutes an investor will actually give it.

---

## 2 · Complete Onboarding Flow

**Design constraints, stated once so they don't need repeating per screen:** voice-first (typing is a fallback, never the primary path), one question visible at a time, no progress bar with a number (a number turns a conversation into a task list — a subtle animated dot trail is the most that's allowed), no back button mid-conversation (this is a conversation, not a form you correct), every transition is a soft crossfade/breathe, never a hard cut or a slide-left (slide-left reads as "next form field").

### Screen 1 — Welcome (cold open)
- **What's on it:** Dark, calm gradient background (matches Canon's Present/Future Self palette — see [`02 Product Philosophy.md`](02%20Product%20Philosophy.md) if a visual language already exists there; otherwise default to low-saturation dusk tones, nothing clinical/white). One line of text, typewriter-paced (not instant): *"Before we begin — who are you becoming?"* One button: **Begin**.
- **Animation:** the line types in over ~2 seconds, then a 1-second pause before the button fades in. The pause is deliberate — it's the first moment the product asks the user to sit with a question instead of react to a UI.
- **Interaction:** tap Begin → crossfade to Screen 2.
- **Why it exists:** sets the Present-Self/Future-Self frame from Canon before a single data point is collected — the user should feel the *topic* (who they're becoming) before the *mechanism* (a conversation) starts.

### Screen 2 — Consent
- **What's on it:** One paragraph, plain language: *what* is recorded (your voice, transcribed to text), *why* (so I can actually understand what you tell me), *what happens to it* (stored, encrypted, deletable in one tap, never sold — Covenant language, not legal boilerplate). One toggle (on by default): "Use my voice." One button: **Agree & begin**. A visible, tappable "What exactly do you know about me?" link that goes nowhere in the prototype but is present because the Covenant's transparency principle ("what do you know about me and why") should be *visible*, even if the destination is a stub — see §6 open questions.
- **Interaction:** tap Agree → OS microphone permission prompt → crossfade to Screen 3.
- **Why it exists:** consent-as-gate ([`15 Constitution.md`](15%20Constitution.md)) is non-negotiable even in a throwaway prototype; it is also, pragmatically, the second trust deposit in the demo story (§1, 0:15–0:45).

### Screen 3 — Conversation (one reusable screen, eight passes)
- **What's on it:** A voice orb, center, with three states — *listening* (soft pulsing breathe, ~4s cycle), *thinking* (tighter, faster pulse, ~1s cycle, used only during the AI's per-answer signal extraction, §4), *speaking* (orb brightens in sync with the coach's spoken question, using amplitude of the TTS audio, not a generic loop). Below the orb, a live transcript: the coach's question appears first (spoken + captioned, so it works with sound off), then the user's answer transcribes live as they speak, word by word, using on-device speech recognition (§6).
- **The eight questions**, in fixed order for the prototype (dynamic branching is explicitly out of scope — see §7):

  1. *"Tell me about a moment recently when you did something you were proud of — not a big thing. Just a moment you felt like yourself."*
  2. *"Now tell me about a moment you wish had gone differently. No judgment — just what happened."*
  3. *"If your life five years from now looked exactly the way you hoped, what would a random Tuesday look like?"*
  4. *"What's actually standing between today and that Tuesday?"*
  5. *"When you're at your best making a hard decision, what does that look like? And at your worst?"*
  6. *"Is there a specific time of day, or a specific feeling, when you're most likely to slip?"*
  7. *"How do you talk to yourself after you slip up?"*
  8. *"Last one. What should I never do, as your coach?"*

- **Between-question beat:** after each answer, before the next question, a one-line spoken acknowledgment drawn from a small fixed set matched to answer *length and pause*, not content (e.g., *"Thank you for that."* / *"I hear you."* / silence with just the orb settling) — never a paraphrase-back at this stage (paraphrasing belongs to the Blueprint, at the end, where it lands with full weight instead of being spent eight times).
- **The micro-interaction (demo story 2:30–4:30):** on questions 3–7, when a structured-output extraction call (§4) returns a signal with confidence "clear" (not "emerging"), the exact phrase in the live transcript that produced it gets a soft 400ms underline-and-fade. This is the only place in the entire flow where the system visibly shows its work mid-conversation.
- **Fallback:** a small, low-contrast "type instead" link stays available the whole time (accessibility + noisy-room reality) but is never suggested by the UI.
- **Why each question exists:** §3.

### Screen 4 — Thinking (transition)
- **What's on it:** Orb only, centered, slow single pulse. One line, fades in after ~2 seconds so it doesn't read as instant/fake: *"Thinking about what you told me."*
- **Duration:** real latency of the synthesis call (§6), not simulated — target 8–20 seconds. If the call is slower, the copy is allowed one (and only one) secondary line after 15s: *"Still with you."* Never a percentage, never a fake progress bar — see demo story 6:45–7:15 for why this restraint is the point, not a limitation.
- **Why it exists:** it is the pause before the climax. Removing it and cutting straight to the Blueprint was tested against the cut-test (§0) and *fails* it — without a beat of anticipation, the Blueprint reads as pre-written rather than derived, and the "that's exactly me" reaction weakens measurably in early informal readthroughs. This is the one screen in the whole flow that exists purely for pacing, not for data or consent — and it survives the cut only because pacing is load-bearing for the demo's emotional arc.

### Screen 5 — The Human Blueprint
Full design in §5. Scroll-revealed, one section fading in ahead of the scroll position, never all-at-once.

**Screens deliberately cut** (named so the omission is a decision, not an oversight): a name/photo/basic-info screen (the conversation itself establishes who they are; asking "what's your name" first would open with a form field, exactly what §0 forbids — the name is asked for conversationally if needed, or the demo persona is pre-seeded); a goal-selection screen (goals-first contradicts identity-first, per [`03 Human Model.md`](03%20Human%20Model.md) and the existing [`05 Onboarding.md`](05%20Onboarding.md) design); a notification-permission screen (notifications are explicitly out of scope, §6); any screen that shows the Alignment construct as a number or grade (Canon forbids this outright, and it would also just be a worse, colder version of the Blueprint).

---

## 3 · Question Strategy

Every question earns its place by extracting one specific signal that maps to one specific piece of the existing Human Model ([`03 Human Model.md`](03%20Human%20Model.md)) and unlocks one specific future coaching capability. None of these are asked to be interesting; each is asked because the underlying mechanism has research backing in this corpus (`research/`), tagged with its evidence tier per [`research/00 Method & Evidence Standard.md`](../research/00%20Method%20&%20Evidence%20Standard.md).

| # | Question | Signal extracted | Human Model component | Future capability it enables | Evidence basis |
|---|---|---|---|---|---|
| 1 | Proud moment | Values *in action*, not values stated abstractly — what "being myself" felt like, concretely | `values[]`, `virtues[]` (Identity) | Nudge copy that reinforces an already-lived value instead of a generic one | Values-in-action elicitation outperforms abstract values checklists for identity accuracy — `research/01 Human Motivation.md` (identity-based motivation, §4, tier C as popular-form but the underlying elicitation logic is `[B]`) |
| 2 | Regret moment | Present-Self / Impulse Moment pattern: the trigger, the emotional state, the self-talk that followed | Seeds `EmotionSignal` shape, seeds the Gap | Emotion Engine's future context-cue library; Recovery Engine's baseline read of this user's self-talk severity | Cue specificity is the strongest predictor of behavior-change technique success — `research/08 Behavior Change Models.md` (Implementation Intentions, d≈0.65, tier A/B) |
| 3 | Future Tuesday | Future Self narrative, concretized as a scene, not a slogan | `future_self_narrative` (Identity) | Any future feature that needs a *specific*, not generic, picture of the life being pursued | Concrete future-scene elaboration (mental contrasting / MCII) improves goal pursuit over abstract goal statements — `research/08`, tier B |
| 4 | The gap | Perceived barrier, and whether it's framed as internal ("I get in my own way") or external ("time," "other people") | Feeds Decision Engine's future framing logic — internal vs. external attribution changes which Coaching Move would land | Decision-frame calibration (not built in this prototype, but the signal is what would feed it) | Attribution style is a well-established moderator of self-efficacy interventions — `research/01`, self-efficacy §5, tier B |
| 5 | Best/worst decisions | Self-model of dual-process awareness — does the person already recognize hot/cold state shifts in themselves? | Decision Engine's future starting prior on this user's self-awareness | Determines whether future coaching can lean on the user's own vocabulary for state-shifts or has to build it from scratch | Dual-process/hot-cold empathy gap framing — `research/02 Decision Science.md`, tier B |
| 6 | Trigger specificity (time/feeling) | An if-then-ready cue: *when X, I'm likely to Y* | Directly the raw material for a future Implementation Intention | The single highest-evidence lever in the entire behavior-change corpus — this question exists to make it possible later, not to use it now | Implementation intentions, d≈0.65 — `research/08`, tier A/B, "the strongest single-technique evidence" in that review |
| 7 | Self-talk after slipping | Lapse construal style — does a slip get treated as data or as a verdict on the person? | Directly informs Recovery Engine's tone calibration prior, and is the single clearest signal for whether banned-word tone-lint needs to work *harder* for this specific user | Abstinence-violation effect: lapse construal governs relapse — `research/08`, Relapse Prevention Model, tier B |
| 8 | Boundary ("never do") | Explicit, user-authored consent scope in their own words, not a checkbox category | Operationalizes consent-as-gate with content instead of a legal toggle | Any future proactive/Nudge system's first, user-authored guardrail | Not a research-evidence question — a Constitution/Covenant requirement (`15 Constitution.md`, consent-as-gate) made experiential instead of legal |

**What was deliberately not asked**, and why cutting it survives §0's test: demographic fields (age, gender, occupation) — no predictive value demonstrated in this corpus and directly conflicts with [`03 Human Model.md`](03%20Human%20Model.md)'s "no demographic/protected-attribute modeling" rule; a stated primary goal — goals-first was rejected by the existing onboarding design for identity-first reasons that still hold; a mood/stress check-in — real signal, but adds a screen without adding to the *understanding* claim this prototype exists to prove (it would matter for a coaching-effectiveness demo, which this explicitly is not, §0 preamble).

---

## 4 · AI Reasoning — What the System Learns From Each Answer

Per [ADR 0002](../adr/0002-llm-as-tool-not-brain.md), the LLM is a scoped tool, not the decision-maker — even here. Two distinct model calls do the work, and the boundary between them matters for both cost and for staying honest about what's inference versus what's the user's own words:

1. **Per-answer extraction** (runs after each of the 8 answers, during the brief "thinking" pulse on Screen 3) — a small, fast, structured-output call (Haiku-tier, per [ADR 0006](../adr/0006-tiered-claude-models.md)) that takes the raw answer and returns zero or more `SignalExtraction` objects: `{signal_type, content, quote, confidence_label}` where `quote` is a verbatim substring of what the user said (this is the enforcement mechanism for "reflect, don't invent" — a signal with no verbatim quote backing it is dropped, not shown). `confidence_label` is qualitative — `emerging` or `clear` — never a percentage, consistent with Canon's ban on exposing Alignment-style numeric scores to a psychological claim.
2. **Final synthesis** (runs once, during Screen 4) — a deeper, structured-output call (Sonnet or Opus tier depending on measured latency in testing, per ADR 0006) that takes *all* accumulated `SignalExtraction` rows plus the raw transcript and returns one `BlueprintOutput` object (schema in §5). This call is explicitly instructed — as a hard constraint in the prompt, not a hope — to only assert what a `SignalExtraction.quote` supports, and to phrase the one `pattern_noticed` field as an observation ("you mentioned... twice") rather than a label ("you're avoidant").

What each answer plausibly contributes (stated with the same hedging discipline as the research corpus — this is a hypothesis about signal, not a proven pipeline):

| After answer | What the extraction call is looking for | What confidence *should* shift | What in the Blueprint this can change |
|---|---|---|---|
| Q1 (proud moment) | A stated or implied value word/phrase | Emerging confidence on 1 candidate value | Seeds one Identity Statement candidate |
| Q2 (regret) | Trigger, emotion word, self-talk framing | Emerging confidence on Gap material | Seeds the Gap narrative's "what gets in the way" half |
| Q3 (future Tuesday) | Concrete scene detail (people, place, feeling) | Clear confidence on Future Self narrative | Populates `future_self_narrative` / opening line |
| Q4 (the gap) | Barrier language, attribution style | Clear confidence on Gap narrative | Completes the Gap narrative's "what's actually in the way" half |
| Q5 (best/worst decisions) | Self-awareness vocabulary | Emerging confidence — this rarely stands alone as a Blueprint line; it mostly *shapes tone*, not content | Adjusts how directly the synthesis call is allowed to phrase the pattern-noticed line |
| Q6 (trigger specificity) | A concrete cue (time/place/feeling) | Clear confidence if specific, emerging if vague | Strongest candidate for `pattern_noticed` |
| Q7 (self-talk after slipping) | Harsh vs. self-compassionate framing, verbatim | Clear confidence on tone calibration | Sets the register of the closing affirmation (never contradicts what the user just showed about how they talk to themselves) |
| Q8 (boundary) | A verbatim boundary statement | Not a confidence question — this is stored and reflected back exactly, unparaphrased | Populates `boundary_statement` verbatim — the one Blueprint field that is a quote, not a synthesis |

**Explicitly not claimed:** that this pipeline produces a *validated* psychological read of anyone. It produces a well-evidenced-feeling, quote-anchored reflection of eight answers. The gap between "feels accurate" and "is a validated instrument" is exactly the gap [`research/00 Method & Evidence Standard.md`](../research/00%20Method%20&%20Evidence%20Standard.md) and [`decisions/0005-product-never-outruns-evidence.md`](../decisions/0005-product-never-outruns-evidence.md) exist to police, and it applies to this prototype too — see §7's claim boundaries.

---

## 5 · The Human Blueprint

The climax. Design target: **beautiful, personal, and — most importantly — every claim on the page traces to something the user actually said**, visibly, without the page feeling like a citation list.

### Structure (top to bottom, one section reveals per scroll-step)

1. **Title** — not "Your Profile" or "Your Results." A single warm phrase generated from the Future Self material, e.g. *"Who Maya Is Becoming"* — the user's name (or however they introduced themselves) plus the Future Self frame from Screen 1, closing the loop the app opened with.
2. **Opening line** — one sentence, drawn near-verbatim from Q3, italicized, presented like a quote from the user, not a claim about them: *"A random Tuesday, five years from now — coffee before anyone else is awake, a job that doesn't leave you hollow by 6pm, and enough patience left over to actually be present at dinner."*
3. **The Gap** — a short narrative paragraph (3–4 sentences), synthesizing Q2 and Q4, always in the frame of *what's true right now*, never *what's wrong with you*: names the barrier the user named, in their words, and the moment-pattern from Q2, without moralizing language (banned-word list from Canon applies here at full force — a lint pass, §6, checks this before render).
4. **Identity Statements** — 2 to 4 cards, each: a short "I am someone who…" line (Canon vocabulary — this is literally the `identity_statements[]` field from [`03 Human Model.md`](03%20Human%20Model.md)) and, beneath it in smaller, quieter type, the exact quote it came from and which question it came from (e.g., *"— from what you told me about [the proud moment]"*). The quote-attribution is not a legal footnote; it is the single biggest driver of the "that's exactly me" reaction, because it proves the line wasn't templated.
5. **Pattern Noticed** — exactly one card (not three, not five — one, stated with the confidence its evidence deserves). Framed as an observation with a built-in exit: *"You mentioned [trigger] twice — once talking about [Q2] and once about [Q6]. That might be worth noticing."* Never framed as a diagnosis, a label, or a percentage.
6. **What Coaching Could Look Like** — a single line, explicitly a *preview*, not advice delivered now (this respects the understand-before-advise gate in [`07 Coaching Engine.md`](07%20Coaching%20Engine.md) — Reframe/Contrast/Commit-type moves are structurally out of reach this early even in the prototype's simulated version of that gate): *"Next time it's 9pm and you're reaching for the thing you told me about — that's exactly the moment I'd want to be there."*
7. **The Boundary** — the Q8 answer, reflected back verbatim, with a single confirming line: *"You said: '[verbatim]'. I'll hold that."* This is deliberately the second-to-last section, not buried early — it is the strongest trust beat in the whole document and lands best right before the close.
8. **Closing affirmation** — one warm, specific, non-generic sentence, tonally calibrated by Q7 (never more upbeat than the user's own self-talk register), no emoji, no exclamation-point enthusiasm.
9. **Transparency footer** (small, always visible, not a modal) — *"Built from what you told me, and nothing else. Tap here to see exactly which answer shaped which line."* Even in the prototype, this exists because the Covenant's transparency principle should be demonstrably true, not just claimed — see §6 for the honest scope of what this link actually does in one week.

### Worked example (fictional demo persona, "Maya")

> **Who Maya Is Becoming**
>
> *A random Tuesday, five years from now — coffee before anyone else is awake, a job that doesn't leave her hollow by 6pm, and enough patience left over to actually be present at dinner.*
>
> Right now, most of that patience gets spent before 6pm even arrives. Maya described a familiar pattern — a hard day, a string of small decisions made on no sleep, and a 9pm moment where the version of herself she's proud of and the version that's exhausted are pulling in different directions. She was clear that the job isn't the enemy — the gap is what's left of her by the time she gets home.
>
> **I am someone who shows up even when it's inconvenient.**
> — from what you told me about staying late to help a teammate hit a deadline, on a night you'd already planned to leave early.
>
> **I am someone who is trying to stop treating rest like a reward I haven't earned yet.**
> — from what you told me about the Tuesday five years from now.
>
> *You mentioned "9pm and wired" twice — once about a hard night, once about when things are most likely to slip. That might be worth noticing.*
>
> Next time it's 9pm and wired — that's exactly the moment I'd want to be there.
>
> You said: *"Don't ever make me feel behind. I already know."* I'll hold that.
>
> You're not behind. You're just further from Tuesday than you'd like to be tonight — and you already know exactly what Tuesday looks like. That's more than most people ever get to.

This example is illustrative only — it is not a template to be filled with mad-libs; the synthesis prompt (§4) generates prose, not slot-fills, constrained to verbatim-quote backing.

---

## 6 · Prototype Architecture

**Governing rule: single user, single onboarding session, single AI generation call chain, no persistence beyond what the demo itself needs, no engine topology.** This is a deliberate, documented deviation from [`12 Backend Architecture.md`](12%20Backend%20Architecture.md)'s modular-monolith/nine-engine design (per [Documentation Rule 13](../.rules/documentation.md), the deviation and its reason are stated here, once): building the real Coach Engine, Safety Engine, and Memory Engine to demo eight questions would cost weeks the mission explicitly says we don't have, and none of their guarantees (long-term memory, cross-session adaptation, proactive Nudging) are things this prototype claims to prove.

### Stack
- **iOS (design spec only — see frontend update above):** Swift + SwiftUI, matching Canon's stack choice. **Not** the full MVVM+Coordinator app shell from [`11 iOS Navigation.md`](11%20iOS%20Navigation.md) — a single lightweight Coordinator (§ screen hierarchy below) reusing the *pattern* (Views are dumb, Coordinator owns routing) without building the Today/Reflect/Self tab structure, since this prototype has no tabs. `prototype/expo/` ports this same Coordinator pattern (a phase-switch component, no navigation stack) directly onto React Native + Expo Router — see [`prototype/expo/README.md`](../prototype/expo/README.md) for its actual, current architecture.
- **Backend:** Supabase (hosted Postgres + pgvector extension, Auth, Edge Functions) instead of the full FastAPI modular monolith in [`12 Backend Architecture.md`](12%20Backend%20Architecture.md). This keeps the DB choice canon-compatible (Postgres + pgvector, per Canon's stack) while trading the custom backend for a managed one — the right trade when the entire backend's job for one week is "store 8 answers, call Claude twice, return a JSON object."
- **AI:** Anthropic Claude via the same tiering logic as [ADR 0006](../adr/0006-tiered-claude-models.md) — Haiku 4.5 for per-answer extraction, Sonnet 5 or Opus 4.8 for final synthesis (bench both for the 8–20s latency target in §2 Screen 4 and pick whichever hits it without a visible quality drop). Both calls go through a minimal Prompt Builder analog (§ AI prompt flow below), never a raw model call from the client — this one architectural guarantee from [ADR 0002](../adr/0002-llm-as-tool-not-brain.md) is cheap to keep and important not to cut.
- **Voice in (STT):** Apple's on-device Speech framework. Free, fast, offline-capable, zero extra vendor risk for a one-week build — the quality bar for this demo is on the AI's *questions and the Blueprint*, not on transcription accuracy, so on-device STT is sufficient. `prototype/expo/` keeps this same on-device-first decision (`expo-speech-recognition`, wrapping the same iOS `SFSpeechRecognizer`) but that package needs a Development Build to run — it's a custom native module, unavailable in Expo Go — so the Expo build additionally ships a typed-answer fallback that's live whenever a Development Build isn't. See `prototype/expo/README.md`'s "Voice strategy" section for the full reasoning, including why cloud transcription (which *would* work in Expo Go) was rejected instead: it would need a second backend endpoint, which conflicts with this document's own one-endpoint rule below.
- **Voice out (TTS):** this is the one place worth spending a real decision. Apple's default system voices will not clear the "ChatGPT Voice" bar the mission sets. Recommend evaluating one premium neural TTS vendor (e.g., ElevenLabs-class) against the 8 fixed questions — since the question script is static for the prototype, all 8 coach lines can be **pre-generated and cached**, turning this from a live API dependency into a one-time asset generation step. This removes an entire class of demo-day risk (network latency, vendor outage) for zero loss of quality. Neither implementation has done this yet — both `QuestionVoicePlayer.swift` and Expo's `useQuestionVoice` hook still speak with the system voice; this remains open in both.

### SwiftUI screen hierarchy (design spec — `prototype/ios/`)

```
InvestorPrototypeApp
└── PrototypeCoordinator (owns navigation; linear flow, no tab bar)
    ├── WelcomeView
    ├── ConsentView
    ├── ConversationView                 (one instance, re-driven by question index)
    │   ├── VoiceOrbView                 (listening / thinking / speaking states)
    │   └── LiveTranscriptView
    │       └── SignalUnderlineModifier  (the 400ms highlight micro-interaction)
    ├── ThinkingView
    └── BlueprintView                    (scrollable; sections below fade in on scroll position)
        ├── BlueprintTitleView
        ├── OpeningLineView
        ├── GapNarrativeView
        ├── IdentityStatementCardView    (repeated, 2–4x)
        ├── PatternNoticedCardView
        ├── CoachingPreviewLineView
        ├── BoundaryStatementView
        ├── ClosingAffirmationView
        └── TransparencyFooterView
```

No `ViewModel` layer beyond one `OnboardingSessionStore` (an `@Observable` object the Coordinator owns and injects) — a full MVVM-per-screen setup is overhead this build doesn't need at one screen's worth of real complexity (ConversationView). State: current question index, live transcript buffer, accumulated signals, blueprint result, all in-memory plus a Supabase write after each step for durability (so a demo isn't lost to an app backgrounding).

### Backend endpoints (Supabase Edge Functions)

| Endpoint | Does | Model call |
|---|---|---|
| `POST /onboarding/start` | Creates a `demo_users` row + a `onboarding_sessions` row | none |
| `POST /onboarding/answer` | Stores raw answer text in `onboarding_answers`; runs the per-answer extraction; writes rows to `blueprint_signals` | Haiku 4.5, structured output |
| `POST /onboarding/complete` | Reads all `onboarding_answers` + `blueprint_signals` for the session; runs the synthesis call; writes one `human_blueprints` row | Sonnet 5 / Opus 4.8, structured output |
| `GET /blueprint/:session_id` | Returns the `human_blueprints` row for rendering | none |

Deliberately absent: auth beyond a single demo-mode Supabase anonymous session (no real account system — out of scope), any endpoint for editing/re-answering (the prototype is one linear pass), any endpoint that touches notifications, memory retrieval, or Nudging (out of scope per the mission).

### Supabase tables

```sql
demo_users (
  id uuid primary key,
  display_name text,
  created_at timestamptz default now()
)

onboarding_sessions (
  id uuid primary key,
  demo_user_id uuid references demo_users(id) on delete cascade,
  started_at timestamptz default now(),
  completed_at timestamptz,
  status text check (status in ('in_progress','completed'))
)

onboarding_answers (
  id uuid primary key,
  session_id uuid references onboarding_sessions(id) on delete cascade,
  question_key text,        -- e.g. 'proud_moment', 'regret_moment', ...
  question_text text,
  answer_text text,
  order_index int,
  answered_at timestamptz default now()
)

blueprint_signals (
  id uuid primary key,
  session_id uuid references onboarding_sessions(id) on delete cascade,
  source_answer_id uuid references onboarding_answers(id) on delete cascade,
  signal_type text check (signal_type in
    ('value','gap_barrier','future_scene','decision_style','cue','self_talk','boundary')),
  content text,
  quote text,                -- verbatim substring of the source answer — enforced, not optional
  confidence_label text check (confidence_label in ('emerging','clear')),
  created_at timestamptz default now()
)

human_blueprints (
  id uuid primary key,
  session_id uuid references onboarding_sessions(id) on delete cascade,
  title text,
  opening_line text,
  gap_narrative text,
  identity_statements jsonb,   -- [{statement, quote, source_question_key}]
  pattern_noticed text,
  coaching_preview_line text,
  boundary_statement text,
  closing_affirmation text,
  model_used text,
  generated_at timestamptz default now()
)
```

Table naming (snake_case plural) matches [`08 Database Architecture.md`](08%20Database%20Architecture.md)'s convention even though these are prototype-scoped tables, not the canon `identities`/`users` aggregates — deliberately named `demo_users`/`onboarding_*`/`blueprint_*` rather than reusing `users`/`identities` so nothing in this throwaway schema is mistaken for production data later, and so a future real migration isn't tempted to "just keep" a table that was never designed for multi-engine ownership rules.

### AI prompt flow

Mirrors the 5-layer convention in [`13 Prompt Architecture.md`](13%20Prompt%20Architecture.md), collapsed to what a 2-call, 1-week pipeline needs:

**Call 1 — Signal extraction (Haiku 4.5, runs after each answer)**
1. *System layer* (static, cacheable): tone rules — warm, non-clinical, never a personality label, never a percentage; extraction rules — every returned signal must include a verbatim `quote` substring of the input or it must not be returned at all.
2. *Task context*: which question this is, its `question_key`.
3. *User input* (fenced, untrusted): the raw transcribed answer.
4. *Requested output*: `SignalExtraction[]` — structured output only, schema as in §4/§6 tables above.

**Call 2 — Blueprint synthesis (Sonnet 5 / Opus 4.8, runs once at Screen 4)**
1. *System layer* (static, cacheable): the full tone and evidence-discipline contract — banned-word list reused verbatim from Canon, the "reflect don't invent" constraint, the instruction that `pattern_noticed` must cite the two source signals it's built from, and that `boundary_statement` must be returned unparaphrased.
2. *Task context*: the demo user's display name (if given).
3. *Retrieved material*: all 8 `onboarding_answers` plus all `blueprint_signals` for the session.
4. *Requested output*: one `BlueprintOutput` object matching the `human_blueprints` schema in §6.

**Guardrail (both calls):** a post-generation lint pass against the Canon banned-word list before anything is written to Supabase or rendered. For a one-week build this can reasonably be a simple regex/word-list check rather than the full Haiku tone-lint pass described in [`13 Prompt Architecture.md`](13%20Prompt%20Architecture.md) — noted here explicitly as a scope cut, not an oversight, per Documentation Rule 13. Fail-closed: if the lint fails, re-run the synthesis call once with the violating phrase flagged; if it fails twice, fall back to a plainer, pre-approved template sentence for that field rather than showing banned language on an investor's screen.

---

## 7 · Implementation Roadmap (design spec — `prototype/ios/`, complete)

Five milestones, each independently demoable, sized for a small team working in days, not sprints. No milestone depends on a later one existing to be shown. This roadmap is what `prototype/ios/` was built against, in full ("Demo Polish Mode"), and stays here as the historical record.

The active `prototype/expo/` rebuild follows its own six-milestone sequence (Welcome → Conversation → Thinking → Blueprint → The Promise → Understanding Confirmation) — see [`prototype/expo/README.md`](../prototype/expo/README.md) for what's shipped and what's next; that file is the current source of truth for build status, not this section.

**Milestone 1 — "It listens and it's warm" (day 1–2)**
Welcome → Consent → Conversation screens, all 8 questions hardcoded and voice-driven (pre-generated TTS audio per §6, on-device STT for capture), transcript UI complete, no AI extraction yet — answers just get stored. Demoable: *"watch it have a real conversation with you."*

**Milestone 2 — "It's actually listening" (day 2–3)**
Wire the per-answer Haiku extraction call; add the mid-conversation underline micro-interaction. Demoable: milestone 1 plus the one visible proof of signal-capture (§2, the underline beat).

**Milestone 3 — "The Blueprint exists" (day 3–5)**
Thinking screen + synthesis call + BlueprintView, static (no scroll-reveal choreography yet), using the worked example structure from §5 as the schema target. Demoable: the full ten-minute arc, end to end, for the first time — this is the milestone where the founders should run the demo on themselves and each other before showing anyone external.

**Milestone 4 — "It's beautiful" (day 5–6)**
Scroll-paced section reveals on BlueprintView, orb states polished, transitions crossfaded per §2's constraints, transparency footer wired to a simple static "here's which answer fed which line" view (even a plain list satisfies the Covenant-transparency beat — it does not need to be elegant, it needs to be *true*).

**Milestone 5 — "It survives a real investor" (day 6–7)**
Dry-run the demo on 3–5 people who are not the founders, cold, with no coaching on what to say. Fix whatever breaks the "that's exactly me" reaction — most likely candidates: a question that reads as generic once heard aloud, a synthesis output that over-claims (violates the verbatim-quote rule), latency on Screen 4 exceeding the 20-second ceiling. Buffer day, not a feature day.

**What "one week" realistically buys:** Milestones 1–4 solid, Milestone 5 as a same-week stretch if the earlier milestones don't slip. The TTS vendor evaluation (§6) and the extraction/synthesis prompt tuning (§4/§6) are the two genuine unknowns that could each eat a day on their own — everything else in this roadmap is assembly of known pieces.

---

## 8 · Claims This Prototype Can Defensibly Support vs. Must Not Make

Consistent with [`research/00 Method & Evidence Standard.md`](../research/00%20Method%20&%20Evidence%20Standard.md) and [`decisions/0005-product-never-outruns-evidence.md`](../decisions/0005-product-never-outruns-evidence.md) — the discipline that governs the research corpus applies here too, because an investor-facing claim that outruns what was actually built is the same failure mode as a research claim that outruns its evidence.

**Defensible:** "Impulse can turn eight spoken questions into a personal reflection the user recognizes as accurate." "Every claim in the Blueprint traces to something the user said, and that trace is inspectable." "The question design draws on specific, cited behavior-change mechanisms (implementation-intention cueing, relapse-construal, values-in-action elicitation)."

**Must not claim from this prototype:** that this demonstrates adaptive coaching, long-term memory, retention, or behavior change (none of that was built or tested — §0 preamble); that the Blueprint is a validated psychological instrument (it is a well-designed reflection exercise, not an assessment — §4 closing note); that this scales to many concurrent users (single-user, single-session by design, §6); that the underlying mechanism improves outcomes (the *questions* have evidence backing for extracting signal; whether *this specific synthesis pipeline* produces durable understanding at scale is untested, same as everything flagged "Unknown" in `research/08`'s and `research/12`'s closing sections).

---

## Open questions / what we're deliberately not doing

- Not solving for a second onboarding session, ever revisiting the Blueprint, or any notion of it updating — one pass, one artifact, done.
- Not building real auth, real account recovery, or multi-device sync.
- Not testing whether the Blueprint's `pattern_noticed` line survives contact with a user who *disagrees* with it — the flow has no correction/edit affordance, which is a real gap relative to the Constitution's evoke-not-impose principle and should be named as a known limitation if this prototype is ever shown to a real (non-planted) user rather than a live demo audience.
- Not deciding the TTS vendor here — flagged in §6/§7 as the roadmap's biggest real unknown, worth a same-day spike before Milestone 1 starts.
- Not addressing what happens after the Blueprint screen — there is deliberately no "continue to app" button, because there is no app behind it yet, and pretending otherwise would be the first claim that outruns what was built.
