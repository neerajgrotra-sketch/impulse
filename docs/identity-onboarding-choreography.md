# Identity Onboarding — Interaction Choreography

> **Status:** Draft v0.1 — 2026-07-14
> **Purpose:** A second-by-second choreography of `IdentityInspirationScreen` — the first conversation between the user and their Future Self — redesigned so it feels like Headspace/Calm's stillness, Notion AI/ChatGPT Voice's live-understanding, and Apple's motion restraint, instead of a form with animation on top.
> **Tier:** Sensitive (identity capture — this document is the spec input to a Design Council pass, not yet held; see §10).
> **Scope:** Interaction, motion, and visual-hierarchy redesign of the existing screen. Does not add onboarding steps, does not change what data is captured, does not touch the Coach/Safety/Memory Engines. One open question (§8.1) may touch the model and would need its own scoping.

This is a choreography, not code. No implementation should start from this document alone — it needs a Design Council pass first (§10), same as PDR 0007 and PDR 0008 before it.

---

## 0 · Governing philosophy

**The five-beat emotional arc.** Every scene below is placed on this arc; nothing is animated that doesn't serve one of these five beats.

```
Wonder  →  Reflection  →  Expression  →  Confirmation  →  Ownership
(thoughts   (a held        (speaking or    (the app         (Continue
 drift in)   breath)        typing)         shows it heard)  arrives)
```

**The one rule every animation must pass:** *what emotion does this create?* If the honest answer is "it looks cool" or "it fills a gap," the animation is cut. This rule is the reviewable acceptance bar for every entry in every table below — a build reviewer should be able to point at any transition and read its emotion column.

**What we are NOT building:** a wizard, a progress bar, a validation-flash form, or a "screen 2 of 5." There is exactly one screen the user experiences as one continuous held moment — mode changes are staging directions for *us*, not screens for the user to notice.

---

## 1 · The orb — the emotional center

The orb must be legible without reading any text. Seven states, each answering "what is the system doing right now":

| State | Trigger | Visual behavior | Loop | Emotional read | Reduce Motion equivalent |
|---|---|---|---|---|---|
| **Idle** | Reflection Mode, nothing happening | Slow breathing, scale 0.94↔1.08, 4000ms ease-in-out (existing `VoiceOrb`) | Continuous | "I'm here, unhurried" | Same — this loop is already gentle enough to keep |
| **Thought-appearing** | Each time a new thought bubble enters | A tiny synced pulse — scale +0.02 for 150ms, timed to the bubble's fade-in, then settles back into the breathing loop | One-shot per thought | "something just surfaced" — a held breath noticing something, not a notification | Suppressed — Reduce Motion already holds the first thought indefinitely (`useThoughtScheduler`), so there's nothing to pulse for |
| **Listening** | Mic pressed | Breathing continues + expanding ring pulse + brightness/scale boost to 1.08 (existing `BreathingOrb`) | Continuous while recording | "I'm hearing you" | Ring becomes a static soft halo, no expansion loop |
| **Processing** | Recognizer settling (~400ms, existing `SpeechRecognitionAdapter`) | Internal shimmer — slow opacity breathe, no expanding ring (already built in PDR 0008) | Continuous during the settle window | "I'm understanding, one moment" | Shimmer becomes a single soft fade, not a loop |
| **Finished** | Transcript has just settled into the vision card | *New.* One-shot gentle pulse — scale 1 → 1.06 → 1 over 500ms, single ease-out-then-in, never repeats | One-shot | A nod: "got it" | A single brief opacity lift, no scale |
| **Typing** | TextInput focused | Subtle brightness/scale boost to 1.03 (existing, PDR 0008) | Continuous while focused | "I'm watching you write" | Static slight brightness, no animation |
| **Error** | Recognition fails / permission denied | *New.* A soft warm-red wash at ~15% opacity over the orb's existing gradient — never the orb itself turning red, never a shake | One-shot fade in/out, ~600ms | "that didn't work, no big deal" — calm, not alarmed (no shaming, no urgency — Canon §2 banned-word spirit extended to motion) | Tint appears and disappears instantly, no fade |

