# Identity Onboarding — Interaction Choreography v2

> **Status:** Draft v0.2 — 2026-07-14
> **Purpose:** Redesign `IdentityInspirationScreen` as a connected sequence of nine emotional moments — Arrival through Commitment — rather than a screen with polish on top. Where v1 (`docs/identity-onboarding-choreography.md`) fixed motion and keyboard mechanics (PDR 0008/0009), this version adds the missing piece: a next-moment that is *generated from what the user just said*, not fixed in advance.
> **Tier:** Sensitive (identity capture, first LLM-adjacent surface in onboarding — see §9 for the load-bearing safety finding).
> **Scope:** This document is Deliverable 1 of 4. It does not authorize implementation. See `adr/0008-next-moment-engine-architecture.md` (Deliverable 2) and `decisions/0010-next-moment-engine-design-council.md` (Deliverable 3) for the architecture decision and review this choreography must pass before any code is written.

This is one continuous scene, not nine screens. "Moment" names a psychological beat, not a route — several can be visually present at once (the orb and thought stream, for instance, are alive across almost the entire choreography).

---

## 0 · What must be true of every moment

Carried over from v1 and restated because v2 adds a new failure surface (AI generation) that must not violate them:

- **The app never speaks.** No TTS, no reading prompts or responses aloud. State is communicated visually — orb, typography, motion — silently, unless a future feature explicitly opts into audio.
- **The user is always the author.** Spoken and typed text is verbatim, always. The AI may *offer* language; it may never *decide* language and present it as the user's own without an explicit accept action.
- **Every animation answers "what does this communicate,"** never "does this look impressive" (v1's rule, unchanged).
- **The AI produces a next *moment*, not a next *message*.** A `GeneratedMoment` (see the ADR) selects among a small, closed, deterministic set of UI templates — it cannot inject arbitrary freeform UI, and it cannot itself decide to skip a safety check.

---

## 1 · MOMENT — Arrival

| Field | Value |
|---|---|
| **Approx. timing** | 0.0s–2.0s from screen mount |
| **Psychological purpose** | Establish calm before any demand. Signal "this is not a form" in the first two seconds, before a single word of copy is read. |
| **Visible UI** | Gradient background, orb only. No title text yet. No keyboard. No mic emphasis. No Continue button anywhere in the tree. |
| **Available actions** | None. This moment has no interactive surface by design. |
| **Copy** | None. |
| **Animation** | Orb fades and scales in from 0.9→1 over 400ms; breathing begins immediately after and never stops for the rest of the screen's life. |
| **Orb state** | `idle` — slow breathing, ~4000ms cycle. |
| **Keyboard state** | Hidden, and cannot appear — no focusable element exists yet. |
| **Microphone state** | Not yet rendered. |
| **AI activity** | None. |
| **Transition trigger** | A fixed, deliberate pause (~900ms after the orb settles) — not a user action. This is the one moment in the whole choreography with a timer-driven, not user-driven, exit, because its entire purpose is to *not* ask for anything yet. |
| **Expected user emotion** | Presence — "I'm here, nothing is being asked of me yet." |
| **Accessibility fallback** | VoiceOver: the screen announces nothing yet either — a screen reader user gets the same held silence, then Curiosity's title becomes the first announced content (a screen reader shouldn't "hear" a pause the way a sighted user "sees" one, but it also shouldn't be handed content before a sighted user is). Reduce Motion: the fade/scale-in becomes an instant opacity swap; the held silence (the 900ms pause) is unaffected, since it's about pacing, not motion. |
| **Failure/recovery** | None applicable — nothing can fail in a moment with no interaction. |
| **Rationale** | v1 already got the orb breathing from mount; v2's contribution is naming this as its own moment with a protected no-content window, so a future engineer doesn't "fix" the pause by front-loading the title to appear instantly. |

---

## 2 · MOMENT — Curiosity

| Field | Value |
|---|---|
| **Approx. timing** | ~2.0s–3.5s |
| **Psychological purpose** | Introduce the core question as an invitation, not a prompt on a form field. |
| **Visible UI** | Title text fades in above the (still-breathing) orb. Nothing else yet — no thought stream, no mic, no card. |
| **Available actions** | None yet — reading is the only "action." |
| **Copy** | **"Who are you becoming?"** — confirmed change from v1/PDR 0007's "Who do you want to become?"; see rationale below. |
| **Animation** | Title fades in over 400ms, no slide, no bounce. |
| **Orb state** | `idle`, unchanged. |
| **Keyboard state** | Hidden. |
| **Microphone state** | Not yet rendered. |
| **AI activity** | None. |
| **Transition trigger** | A second, shorter deliberate pause (~600ms) after the title settles, then Inspiration's thought stream begins fading in — not a user action. |
| **Expected user emotion** | Curiosity, not pressure — the question has room to land before anything else competes for attention. |
| **Accessibility fallback** | VoiceOver: title has `accessibilityRole="header"` (unchanged from v1) and is the first thing announced. Reduce Motion: fade becomes instant. |
| **Failure/recovery** | None applicable. |
| **Rationale** | See below. |

### The copy decision (documented, per instruction, before any change)

**Reviewed:** "Who do you want to become?" (current, PDR 0007-approved).

**Concern raised:** "want to become" presupposes a gap between who the user is and who they wish to be — for a user in a vulnerable place, that can land as "who you are now isn't enough," a mild deficit frame at the exact moment the product is trying to establish it does not shame or diagnose (Canon §2 banned-word spirit, extended to phrasing rather than just banned words).

**Alternatives considered:**
- *"What kind of person do you want to grow into?"* — softer verb ("grow into" vs. "become"), but longer, and doesn't remove the "want to" gap-implication, just cushions it.
- *"What matters most in the person you want to become?"* — rejected outright, not just softened: this shifts the captured content from an **Identity Statement** to a **value**, two different fields in the data model (Canon §5, `identity_statements[]` vs. `values[]`). Changing the question's target field is a data-model change disguised as a copy change and is out of scope here.
- **"Who are you becoming?"** (recommended) — present continuous instead of "want to become." This reframes identity as already-in-motion rather than a wished-for future state the user hasn't reached — the same reframe Dweck's growth-mindset lens and this project's own Identity-over-goals principle (`docs/02 Product Philosophy.md` §1.4) already argue for elsewhere ("Identity compounds... a missed day is one data point against a self-image, not a broken contract"). It keeps the sentence short, keeps it identity-shaped (compatible with the existing thought library and `deriveIdentityStatement` normalization, unchanged), and is a one-string change with no data-model or test-suite impact (`constants/__tests__/thoughtLibrary.test.ts` asserts against the library entries' own shape, not this question string).

