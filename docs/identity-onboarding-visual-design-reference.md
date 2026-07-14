# Identity Onboarding — Visual Design Reference (external mockup, 2026-07-14)

> **Status:** Draft v0.1 — reference material, not a decision.
> **Purpose:** Extract the concrete visual/UX guidance implied by a mockup image supplied by the founder, and reconcile it against what this screen's process has already accepted — [`identity-onboarding-choreography.md`](identity-onboarding-choreography.md) (v1), [`identity-onboarding-choreography-v2.md`](identity-onboarding-choreography-v2.md), `decisions/0007-identity-thought-stream-scope-expansion.md`, `decisions/0008-identity-capture-keyboard-ux-rework.md`, and the shipped code in `prototype/expo/theme/` and `IdentityInspirationScreen.tsx`.
> **Tier:** Sensitive (identity capture — same screen `decisions/0007`/`0008` already govern; `.claude/checklists/onboarding-change.md` applies).
> **This document does not authorize implementation.** It is an input to a Design Council/behavioral-review pass, same as v1 and v2 were before it. Where the mockup conflicts with an already-Accepted decision, that conflict is named below, not silently resolved in either direction.

---

## 1 · What the mockup shows

A left-hand annotated screen plus a twelve-frame filmstrip walking the same flow already choreographed in v1/v2:

- **Main screen:** settings gear (top right) · two-line title "Let's discover who you want to become." · subtitle "Take a breath. Your thoughts will surface." · a single warm-gradient orb · one thought bubble ("I wish I kept my promises.") · a circular mic button labeled "Tap to speak" / "or tap a thought to get inspired." Four numbered annotations alongside explain, in the founder's own words: (1) thoughts surface one at a time with a soft transition, (2) tap the mic to speak anytime, (3) the vision appears in an obviously-editable card, (4) tapping any thought instantly seeds the vision as a starting draft.
- **Filmstrip, steps 1–3:** orb breathing alone → first thought fades in → it fades out and a second thought fades in. This is v1 §2/§3's "memories surfacing" behavior, drawn rather than described.
- **Filmstrip, step 4 (User speaks):** the orb is replaced by a visible audio waveform and the mic label reads "Listening…".
- **Filmstrip, steps 5–6 (Transcript / User edits):** a card labeled "✎ Your vision" holds the verbatim text; step 6 shows the user mid-edit with a native text-selection handle on the word "daughter," and a "Continue →" pill appears once the edit is live.
- **Inspiration filmstrip:** tapping a thought bubble directly (finger-tap glyph shown) morphs it into the vision card's draft text, unedited.

None of this is new *behavior* relative to v1/v2 — it's the first literal visual reference for a choreography that, until now, only existed as prose tables. That's its main value: it answers "what does the orb/bubble/card actually look like," which neither choreography doc attempts.

---

## 2 · Element-by-element cross-reference