**Precedence when more than one could apply:** Error > Listening > Processing > Finished (a ~900ms transient window) > Typing > Idle. Thought-appearing is an overlay pulse that can only co-occur with Idle, since the thought stream is already paused during Listening/Processing/Typing.

**Why this matters more than it looks:** the orb is the only element that's *always* on screen across every mode. If it goes dead (today's bug), the user loses their one constant reference point and the experience fragments into disconnected screens. A legible orb is what makes mode transitions feel like one held moment instead of navigation.

---

## 2 · Thought bubbles — memories surfacing, not a carousel

Today's bubbles enter, hold, exit — mechanically identical every cycle. The fix keeps the same timer-chain architecture (`useThoughtScheduler`'s deterministic phases, its no-repeat guarantee, its Reduce-Motion/screen-reader hold) but changes what happens *during* each phase:

- **Fade-in duration** jitters slightly (420–560ms instead of a fixed 450ms) — a few milliseconds of irregularity is what separates "alive" from "timed."
- **Continuous drift.** For its *entire* visible lifetime (not just enter/exit), a bubble drifts slowly in a small randomized direction (±6–14px, randomized per bubble like its existing width/offset randomization). This is the single biggest change: today's bubble is static once visible; a memory surfacing keeps moving, almost imperceptibly, the whole time it's held.
- **Occasional overlap (~30% of transitions).** Instead of always fully exiting before the next enters, let the next thought begin fading in 200–300ms before the current one finishes fading out. Two thoughts breathing past each other briefly is what breaks the "one slot, one at a time" carousel feeling. This must stay probabilistic, not scheduled, so it never becomes its own predictable pattern.
- **Linger duration** keeps its existing randomized range (2500–4000ms) — already good, not changing.

**Reduce Motion / screen reader:** unchanged from PDR 0008 — the first thought holds indefinitely with a flat 200ms opacity fade, no drift, no overlap. The "memories surfacing" quality is itself a motion effect and must fully back off under Reduce Motion, not a degraded version of it.

**What must not regress:** the no-repeat-within-session guarantee, the Reduce Motion hold, and the screen-reader announce-once behavior are all covered by existing tests (`useThoughtScheduler.test.ts`) and were explicit PDR 0007 remediation items. Any implementation of this section must keep all three green.

---

## 3 · Second-by-second choreography

### Scene 0 — Launch (0.0s – 2.0s)
| Time | UI state | Animation | Orb | Emotion | Rationale |
|---|---|---|---|---|---|
| 0.0s | Screen mounts | Gradient background present instantly (no fade — a black flash is worse than no animation) | Not yet visible | — | Never make the user wait on the *background* |
| 0.0–0.4s | Title text | Serif title fades in, 400ms (`motion.duration.fast`) | Orb fades + scales in from 0.9→1, 400ms, breathing begins immediately after | Quiet arrival | The title and orb arrive together, at the pace of a breath, not a page load |
| 0.9s | Nothing yet | — | Breathing continues | Held silence | `THOUGHT_INITIAL_DELAY_MS` (900ms, existing) — deliberately no content competes with the orb's first breath |
| ~0.9–1.4s | First thought bubble begins entering | Bubble fade-in + drift starts | Thought-appearing pulse fires once | *Wonder* begins | This is the moment the screen starts inviting curiosity rather than demanding an answer |

### Scene 1 — Reflection Mode (Wonder, ambient, indefinite)
Visible: orb (idle, breathing), thought stream (memories surfacing per §2), a quiet "Your Vision" panel with Speak and Type affordances. No keyboard. No card. No instructional copy beyond what's structurally necessary (§11 below) — the mic's own iconography and the panel's restrained "You can speak, write, or tap a thought" line are the only teaching the interface does.

The user can idle here indefinitely — this is the "held breath" state the whole arc returns to on any cancel/back/clear (§7).