**Decision: confirmed.** The founder approved adopting "Who are you becoming?" (superseding PDR 0007's wording for this exact string; PDR 0007's other findings — thought-library remediation, voice-cancel affordance, two-stage confirmation — are unaffected).

---

## 3 · MOMENT — Inspiration

| Field | Value |
|---|---|
| **Approx. timing** | ~3.5s onward, indefinite (ambient — this moment never really "ends," it just stops being the visual foreground once Expression begins) |
| **Psychological purpose** | Reduce blank-page anxiety by making the first move optional and low-stakes — a thought to react to is easier than a cursor in an empty field. |
| **Visible UI** | Thought stream (one bubble at a time, occasional brief overlap — v1's "memories surfacing" motion, kept), plus a quiet "Your Vision" panel below with a Speak affordance and a Type affordance and the explicit framing copy. |
| **Available actions** | Tap a thought · tap Speak · tap Type. All three equally sized, equally styled — none visually primary. |
| **Copy** | "You can speak, write, or tap a thought to begin." Additionally, **new supporting copy recommended** directly under/near the thought stream: *"Borrow a thought, change it, or use your own words."* — makes explicit (per the request) that thoughts are optional inspiration, not the app's expected answer. |
| **Animation** | Thought bubbles: jittered fade-in timing, continuous slow drift for the bubble's full visible lifetime, ~30% chance of a brief overlap with the next bubble (all unchanged from v1/PDR 0009). |
| **Orb state** | `idle`, with a very small one-shot "thought-appearing" pulse each time a new bubble enters (v1, unchanged). |
| **Keyboard state** | Hidden — nothing here can summon it; only the explicit Type action (Moment 4) does. |
| **Microphone state** | Idle mic glyph rendered, not yet active. |
| **AI activity** | None. Thought-library content is static and curated (PDR 0007), not AI-generated. |
| **Transition trigger** | Any of the three actions above — user-driven only, no timer. |
| **Expected user emotion** | Possibility — "there are several easy ways in, and none of them commit me to anything yet." |
| **Accessibility fallback** | Reduce Motion: no drift, no overlap; thought holds indefinitely once shown, remains tappable (v1/PDR 0009, unchanged). **VoiceOver-specific addition for v2**: a rotating, auto-advancing thought is a poor target for VoiceOver's linear swipe navigation even with the existing hold-and-announce behavior (`useThoughtScheduler`'s `screenReaderEnabled` branch) — this document recommends adding a manual "Next thought" advance control, visible only when VoiceOver is running, so a screen-reader user isn't limited to whichever single thought happened to be announced. (New requirement vs. v1 — see the accessibility section, §8.) |
| **Failure/recovery** | If the curated thought library is ever exhausted mid-session (30 entries, no repeats — existing, tested behavior), the stream simply stops rendering; Speak/Type remain fully available regardless. Not a failure state, just an empty ambient layer. |
| **Rationale** | Nothing here changes from v1's implementation — restated as its own moment because v2's choreography must show it in the connected sequence, not just as a component spec. |