| Element | Mockup shows | Cross-referenced against | Read |
|---|---|---|---|
| **Background / palette** | Near-black, faint warm-to-cool gradient; no card fills, no chips | `theme/colors.ts` `background.gradientStart/End` (`#0D0F1A` → `#1F1A29`), documented as "never a stark system-dark-mode look, never a chip or a card fill" | **Consistent.** The mockup is describing the palette this repo already ported 1:1 from the Swift prototype. |
| **Orb (idle/thought-appearing)** | Soft lavender-to-cream gradient sphere with bloom, breathing | v1 §1 orb state table (`idle`, `thought-appearing`), `colors.accent` (`#D9AB7D` warm accent) | **Consistent** in spirit; the mockup's sphere reads cooler/more violet than `#D9AB7D` alone would produce — likely a bloom/glow layer, not a different accent color. Worth a literal pixel check against `VoiceOrb`'s actual gradient stops before treating the mockup's exact hue as gospel. |
| **Thought bubble** | Rounded, dark, semi-transparent bubble; small cloud glyph inside, left-aligned; trailing shrinking dots as a tail | v1 §2 (`useThoughtScheduler`'s drift/jitter/overlap behavior — motion only, no visual spec existed before this) | **New information, no conflict.** This is the first visual reference for the bubble's chrome. Treat it as the working visual target for `ThoughtBubble`, not yet Council-reviewed. |
| **Vision card** | "✎ Your vision" eyebrow + body text + "Tap anywhere to edit" footer; native OS text-selection handles mid-edit | v1 Scene 4 (transcript→card morph), `EditableVisionCard`'s existing tap-to-edit affordance (v1 §6, unchanged) | **Consistent.** Native text selection is standard OS behavior, not a custom design ask — no new component needed. |
| **Continue button** | Warm gradient pill, "Continue →", appears only once the card has live content | v2 Moment 9 (restrained entrance, "no flash, no instant pop"), `motion.duration.base` | **Consistent** with the documented one-time ease-in requirement. |
| **Waveform during Speak** | A literal jagged audio waveform replaces/overlays the orb while listening | v1 §1 `Listening` state: *"Breathing continues + expanding ring pulse + brightness/scale boost"* — no waveform specified anywhere; `SpeechRecognitionAdapter`'s status machine (v1 §6, explicitly "not changing") has no amplitude-sampling capability today | **Conflict — flagged, not resolved.** See §3.1. |
| **Mic-only affordance, no visible Type button** | Main screen's caption is "Tap to speak / or tap a thought to get inspired" — no "Type" control shown anywhere on the primary screen | `decisions/0008` (Accepted): *"three explicit interaction states"* with Speak and Type as **equal-weight, equal-styled** choices; confirmed in code today — `IdentityInspirationScreen.tsx` renders a `handleType`-bound "Type" button beside the mic, with caption *"You can speak, write, or tap a thought to begin."* | **Conflict — flagged, not resolved.** See §3.2. |
| **Title + subtitle** | "Let's discover who you want to become." / "Take a breath. Your thoughts will surface." | v2 Moment 2 (founder-confirmed, superseding v1): **"Who are you becoming?"** — chosen specifically to *remove* the "want to become" phrasing because it "presupposes a gap... can land as 'who you are now isn't enough'" (v2 §2's documented rationale) | **Conflict — flagged, not resolved.** See §3.3. |
| **Settings gear, top right** | Present on the main onboarding screen | Not mentioned anywhere in v1, v2, PDR 0007, or PDR 0008 | **New surface area, not previously scoped.** See §3.4. |

---

## 3 · Open conflicts this document does not resolve

Per this project's own convention (v1 §8, v2 "Open questions"), a choreography/reference document names conflicts for Council review rather than picking a side. Four surfaced here:

### 3.1 — Waveform vs. ring-pulse for the Listening orb state
The mockup's literal amplitude waveform is a more legible "it's hearing me" signal than a breathing ring, but it requires real-time mic-amplitude sampling — a capability `SpeechRecognitionAdapter` doesn't have today and v1 explicitly scoped out of this rework. Adopting it is a small-but-real technical addition, not just a visual tweak. **Needs a decision: is the waveform the new target, an artist's simplification of the existing ring-pulse, or a future-phase idea bundled into this mockup by whoever produced it?**

### 3.2 — Does this mockup drop the Type path?
This is the highest-stakes conflict in the set. PDR 0008 made Speak/Type parity a **build-blocking** condition specifically to avoid an implicit, ambiguous single-input surface (rejected alternative: *"Collapse Speak and Type into a single always-visible input area... re-introduces an ambiguous default"*). If the mockup's mic-only main screen is the intended target, that's a reversal of an Accepted decision and needs its own PDR, not a quiet copy change. If it's just this particular frame's simplification (e.g., Type is present but not visible in this exact screenshot crop), no action is needed. **Do not implement a mic-only Reflection Mode from this mockup without first confirming which of these it is.**

### 3.3 — Title copy: "who you want to become" vs. "who you are becoming"
v2's rationale for rejecting "want to become" phrasing is specific and psychological (deficit-gap framing), not stylistic — it's the kind of finding a lens review (Dweck, in particular) produced, and this mockup's title reintroduces exactly the phrase that finding moved away from. Two honest readings: (a) the mockup predates v2's copy decision and simply hasn't been updated, or (b) whoever produced the mockup is implicitly relitigating that decision. Either way, **this is a copy decision the founder already made once (v2 §2) — reopening it should be a deliberate act, not an accidental regression via a new mockup.**

### 3.4 — Settings gear on the identity-capture screen
Introducing any new tappable affordance on this screen is, per PDR 0007's binding clause, "further expansion of this screen" requiring a fresh Design Council pass before implementation — this exact mechanism is why PDR 0008 exists. Beyond process, there's a substantive question worth a lens pass: an exit-like affordance at the first vulnerable moment of onboarding cuts against `.claude/checklists/onboarding-change.md`'s "measured on feeling-understood, not completion" and progressive-disclosure principles. **Needs its own scoping — what does it open, and why does it need to be reachable before the user has said anything yet?**

---

## 4 · What's confirmed and needs no new decision

- Dark, warm, gradient, non-clinical palette direction — already the shipped `theme/colors.ts`.
- Thought-bubble chrome (rounded, semi-transparent, cloud glyph, dot tail) — new visual detail, additive, no conflict with existing motion spec.
- Vision card's native tap-to-edit and text-selection behavior — matches `EditableVisionCard` as built.
- Continue button's restrained, content-gated entrance — matches v2 Moment 9 verbatim.
- The overall six-step arc (orb alone → thoughts drift → speak → transcript → edit → continue) and the tap-a-thought shortcut — both already fully choreographed in v1/v2; the mockup is illustrative confirmation, not new scope.

---

## 5 · Governance note

This screen already carries two Accepted decisions (`decisions/0007`, `decisions/0008`) and two choreography drafts (v1, v2) specifically because PDR 0007 bound all future expansion of it to a fresh Design Council pass. This reference doesn't change that: §3's four conflicts are exactly the kind of thing a Council pass (Krug/Rams for the visual questions, Dweck for §3.3, Thaler/Fogg for §3.4, Jobs for §3.1's "is this addition earning its complexity") should resolve, not this document. Until then, treat this file as input alongside v1/v2 — not a replacement for either, and not a green light to build.