### Scene 2A — Speak chosen (Expression begins)
| Time (relative to tap) | UI state | Animation | Orb | Emotion | Rationale |
|---|---|---|---|---|---|
| 0ms | Mic pressed | Haptic (existing) | Orb reacts **immediately** — ring begins expanding within 150ms, no perceptible delay | "It heard me the instant I acted" | Any lag here reads as "is this working?" — the orb must be the fastest-responding element on the screen |
| 0–200ms | Mic icon | Shrinks slightly (scale ~0.85) and migrates toward the bottom edge, ceding the screen's center | Boost to 1.08, ripple loop starts | The stage is being handed to the words, not the button | Directly answers problem #2 — the mic is not what the user came to look at once they're speaking |
| 200ms+ | **Live transcript** | Appears in the vertical/horizontal center of the screen, large type (a new `typography` scale, generous line-height), fading word-by-word as partial results arrive | Listening (glow, ripple) | "Yes, it's hearing me" | This is the hierarchy fix (§4) — the transcript, not the mic, is the visual subject from the instant speech begins |
| ongoing | Ambient thoughts | Paused (existing `paused` derivation, unchanged trigger — now driven by "listening", same as before) | — | Attention narrows to one thing | Removing the ambient distraction the moment expression begins mirrors how attention actually narrows when a person is trying to find words |

### Scene 3 — Recording stops (the hinge of Confirmation)
| Time (relative to stop) | UI state | Animation | Orb | Emotion | Rationale |
|---|---|---|---|---|---|
| 0ms | Mic pressed again / stop | Mic shrinks further, ring loop ends | Listening → Processing (shimmer begins) | A held breath | The 400ms settle window (existing `PROCESSING_SETTLE_MS`) is real, observable time — not hidden behind an instant swap |
| 0–400ms | Transcript | The centered live text has a subtle "settling" animation — a soft glow pulse and a small weight/scale-down from its "live" treatment to its "final" treatment | Processing (shimmer) | "It's making sense of what I said" | Distinguishes *hearing* from *understanding* — two different feelings, two different visual treatments |
| ~400ms | Transcript final | Text is now in its settled, final typographic treatment | Processing → **Finished** (one-shot pulse) | "Got it." A nod. | The Finished pulse is the orb's only non-looping, single acknowledgment gesture in the whole state machine — it should feel rare and earned |

### Scene 4 — Transcript → Vision Card (the morph, Confirmation completing)
The centered transcript does not vanish and get replaced by a card appearing elsewhere. It stays in place and *becomes* the card:

1. The card's chrome (hairline border, pencil icon, "YOUR VISION" eyebrow) fades and grows in around the transcript's existing position and text — a shared-element feel, not a cut.
2. The transcript's type scale eases down from its large "spoken aloud" size to the card's normal body size, timed with the border/eyebrow fade-in (~500–600ms total, `motion.duration.base`-adjacent).
3. Only once this settle completes does the rest of the screen (reviseNote, recovery affordances, Continue) fade in beneath it.

**Same morph applies to the Type path** (Scene 2B, below) for consistency — both entry paths should feel like the same emergence, not two different mechanisms that happen to end at the same component.

### Scene 2B — Type chosen (the other Expression path)
| Time | UI state | Animation | Orb | Emotion | Rationale |
|---|---|---|---|---|---|
| 0ms | Type pressed | Haptic (existing) | Typing state begins (brightness boost) | — | |
| 0–300ms | Vision card | Grows from the Type button's position/scale outward into its full size and position (not a snap-in `FadeIn`) — the same "emergence" quality as the voice morph | Typing | "This is growing out of what I chose to do" | Keeps the Type path visually consistent with the Speak path's morph — one emergence, two doors into it |
| ongoing | Keyboard | Slides in (existing `KeyboardAvoidingView`) | Typing | | Unchanged from PDR 0008 |

### Scene 5 — Identity normalization (Confirmation, the credibility moment)
This is where today's implementation actively breaks trust ("I am someone who is i wanna be perfect"). New rule, with no exceptions: **the original words are always shown, always primary, and are never silently rewritten.**