---

## 4 · MOMENT — Expression

| Field | Value |
|---|---|
| **Approx. timing** | Begins the instant the user acts (tap a thought / Type / Speak); duration is entirely user-paced |
| **Psychological purpose** | Let the user externalize a thought through whichever channel feels natural, with zero asymmetry between voice and text. |
| **Visible UI** | **Type path:** vision card grows into place (v1's scale/opacity "emergence," unchanged), focused, keyboard visible. **Speak path:** keyboard stays hidden; mic shrinks slightly; live transcript begins appearing centrally (Moment 5 territory — Expression and Recognition overlap here, deliberately, per "several moments may occur within the same visual scene"). **Thought-tap path:** card grows into place already populated, *unfocused* (v1/PDR 0009's rule: only the explicit Type action auto-focuses). |
| **Available actions** | **Typing:** free edit, tap-outside to dismiss, drag-to-dismiss, iOS "Done Editing" accessory bar, cross-platform "Done editing" text link (all v1, unchanged). **Speaking:** Cancel, Stop (v1, unchanged) — **Record Again is new**, offered once a recording has completed, so re-recording doesn't require first clearing the card. |
| **Copy** | None new — the mic and Type controls remain icon+short-label only, per "reduce instructional text." |
| **Animation** | Card grows (v1, unchanged), mic shrink (v1, unchanged). |
| **Orb state** | `typing` while the keyboard is up; `listening` while recording (v1, unchanged). |
| **Keyboard state** | Only appears via explicit Type action, exactly as PDR 0008/0009 established — v2 does not relax this. |
| **Microphone state** | Idle → `requestingPermission` (only on first intentional tap, never pre-emptively) → `listening` → `processing` → `completed`/`error` (`useSpeechRecognitionAdapter`'s existing state machine, unchanged). |
| **AI activity** | None yet — Expression is capture only; Interpretation (Moment 6) doesn't begin until the user's turn is complete. |
| **Transition trigger** | Typing: Done Editing / tap-outside / drag. Speaking: Stop. Thought-tap: immediate (already "complete" the instant it's tapped, since it's pre-authored content the user is endorsing by selection). |
| **Expected user emotion** | Agency — "I chose how to say this, and I'm not stuck once I've started." |
| **Accessibility fallback** | All v1 mechanisms (VoiceOver escape action on the TextInput, cross-platform Done link, 44×44pt targets) carry forward unchanged. |
| **Failure/recovery** | **Microphone permission denied:** orb shows the `error` tint (soft warm-red, one-shot, no shake); mic control shows its existing retry copy ("Try recording again"); Type and thought-tap remain fully available — denial of one path never blocks the other two. **Transcription error** (on-device recognizer fails mid-capture): same `error` orb treatment; the button's existing error-text surfaces the message; Cancel/retry available, nothing is lost because nothing was saved yet (v1's rule: voice-derived text never persists before Continue). |
| **Rationale** | Mostly v1 preserved; the one addition (Record Again as a first-class, always-offered action rather than "re-tap the mic and hope") responds directly to the request's explicit recovery list. |

---

