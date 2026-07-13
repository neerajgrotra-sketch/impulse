# Impulse — Expo Prototype

The production-track frontend implementation of the investor onboarding experience (`docs/investor-prototype.md`). The Swift prototype in `prototype/ios/` is now the **design specification** for this build, not a parallel implementation — this folder reproduces its screens, timings, and copy exactly, on React Native + Expo instead.

Backend, AI prompts, and the Human Blueprint schema are unchanged and untouched — see `prototype/backend/`.

**First time running this?** See [`docs/expo-first-run.md`](../../docs/expo-first-run.md) for the exact, verified command sequence from a fresh Codespace through a Development Build installed on a physical iPhone — QR scanning, EAS builds, env vars, Supabase/Anthropic setup, and troubleshooting all live there.

## Workflow this is optimized for

```
GitHub → Codespaces → Claude Code → Expo → EAS Build → iPhone
```

No Mac involved anywhere. Development happens in the browser/Codespaces; the app runs on a physical iPhone via Expo Go (JS-only milestones) or an EAS-built Development Client (once a native module needs a custom build).

## Running it

From this directory (`prototype/expo/`):

```bash
npm install
npx expo start
```

Scan the printed QR code with the **Expo Go** app on your iPhone (App Store → "Expo Go"). Welcome → Consent → the full 8-question conversation all run in Expo Go today, with typed answers (see "Voice strategy" below for why voice capture itself needs a Development Build).

### When a Development Build becomes necessary

Expo Go can't run code that needs a **custom native module** not baked into the Expo Go binary. `expo-speech-recognition` (on-device speech-to-text) is exactly that kind of module — it's the one piece of this app that requires a Development Build to actually function. Everything else installed so far (`expo-router`, `expo-audio`, `expo-speech`, `expo-secure-store`, `expo-haptics`, `expo-blur`, `expo-linear-gradient`, `react-native-svg`, Reanimated, Gesture Handler) works inside Expo Go.

To build a Development Client via EAS (no Mac required — this builds in the cloud):

```bash
npm install -g eas-cli
eas login
eas init          # links this project to your Expo account, fills app.json's extra.eas.projectId
eas build --profile development --platform ios
```

EAS will ask a few questions the first time (Apple ID for the ad-hoc provisioning profile, or let EAS manage credentials for you — recommended). When the build finishes, EAS prints a QR code / install link; scan it on your iPhone to install the Development Client, then run `npx expo start --dev-client` and connect to it from the running app. Once installed, the Consent screen's copy and the Conversation screen's input mode switch automatically — no code change needed, no separate build of the app.

## Voice strategy

**Chosen path: on-device speech recognition (`expo-speech-recognition`), with an automatic, always-functional typed fallback — not cloud transcription.**

Why, in priority order:

1. **On-device STT has no Expo-Go-compatible path at all.** There is no Expo SDK module for speech-to-text; any implementation is a custom native module, full stop. `expo-speech-recognition` was chosen because it wraps the same native APIs the Swift prototype uses (iOS `SFSpeechRecognizer`, Android `SpeechRecognizer`) — free, on-device, no vendor dependency, matching `SpeechRecognizer.swift`'s own reasoning.
2. **Cloud transcription (record → send → transcribe) was deliberately not built**, even though it would work inside Expo Go. It would require a **second backend endpoint**, and both `docs/investor-prototype.md` §6 and `prototype/backend/README.md` are explicit that this prototype has exactly **one** endpoint (`generate-blueprint`) by design — adding another is a real architecture change to a system marked "do not touch," not a Milestone 2 frontend decision to make unilaterally. If you want this path instead, it needs an explicit go-ahead since it touches the backend.
3. **Typed fallback is therefore the practical default today**, not a last resort nobody hits. Every goal in this milestone (conversation pacing, the orb, TTS playback, question progression, transitions) is fully real and fully testable in Expo Go right now; only the literal voice-in step degrades to typing until a Development Build exists.

**Safety-critical detail:** `expo-speech-recognition` calls `requireNativeModule()` at module top-level, which throws synchronously if the native module isn't linked (i.e., always, inside Expo Go). So it is **never statically imported** anywhere in this app. `hooks/useVoiceCapture.ts` reaches it only through a dynamic `import()`, itself only attempted when `expo-constants`'s `executionEnvironment` reports we're *not* running inside Expo Go, with a `.catch()` as a second safety net for a Development Build that hasn't rebuilt after this package was added. Either branch leaves `isAvailable: false` and the UI falls back to typing — the app cannot crash from this. Verified by inspecting the Metro bundle (dynamic `import()` defers `require()` to the `.then()` callback, never at module-eval time) and via `expo export`; **not yet verified against a real Expo Go client on a physical device**, since this environment has none — that's the one thing worth confirming first when you get a device in hand.