| Condition | UI state | Copy | Rationale |
|---|---|---|---|
| Statement is already identity-shaped, or confidence in a beneficial rewrite is low | Nothing extra appears. The card holds exactly what was said/typed. | — | Silence is the correct response most of the time — not every sentence needs editorial intervention, and over-suggesting would itself feel like the app doubting the user |
| Confidence is high that a rewrite would strengthen the statement | A quiet suggestion strip fades in *beneath* the card, secondary weight, clearly optional | "Suggestion" (small eyebrow label) → the rewritten line, in a lighter type treatment than the card itself → two text-weight actions: **Use Suggestion** / **Keep My Words** | Presented as an invitation sitting *below* the user's own words, never replacing them, never a red underline — Coach-never-parent applied to copy editing, not just dialogue |

The suggestion strip itself animates in with the same restraint as everything else (soft fade, no bounce, no attention-grabbing motion) — a rewrite offer is a whisper, not a notification.

**This scene has an unresolved open question — see §8.1 before implementing it.**

### Scene 6 — Recovery, always reachable (never trapped)
Recovery affordances are contextual, never a static toolbar (a row of six buttons would itself feel like a form). Visible only when relevant:

| Context | Available now | Presented as |
|---|---|---|
| Listening | Cancel | Existing quiet text link beneath the mic |
| Card settled with content | Record Again, Edit (tap-card, existing), Clear | Understated text links, not buttons — appear only once there's something to recover *from* |
| Card focused (keyboard up) | Done Editing (existing, PDR 0008) | Accessory bar (iOS) + cross-platform text link |
| Any time | Back (existing, coordinator-level) | Unchanged |
| Suggestion strip visible | Keep My Words *is* the "no" — no separate dismiss needed | Two-choice framing already covers reversibility here |

**Clear** is new: it's the "start over" the current build has no path to — it wipes the card's text and returns to Reflection Mode (Scene 1), same as if nothing had been chosen yet. This is the one true "undo everything" affordance this screen needs; it does not require a confirmation dialog (a confirmation dialog would itself be a small betrayal of "nothing here is irreversible" — undoing "Clear" is simply picking a new thought, speaking, or typing again).