## 5 · MOMENT — Recognition

| Field | Value |
|---|---|
| **Approx. timing** | Overlaps the tail of Expression; for voice, spans from first partial transcript through the settle animation (~400ms after Stop) |
| **Psychological purpose** | Make the user's own words the unmistakable visual subject — "the app heard exactly what I said," before any interpretation happens. |
| **Visible UI** | Live transcript large and centered (v1, unchanged) during voice capture; the settled vision card afterward, showing the **exact verbatim text** — no rewriting, no normalization, for both voice and typed input. |
| **Available actions** | Same as Expression's settled state: Edit (tap card), Clear, Record Again, Continue (disabled until non-trivial content). |
| **Copy** | "You can always come back and change this later." (v1, unchanged) |
| **Animation** | Transcript settle + morph into card (v1, unchanged). |
| **Orb state** | `processing` during the ~400ms settle, then one-shot `finished` pulse (v1/PDR 0009 — gated on non-trivial content, reads as receipt not praise, unchanged). |
| **Keyboard state** | Hidden throughout voice capture; only reappears if the user explicitly taps back into the settled card afterward. |
| **Microphone state** | `completed`, then idle again (ready for Record Again). |
| **AI activity** | **None.** This is the load-bearing rule the request restates and this document must not violate: verbatim by default, always, for both modalities. `deriveIdentityStatement`'s wrapping continues to apply *only* to curated thought-library taps (a closed, tested, deterministic input space) — never to freeform speech or typed text. This was already fixed in Phase 1 (PDR 0009) and is unchanged here. |
| **Transition trigger** | User taps Continue (moves to Commitment, Moment 9) — **or**, new in v2, the Next-Moment Engine may propose an Interpretation/Clarification moment (6–7) *before* Continue becomes the obvious next step, if it judges the response ambiguous or thin. This is the one new fork v2 introduces into the sequence. |
| **Expected user emotion** | Recognition — "the app heard me," full stop, before anything else happens. |
| **Accessibility fallback** | v1's live-region/announcement treatment for the transcript-to-card morph (flagged as a build-time task in v1, still owed — see §8). |
| **Failure/recovery** | **AI timeout at the transition to Moment 6** (see below): if the Next-Moment Engine doesn't respond within its budget, the deterministic fallback is to treat the response as `accept_verbatim` and proceed straight to Commitment — the user is never blocked waiting on an AI call they didn't ask for. |
| **Rationale** | Nothing here changes the *content* of Recognition from v1 — what's new is that Recognition is no longer the second-to-last moment before Continue. It's now the handoff point to an optional Interpretation step. |

---

## 6 · MOMENT — Interpretation

*(New in v2 — does not exist in Phase 1.)*