TTS (the coach's spoken questions) uses `expo-speech` — the official, Expo-Go-compatible wrapper around the same system-voice APIs `QuestionVoicePlayer.swift` uses (`AVSpeechSynthesizer`). Same documented scope cut as the Swift source: pre-generated premium neural voice (the "ChatGPT Voice" bar from `docs/investor-prototype.md` §6) is a fast-follow, not a blocker — swapping `useQuestionVoice` for one that plays pre-rendered audio via `expo-audio` (already installed, unused today) is a contained, isolated change.

## Network architecture

One backend call, in the whole app: `services/blueprintApi.ts`'s `generateBlueprint()`, fired once by `ThinkingScreen` when the 8th answer is recorded. It calls the same, unmodified Supabase Edge Function (`prototype/backend/`) the Swift client uses — same URL, same request shape, same six-section response schema. No new endpoint, no orchestration layer.

**One real wire-format incompatibility, found and fixed client-side only:** this app's TS types are camelCase (`questionKey`, `whoYouAre`, ...), matching every other type in the app; the Edge Function's JSON is snake_case (`question_key`, `who_you_are`, ...). `blueprintApi.ts` is the one place that knows this — `toWireTranscript` maps the outgoing transcript, `parseBlueprintResponse` maps (and structurally validates) the incoming response. The Swift client bridges the identical gap via `Codable`'s `CodingKeys`. The backend itself was not touched.

Failure handling is deliberately narrow: a small `BlueprintApiError` taxonomy (`config` / `network` / `timeout` / `aborted` / `server` / `invalid-response`) exists so the *code* can reason about what happened, but the UI only ever shows one calm, investor-safe message (`toInvestorSafeMessage`) — the real cause is logged, never rendered. See `docs/expo-first-run.md` for setup and the Milestone 3 completion notes for the full request/retry lifecycle.

There is no offline/cached fallback for API failure — `docs/demo-fallback-proposal.md` designs one but it is **not implemented** and nothing in this codebase references it.

## Reading experience (ReflectionScreen)

The screen for the six-section response (`BlueprintResponse` — the type name mirrors the backend schema deliberately, since that's unchanged; nothing user-facing calls it that) is **presentation-only divergence** from `BlueprintView.swift`. The data, the six fields, their order, and the quote-grounding convention (`*"verbatim quote"*` rendered as emphasis, via `components/EmphasizedText.tsx` — React Native's answer to `EmphasizedText.swift`, since there's no `AttributedString(markdown:)` equivalent) are all unchanged. What changed on purpose, per explicit direction: no report-style eyebrow labels on the four prose sections (they just flow as paragraphs); the two list sections get soft, natural-language lead-ins ("What stood out," "Where it gets harder") instead of `DS.eyebrow("Your strengths")`-style labels; a three-line reveal ("Thank you." → "I've been listening carefully." → "Here's what I understand so far.") plays before any content appears; the closing line is new copy, not Swift's transparency-footer-only ending. The transparency line itself (*"Built from what you told me, and nothing else."*) is kept, just de-emphasized beneath the new closing line — it's a Covenant-transparency requirement (`docs/investor-prototype.md` §5), not a presentational choice, so it didn't get removed, only quieted.

## Architecture decisions

- **Expo Router**, file-based, `app/` directory. `main` in `package.json` is `expo-router/entry`. Only `app/_layout.tsx` (root shell) and `app/index.tsx` are real routes — the entire onboarding funnel (Welcome → Consent → Conversation → …) lives inside `features/onboarding/OnboardingCoordinator.tsx`, a single phase-switch component, not a stack of routes. This is a direct port of `PrototypeCoordinator.swift`: "no back button mid-conversation — this is a conversation, not a form" (`docs/investor-prototype.md` §2) ruled out using `router.push` per phase, since that would let an OS back-swipe escape mid-conversation.
- **Dark-only.** `app.json` sets `"userInterfaceStyle": "dark"` — this product has no light mode, matching the Swift prototype's fixed dusk gradient.
- **Zustand**, one store (`stores/onboardingStore.ts`) — phase, transcript, loading, blueprint, understanding-confirmation. Ephemeral device-capability state (is the mic recording, is TTS speaking) deliberately stays **out** of this store, living instead in `hooks/useVoiceCapture` / `hooks/useQuestionVoice` — the same split as Swift's `OnboardingSessionStore` (progress) vs. its separate `SpeechRecognizer` / `QuestionVoicePlayer` services. The store doesn't call the network itself — `ThinkingScreen` owns the fetch's lifecycle (`AbortController`, cancel-on-unmount) and reports the outcome back via store actions. No React Query: there is exactly one backend call in the whole flow.
- **Reanimated + Gesture Handler** for all motion — no third-party animation library. `react-native-svg` was added in Milestone 2 for the voice orb's true radial gradient (Expo Go bundles it; no Development Build needed).
- **Path alias `@/*`** → project root (see `tsconfig.json`).
- **Fraunces** (`@expo-google-fonts/fraunces`) is the serif display face — the closest cross-platform equivalent to SwiftUI's `.system(_, design: .serif)`.
- **`theme/`** is a small set of tokens (colors, typography, spacing, radius, elevation, motion), not a component library.

## Folder structure

```
prototype/expo/
├── app/                         Expo Router routes only — thin, no business logic
│   ├── _layout.tsx              Root layout: fonts, splash, stack shell
│   └── index.tsx                 → OnboardingCoordinator
├── components/                  Shared, screen-agnostic UI primitives
├── features/
│   └── onboarding/
│       ├── OnboardingCoordinator.tsx   Phase-switch — the whole funnel, no router
│       └── screens/             Welcome, Consent, Conversation, ...
├── hooks/                       useVoiceCapture (STT), useQuestionVoice (TTS)
├── services/                    blueprintApi.ts — the one backend call
├── constants/                   The fixed 8-question list, the 6 thinking phrases
├── stores/                      Zustand store(s)
├── theme/                       Design tokens
├── types/                       Shared TypeScript types (transcript, blueprint, phase)
├── assets/                      App icon / splash (placeholder Expo defaults — swap before shipping)
├── app.json                     Expo config
├── eas.json                     EAS Build profiles (development / preview / production)
├── .env.example                 Template for the two EXPO_PUBLIC_ Supabase vars — copy to .env
└── babel.config.js
```

`utils/` isn't created yet — it arrives with the milestone that first needs it.

## Verifying

```bash
npm run typecheck   # tsc --noEmit
npm run doctor       # npx expo-doctor — checks the Expo config/dependency graph
```
