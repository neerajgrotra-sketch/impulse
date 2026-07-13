# Impulse Investor Prototype

> Full design source of truth: [`docs/investor-prototype.md`](../docs/investor-prototype.md). This folder holds two frontend implementations of the same spec, plus the one backend they share.

## Status

**`ios/` — Demo Polish Mode complete, now the design specification.** The full investor journey runs end to end in Swift/SwiftUI: **Welcome → Consent → Conversation → Thinking → Human Blueprint → The Promise → Understanding Confirmation.** As of 2026-07 this is frozen as the reference implementation — screens, copy, and timings to match — not the shipped app (no Mac in the build workflow; see `docs/investor-prototype.md`'s "Frontend update" note). See [`ios/README.md`](ios/README.md).

**`expo/` — the active build**, React Native + Expo, chosen so the demo runs on a physical iPhone via Expo Go / EAS Build with no Mac anywhere in the loop. Reproduces the same journey against the same spec and the same backend below. In progress milestone by milestone — see [`expo/README.md`](expo/README.md) for current architecture and status.

Both frontends call the same, single backend — see [`backend/README.md`](backend/README.md).

```
ios/       SwiftUI app — design spec, complete, seven screens
expo/      React Native + Expo app — active build, in progress
backend/   One Supabase Edge Function — transcript in, six-section Blueprint out (shared by both)
```

## What's implemented

- **Welcome Screen** — cold open, Present/Future Self framing.
- **Consent Screen** — plain-language data-use statement, mic + speech permission request.
- **Conversation Flow** — all 8 fixed questions, one screen re-driven per question.
- **Voice Recording** — on-device via `SFSpeechRecognizer` + `AVAudioEngine`.
- **Speech-to-text** — live partial transcription shown as the user speaks.
- **Thinking Screen** — a cinematic synthesis sequence (six cycling category labels — "Understanding your values," "Finding friction points," etc.) instead of a generic spinner. No percentage, no fake progress bar, no implied chain-of-thought — it loops for as long as the real request takes and is swapped out the instant the answer arrives.
- **AI Request** — one call to `claude-opus-4-8` with structured output; full transcript in, six-section Human Blueprint JSON out.
- **Human Blueprint** — redesigned as an editorial read, not a dashboard: *Who you are, What seems to drive you, Where the gap appears, Your strengths, Your friction points, How I'll coach you.* Pure typography, no card backgrounds. Every claim is grounded in a verbatim quote from the conversation, rendered as visible emphasis.
- **The Promise** — a full-screen, seven-line original statement (not AI-generated, not marketing copy) presented one line at a time, Apple-keynote pacing.
- **Understanding Confirmation** — "Did I understand you correctly?" with a Not-really → Exactly-me slider and an optional local-only note field.

## What's explicitly out of scope (per the mission)

Authentication, notifications, memory, analytics, Apple Health, Recovery Engine, adaptive coaching, settings, subscriptions, long-term storage, production architecture. None of it is stubbed or half-built — it's simply not present.

---

## Demo Polish Mode — what changed and why

This pass redesigned the Thinking screen, completely replaced the Human Blueprint's structure and visual language, and added two new screens (The Promise, Understanding Confirmation) to complete the investor journey the mission specified. Documented change by change:

**Thinking screen** — `ThinkingView.swift` rewritten from a single static line to a six-phrase cycling sequence (`Understanding your values` → `Building your Human Blueprint`). Deliberately not a progress bar or percentage — the mission is explicit that progress must never be fabricated and hidden reasoning must never be implied. The cycle is driven by a `while !Task.isCancelled` loop with no fixed length, so it can never claim to "finish" ahead of or behind the real network call.

**Human Blueprint — full redesign, not an iteration.** The backend schema, system prompt, and lint changed together (`generate-blueprint/index.ts`), and the iOS model + view changed with them (`BlueprintResponse.swift`, `BlueprintView.swift`):
- Old shape (title / opening_line / gap_narrative / identity_statements / pattern_noticed / coaching_preview_line / boundary_statement / closing_affirmation) is **entirely replaced** by the mission's six named sections: `who_you_are`, `what_drives_you`, `the_gap`, `strengths[]`, `friction_points[]`, `how_ill_coach_you`. Nothing old survives under a new name except `title`, kept as a presentational headline above the six sections (a keynote deck still has a title slide).
- The system prompt now requires embedded verbatim quotes formatted as `*"exact words"*` — rendered on-device as italic emphasis via a new `EmphasizedText` component (`AttributedString(markdown:)`), so the reader can see, inline, exactly which words are the model's synthesis and which are their own. This is the mechanism behind "every insight must be traceable" — not a separate citation footnote system, which would have read as a dashboard.
- `friction_points` are explicitly prompted to be framed as *conditions*, not flaws, with an in-prompt good/bad example (marked as tone-only, not a template to copy).
- `how_ill_coach_you` is required to acknowledge the boundary the person set (Q8) in substance — this replaces the old dedicated `boundary_statement` UI section; the trust-beat is folded into the coaching-preview section instead of getting its own block, in service of the six-section mandate.
- **Visual redesign:** every bordered/filled "card" from the previous version is gone. The screen is now pure typography — small-caps eyebrow labels, serif body text, generous vertical spacing — closer to an editorial page than a dashboard. New `DesignSystem.swift` centralizes the warm off-white ink color and a single accent color used sparingly (the Thinking screen's orb, the confirmation slider) so the whole journey reads as one considered thing.
- `IdentityStatementCard.swift` deleted — fully superseded by an inline row renderer in `BlueprintView`; keeping the dead file around would have been a stale reference to a schema that no longer exists.

**The Promise (new screen, `PromiseView.swift`)** — a static, original seven-line statement, not generated per-user and not fed by the backend at all (a promise that changed per person wouldn't be a promise). Revealed one line at a time with crossfade, matching the mission's explicit "not marketing, not inspiration — a promise" framing and the "Apple keynote" visual mandate.

**Understanding Confirmation (new screen, `UnderstandingConfirmationView.swift`)** — the journey's final screen. A slider from "Not really" to "Exactly me," plus an optional free-text note. **Scope note, stated in the file's own header comment:** the note is captured in local state only. The mission requires maintaining the single backend endpoint, so there is nowhere for an edit to be sent — this screen delivers the real trust-building moment (the person can say "not quite" and be heard) without pretending it already feeds a personalization pipeline that doesn't exist yet. A small "Start over" affordance at the bottom is a demo-operations utility (so a live investor demo can be re-run without relaunching the app), not a product feature — labeled and styled as clearly secondary.

**Store/coordinator wiring** — `OnboardingPhase` gained `.promise` and `.confirmation`; `OnboardingSessionStore` gained `advanceFromBlueprint()`, `advanceFromPromise()`, and `restart()`. `PrototypeCoordinator` routes the two new phases. The Blueprint screen is no longer terminal — it now ends with a "Continue" button into The Promise, matching the mission's journey diagram.

**Verification performed:** the updated backend schema and prompt were re-type-checked against the real `@anthropic-ai/sdk` types (`tsc --strict`, clean pass — see `backend/README.md`); every Swift file was swept for stale references to the deleted field names (`identityStatements`, `openingLine`, `gapNarrative`, etc. — none found) and brace-balance checked (21 files, all balanced). Not compiled or run — see Blocked, below.

---

## Blocked / needs a human

- **This environment has no Xcode or Deno CLI** — the Swift code type-checks by inspection and the edge function type-checks against the real `@anthropic-ai/sdk` types, but neither has been compiled or run. Open the iOS project in Xcode and deploy the function via the Supabase CLI — see the two READMEs for exact steps.
- **Supabase project + Anthropic API key** — `AppConfig.swift` and the function's `ANTHROPIC_API_KEY` secret both need real values before anything can run.
- **Voice vendor decision** (premium TTS) — still flagged, not made. `QuestionVoicePlayer` still uses the system voice; this pass did not touch it, since the mission scoped this round to the Thinking screen, the Blueprint, and the two new screens.
- **A live read of The Promise's copy** — it's original and intentional, but seven lines of tone-setting prose is exactly the kind of thing that should be read aloud by a human before it's ever shown to an investor, not just reviewed as text.

## Not touched in this pass (by design)

Welcome, Consent, and Conversation screens are unchanged apart from picking up the shared `DesignSystem` tokens where it was a trivial substitution (Welcome's headline). The mission's journey diagram starts polish at Thinking; Consent in particular stays functional-but-plain since it's an OS-permission necessity, not part of the emotional arc being polished.