| Field | Value |
|---|---|
| **Approx. timing** | Begins immediately after Recognition settles; budgeted to resolve within ~1.5s or fall back (see the ADR for the exact budget and degradation policy) |
| **Psychological purpose** | Decide, from what the user just said, whether the smallest useful next step is to accept it as-is or to help the user say it more clearly — *without* the user ever seeing this as "the app is analyzing me." |
| **Visible UI** | **Nothing new is shown while this resolves.** The settled vision card from Recognition stays exactly as it is. The orb may show a very subtle `processing`-adjacent shimmer *only if* the decision takes long enough to be perceptible (see latency policy in the ADR) — under the target budget, this moment should be invisible. |
| **Available actions** | None specific to this moment — Continue remains available throughout (see below); the user is never blocked on the AI to proceed. |
| **Copy** | None visible. |
| **Animation** | None, or a barely-perceptible shimmer only past the latency threshold — this moment should not be felt if the budget is met. |
| **Orb state** | `idle`/`finished` (carried over from Recognition) unless the latency threshold is exceeded, in which case a soft `processing` shimmer resumes briefly. |
| **Keyboard state** | Hidden. |
| **Microphone state** | Idle. |
| **AI activity** | **This is the one moment where the Next-Moment Engine runs.** It classifies the response (identity / value / goal / desired habit / emotional state / aspiration / obstacle / ambiguous / self-critical / already clear) and selects one `NextMomentAction`. This call is the entire subject of the ADR (Deliverable 2) — full contract, safety-tier requirement, confidence threshold, and fallback policy live there, not here. |
| **Transition trigger** | The `GeneratedMoment.action` determines what happens next: `accept_verbatim` / `confirm_ownership` / `proceed_to_commitment` → skip straight to Ownership (Moment 8); anything else (`ask_clarifying_question`, `reflect_value`, `explore_motivation`, `explore_barrier`, `invite_specific_example`, `offer_optional_rewording`) → Moment 7. |
| **Expected user emotion** | Ideally none distinct from Recognition's — if this moment is felt at all as a separate beat, the latency budget has been missed. |
| **Accessibility fallback** | No new accessible surface — nothing renders here. |
| **Failure/recovery** | **AI timeout or generation failure** → deterministic fallback to `accept_verbatim`, proceeding straight to Ownership. **Ambiguous or safety-flagged input** → routes through the safety-tier check the ADR specifies before any clarifying question is shown; an elevated/crisis signal hard-stops this entire moment and hands off per the existing Safety Engine design (`docs/15 Constitution.md` §3), never continuing to a clarifying question. |
| **Rationale** | This moment exists to hold the AI call itself, separated cleanly from Moment 7 (which renders whatever the AI decided). Keeping them distinct is what lets "deterministic UI state separate from probabilistic AI decisions" (the request's own implementation boundary) actually mean something architecturally, not just rhetorically. |

---

## 7 · MOMENT — Clarification or Deepening

*(New in v2.)*

| Field | Value |
|---|---|
| **Approx. timing** | Immediately follows Interpretation, if triggered |
| **Psychological purpose** | Help the user say what they mean more precisely, using their own words as the starting point — continuity, not a new topic. |
| **Visible UI** | The settled vision card **stays visible and unchanged** above; one concise reflective prompt appears below it (never replacing the card, never covering it) — visually a continuation of the same card region, not a new screen or modal. **Per Design Council review (PDR 0010, senior-iOS-product-design finding):** the prompt renders in a visually distinct-but-related treatment from Moment 2's cold-open question — smaller type weight, attached directly to the card rather than positioned where the original question lived — so it reads as *this follows from what you said*, never as a second unrelated question appearing from nowhere. |
| **Available actions** | Respond to the prompt (voice or type, same equal-parity mechanics as Moment 4) · or tap a visible "Continue as written" affordance to skip straight to Ownership without answering — **the clarifying question must never be mandatory.** If `action === "offer_optional_rewording"`, the two-choice Original/Suggested UI (below) renders instead of a question. |
| **Copy** | Exactly one concise prompt, generated per the ADR's contract (e.g., *"When you say '[the user's own word/phrase],' what would that look like in everyday life?"*) — never a generic coaching stock phrase, never more than one question at a time. |
| **Animation** | The prompt fades in gently beneath the card (~400ms), no slide, no attention-grabbing motion — matching the "whisper, not notification" treatment PDR 0009 established for the (deferred) Suggestion strip. |
| **Orb state** | `idle`, unchanged — this is a quiet moment, not an alert. |
| **Keyboard state** | Only appears if the user chooses to type their answer to the clarifying prompt — same explicit-action-only rule as everywhere else. |
| **Microphone state** | Available identically to Moment 4 — voice and typing remain equally weighted for the follow-up, not just the first response. |
| **AI activity** | None further at this exact instant — the prompt was already generated in Moment 6. If the user responds, that response feeds back into a new Moment 6 (Interpretation) pass — this is the loop the request's core model describes (`moment → response → interpretation → next moment`), bounded by a hard cap (see the ADR) so it cannot loop indefinitely. |
| **Transition trigger** | User responds (loops back to Moment 6) · or user taps "Continue as written" (skips to Moment 8). |
| **Expected user emotion** | Continuity — "this follows from what I just said, it's not a new question out of nowhere." |
| **Accessibility fallback** | The clarifying prompt is a normal, fully accessible text element (not a decorative thought bubble). **Per Design Council review (PDR 0010, accessibility finding):** its appearance also triggers an explicit `AccessibilityInfo.announceForAccessibility` call — the same mechanism `useThoughtScheduler` already uses to announce a new thought — since nothing else would tell a VoiceOver user this new content exists; a sighted user sees it fade in, a screen-reader user needs the equivalent event announced, not left to ambient focus-order discovery. |
| **Failure/recovery** | If the user's follow-up response is itself ambiguous or ungenerative after one loop, a **code-enforced** round cap (PDR 0010, conversational-UX finding: the state machine itself, not the model or the prompt, must force `proceed_to_commitment` past the cap) prevents an infinite interrogation; the user can always bail via "Continue as written" regardless of loop count. |
| **Rationale** | This is the request's Moment 7 as specified, with one addition not explicit in the request but required by "never trap the user": an always-visible skip affordance, since a clarifying question that feels mandatory is indistinguishable from a survey follow-up. |

### Optional rewording (a sub-moment of 7, per the request's explicit separation)

Only offered when `action === "offer_optional_rewording"`, which per the ADR's confidence-threshold policy fires rarely. Renders as: the original text (unchanged, still primary) · a labeled "Suggested wording" in secondary type weight · three actions of equal visual weight: **Use suggestion**, **Keep my words**, **Edit**. Never auto-applied. This sub-moment is architecturally identical to PDR 0009's deferred Phase 2 Suggestion strip — v2 folds that deferred feature into the Next-Moment Engine's `offer_optional_rewording` action rather than building it as a separate mechanism, which is why PDR 0009's §8.1 (local heuristic vs. LLM) is resolved by this document's ADR: it must be LLM-backed, per the request's own instruction that local heuristics may never generate psychologically meaningful rewrites.

---

## 8 · MOMENT — Ownership

| Field | Value |
|---|---|
| **Approx. timing** | Reached either directly from Recognition or after 0+ rounds of Clarification |
| **Psychological purpose** | Make explicit that nothing is final until the user says so — the card is a draft the user owns, not a record the app has already filed. |
| **Visible UI** | The vision card, exactly as the user last left it (their words, possibly informed by a round of clarification, never silently altered), with Edit / Clear / Record Again / "You can change this later" all present exactly as in Moment 5/v1. |
| **Available actions** | Edit, Clear (no confirmation dialog, v1/PDR 0009's rule, unchanged), Record Again, Back (coordinator-level, unchanged). |
| **Copy** | "You can always come back and change this later." (unchanged) — deliberately does not use stronger certainty language than the user's own wording implies (the request's explicit instruction: "Do not describe the user with stronger certainty than they expressed"). |
| **Animation** | None new — the card is already settled from Recognition/Clarification; no re-entrance animation plays here unless content actually changed. |
| **Orb state** | `idle` (or `typing` if the user re-opens Edit). |
| **Keyboard state** | Hidden unless Edit is tapped. |
| **Microphone state** | Idle, Record Again available. |
| **AI activity** | None — Ownership is a pure UI moment; re-editing after this point does not automatically re-trigger Interpretation (see the ADR's loop-cap note) unless the user explicitly re-submits. |
| **Transition trigger** | User taps Continue. |
| **Expected user emotion** | Ownership — "this is mine, and I could still change it if I wanted to." |
| **Accessibility fallback** | Unchanged from v1 — all recovery actions (Edit, Clear, Record Again, Back) have accessible labels and 44×44pt targets already. |
| **Failure/recovery** | Same as Moment 5 — nothing here can fail beyond what Expression/Recognition already handle. |
| **Rationale** | Unchanged from v1's design intent; restated as its own named beat per the request's model. |

---

## 9 · MOMENT — Commitment

| Field | Value |
|---|---|
| **Approx. timing** | The final beat before `onSubmit` |
| **Psychological purpose** | Continue as a deliberate act of carrying something forward, not a form-field validation flipping green. |
| **Visible UI** | Continue button, present but visually restrained until content is meaningful. |
| **Available actions** | Tap Continue (only enabled once non-trivial content exists **and** the user isn't actively recording/processing **and** — new in v2 — Interpretation (Moment 6), if it ran, has resolved one way or the other; Continue is never blocked *waiting* on the AI, per Moment 6's own fallback). |
| **Copy** | "Continue" (unchanged). |
| **Animation** | Gentle one-time ease-in on first becoming meaningful (v1/PDR 0009, unchanged) — no flash, no instant pop. |
| **Orb state** | Whatever it already was — Commitment doesn't introduce a new orb state. |
| **Keyboard state** | Hidden (Continue is only reachable from a settled, non-editing state). |
| **Microphone state** | Idle. |
| **AI activity** | None. |
| **Transition trigger** | Tap. |
| **Expected user emotion** | Intentional commitment — "yes, this is what I want to carry forward." |
| **Accessibility fallback** | Unchanged — `accessibilityState.disabled` already correctly tracked. |
| **Failure/recovery** | None new. |
| **Rationale** | v1's Continue behavior fully carries forward; the only v2 addition is the explicit rule that a still-pending Moment 6 call must never gate this button — the deterministic fallback (§6) exists specifically so Commitment is never held hostage by AI latency. |

---

## Paths (deltas from the baseline sequence above)

- **Curated thought tap:** Skips Expression's capture mechanics (content already authored) but *does* pass through Recognition and Moment 6 identically — a tapped thought can still be ambiguous or thin enough to warrant a clarifying question, since it's now the user's chosen statement, not exempt from the same interpretation pass typed/spoken text gets.
- **Typing:** As described in Moments 4–5; no path-specific deltas beyond what's already noted.
- **Voice input:** As described; Record Again is the one new affordance vs. v1.
- **Ambiguous input** (e.g., "I need discipline"): Moment 6 classifies as `obstacle`/`ambiguous`, selects `explore_barrier` or `ask_clarifying_question`, Moment 7 shows one concise prompt (e.g., "Where would following through make the biggest difference right now?" — the request's own worked example). Never auto-rewritten.
- **Clear input** (e.g., already a complete, unambiguous identity statement): Moment 6 classifies as `already clear and complete`, selects `accept_verbatim`, skips straight to Ownership — the majority-case path, expected to be the most common outcome, not the exception.
- **Microphone denial:** Covered in Moment 4's failure/recovery — Type and thought-tap remain fully available; the `error` orb tint is the only new signal, no blocking dialog.
- **Transcription error:** Covered in Moment 4 — Cancel/retry, nothing persisted, `error` orb tint.
- **AI timeout:** Covered in Moment 6 — deterministic fallback to `accept_verbatim`, invisible to the user if it resolves within the perceptible-latency threshold, a brief non-blocking shimmer if not.
- **Reduce Motion:** No thought drift/overlap (v1, unchanged); no card-grow scale animation (opacity-only, v1, unchanged); Moment 6/7's fade-in becomes an instant appearance rather than a 400ms fade; no orb ripple/shimmer motion, tonal/opacity state changes only (this document's own explicit orb requirement, §10).
- **VoiceOver:** Manual thought-advance control (new, §3); clarifying prompt uses standard heading/label conventions (§7); all recovery actions (Edit/Clear/Record Again/Back/Keep my words/Use suggestion) carry explicit `accessibilityLabel`s already established in v1 and extended identically to the two new Moment-7 actions.

---

## 10 · Orb, motion, and accessibility requirements this document adds to v1

- **Orb:** all seven v1 states (`idle`, `typing`, `listening`, `processing`, `finished`, `error`, plus the ambient thought-appearing pulse) are unchanged and sufficient for v2 — no new orb state is needed for Interpretation/Clarification, since those moments should be as close to invisible (orb-wise) as the latency budget allows.
- **Motion philosophy:** unchanged from v1 ("what emotion does this create") — Moment 6/7's near-total absence of animation is itself a deliberate motion choice: the *lack* of a visible "thinking" state under budget is what makes Interpretation feel like understanding rather than analysis.
- **Accessibility carryover:** everything from PDR 0008/0009 (Reduce Motion gating, VoiceOver escape action, Dynamic Type via unscaled flexbox layout, 44×44pt targets) applies unchanged, plus the two new items named above (manual thought-advance for VoiceOver, Moment 7's standard accessible prompt).

---

## Open questions / What we're deliberately NOT doing

- **The Moment 2 copy change is confirmed** ("Who are you becoming?") — founder-approved, superseding PDR 0007's wording for this string only.
- **Not deciding the Next-Moment Engine's model/prompt/safety architecture here** — that's the ADR (Deliverable 2).
- **Not implementing anything from this document yet** — per instruction, implementation waits on approval of this choreography, the ADR, and the Design Council review.
- **Not designing a UI for the manual VoiceOver thought-advance control** — flagged as needed, left to implementation-time design, not choreographed second-by-second here since it has no sighted-user equivalent to stay parallel with.