### Scene 7 — Continue (Ownership)
Continue does not toggle instantly at the first non-empty character. It animates in **once**, the first time `canContinue` flips true — a gentle upward fade + slight scale spring (~500–600ms, matching `PrimaryButton`'s existing press-spring feel) — and then stays present through further edits without re-animating on every keystroke. The arrival should read as "you've reached somewhere," not "a field validated."

---

## 4 · Transcript-first typographic hierarchy

Today: speech → tiny italic caption under the mic → Continue. The caption is structurally the least important element on the screen holding the most important content.

New hierarchy while listening and immediately after: the transcript is the largest, most central, most generously spaced text on screen — larger than the question title above it. Only once it morphs into the vision card (Scene 4) does it step down to the card's normal body-text weight, because at that point its job has changed from "look at what I'm saying" to "this is now yours to edit."

## 5 · Mic iconography

The current control is a plain circle-in-circle — it reads as a generic radio/record dot, not a microphone. It must be redesigned as actual mic iconography (a rounded capsule body + stand, thin-stroke line art matching the existing pencil icon's weight and the app's warm-ink palette) so that, per the request, a first-time user instantly reads "this is where I speak" without any caption. Idle state: outlined. Listening state: filled/warm-accent, with a small stop-glyph micro-affordance replacing the mic glyph specifically (not a jarring solid red square swapped in for the whole button, which is today's abrupt treatment).

## 6 · What is explicitly NOT changing

Reused as-is, no rewrite: `useThoughtScheduler`'s timer-chain architecture (only the bubble's *visual* behavior during each phase changes, per §2) · `SpeechRecognitionAdapter`'s status machine and settle timing · `EditableVisionCard`'s tap-to-edit affordance and focus-border language · the keyboard-dismiss mechanisms from PDR 0008 (tap-outside, drag, accessory bar, Done Editing link) · the two-stage confirmation with `IdentityConfirmScreen` (PDR 0007, still load-bearing) · voice-derived text never persisting before explicit Continue (PDR 0007).

## 7 · Removing unnecessary text

Copy being cut or shortened because the animation now teaches it: the old subtitle "Tap a thought that fits, or write your own" (the choice panel's restrained "You can speak, write, or tap a thought to begin" already covers this, and the mic/keyboard iconography should carry the rest). No new instructional copy is added anywhere in this document — every new state (Finished pulse, Error tint, Clear) is designed to be understood from motion and icon alone.

## 8 · Open questions

**8.1 — What produces the identity-normalization "confidence" and the suggested rewrite (Scene 5)?** The current `deriveIdentityStatement` is a pure local string prefixer — that's the entire cause of the "I am someone who is i wanna be perfect" bug, and it cannot produce a genuine rewrite like "I want to become someone who strives to improve every day." Two real paths, with different scope:
  - **(a) A smarter local heuristic** (detect already-first-person/identity-shaped phrasing and pass through unchanged; otherwise show no suggestion at all rather than a fabricated one). Small, no new architecture, but "confidence" would be shallow pattern-matching, not real understanding, and would likely under-trigger.
  - **(b) A real LLM-backed rewrite**, going through the Prompt Builder per Canon §4/§6 ("no raw model access from feature code"). This is a materially new capability for onboarding — it would need its own prompt-review pass, an eval-harness case for "never fabricates or overclaims," and a decision about which model tier serves a sub-second, low-stakes rewrite (Haiku 4.5 territory, per Canon §6, but that's a call for prompt-review, not this document).

  This document does not decide between (a) and (b) — it is exactly the kind of decision the Design Council pass in §10 should surface, since (b) would push this feature from "Sensitive: identity" into "Sensitive: identity + the model," a wider blast radius than the rest of this redesign.

**8.2 — Does the Finished pulse read as premature affirmation?** Dweck's-lens question: a "got it" nod fires the instant a transcript settles, before the user has seen or approved the vision card. Is a content-neutral acknowledgment ("I heard you") distinct enough from an evaluative one ("that's good") to avoid quietly praising output the user hasn't confirmed yet? This document intends the former; §10 should check it explicitly.

**8.3 — Overlap probability (~30%) and Suggestion-strip frequency are both unvalidated numbers.** They're chosen to sound right, not measured. Both should be treated as tunable constants, not commitments, and are reasonable candidates for a later usability pass rather than a launch blocker.

## 9 · Accessibility carryover

All PDR 0008 accessibility commitments carry forward unchanged: Reduce Motion gates every *new* animation introduced here (drift, overlap, morph, Finished pulse, Error tint all need a static/instant equivalent, specified inline above) exactly as it already gates the existing thought-bubble and card-reveal transitions. VoiceOver: the transcript-to-card morph and mic state changes need their own `accessibilityLiveRegion`/announcement treatment (not yet designed — a build-time task, not a choreography-level decision). Dynamic Type: the new large transcript type scale must still flex under scaled fonts, same flexbox-only approach already used elsewhere. Large touch targets carry forward for every new Pressable (Clear, Record Again, suggestion actions).

## 10 · Governance note

This is a full redesign of `IdentityInspirationScreen` and its dependent components (`ThoughtBubble`, `useThoughtScheduler`, `VoiceOrb`, `BreathingOrb`, `EditableVisionCard`, and potentially a new normalization surface) — squarely "further expansion of this screen" under PDR 0007's binding clause, and larger in scope than PDR 0008 was. Per this project's own process, a Design Council pass against this document is required before any code is written. §8.1 in particular determines whether this stays a UX-only Sensitive-tier change or also becomes a model/prompt-tier change requiring `prompt-review`.

## What we're deliberately NOT doing

- Not adding new onboarding steps or screens — everything above happens within the existing single identity-capture step.
- Not changing what data is captured, when it's submitted, or the two-stage confirmation with `IdentityConfirmScreen`.
- Not deciding §8.1 here — that's the Design Council's job, informed by whichever path (a) or (b) the founder wants scoped.
- Not treating the ~30% overlap probability or suggestion-trigger threshold as final — both are placeholders for a later tuning pass.
