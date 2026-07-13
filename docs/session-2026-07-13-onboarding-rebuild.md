# Session Summary — 2026-07-13 — Dev Environment Setup & Onboarding Rebuild

> **Purpose:** Orient a fresh Codespace/session on where things stand after today's work. Read this first, then follow the specific docs it points to rather than re-deriving anything from scratch.

---

## 1. Dev environment: fully working, should not need redoing

The Expo app is reachable from a fresh Codespace end to end — Apple Developer Program enrolled, iPhone registered, Development Build built and installed, Developer Mode enabled and trusted. **Full reconnect steps for a new Codespace session: [`docs/expo-testing-guide.md`](expo-testing-guide.md) §2.** Only §2 (the per-session reconnect sequence) should be needed going forward; §1 (Apple enrollment, device registration, first build) is already done and only needs repeating if a native dependency changes.

The two platform gotchas that ate significant time this session and are now resolved/documented, in case they resurface:
- `expo start --tunnel` is broken (legacy ngrok v2 binary) — use Codespaces' own port forwarding + `EXPO_PACKAGER_PROXY_URL` instead (§2d–e of the testing guide).
- Expo Go on the App Store lags new SDKs indefinitely (Apple review backlog since May 2026) — this project is on a Development Build, not Expo Go, specifically because of this.

## 2. Onboarding was rebuilt — old 8-question flow is gone

Founder tested the original onboarding on a physical device and rejected it outright ("who came up with these dumb questions"). That triggered a full Design Council review (8 of 15 lenses engaged) against `docs/05 Onboarding.md`, which found two independently decisive problems — not just bad wording:

1. **Scope/sequencing** — a fixed 8-question cold-open battery directly violated the spec's "one to two prompts, almost embarrassingly small" design, confirmed across nearly every engaged lens (Fogg, Kahneman, Bandura, Rams, Jobs, Christensen).
2. **A verified safety gap** — confirmed by reading the actual code, not assumed: all 8 answers batch into one backend call fired only after the last question, and the backend function has no crisis/risk-detection logic anywhere. `docs/05 Onboarding.md` §6.2 and `docs/15 Constitution.md` §3 require per-message safety screening with no exemption for onboarding.

This is recorded as **[`decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md`](../decisions/0006-onboarding-rejects-fixed-interview-requires-safety-gate.md)** — read that for the full reasoning and rebuild conditions before touching onboarding again.

### What the flow looks like now

Welcome → Consent → **one identity prompt** ("who do you want to become?", with tap-to-pick starter chips as an unstick-the-blank-page escape hatch) → **one tiny reflection** (freely skippable) → **identity-confirm** (a mechanically-derived "I am someone who…" statement the user edits/confirms — "we propose, they own," no LLM call) → **coaching-touch** (a deterministic Reflect-only response that quotes the user's own words back, never advice, no LLM call) → promise (existing placeholder).

Users can now go **back** to any previously-answered step from anywhere in this chain (`BackButton` component, `goBack()` store action) — the original design deliberately had no back button ("this is a conversation, not a form"), but that assumption broke once the flow shrank to 1–2 questions with no way to revise an answer.

The old Blueprint-generation call (`ThinkingScreen`, `ReflectionScreen`, `services/blueprintApi.ts`, the `generate-blueprint` backend function) was **detached from the default flow, not deleted** — it's real, working, documented code the PDR explicitly leaves room for as a separate, later, properly-specced feature.

### What's explicitly NOT done — pick up here next

1. **Question wording is a placeholder.** The founder found even the simplified reflection question ("tell me about one small moment...") too vague on real-device testing, and said they'll rewrite the actual question copy themselves. **Do not assume the current text in `prototype/expo/constants/onboardingQuestions.ts` is final** — check with the founder or look for their edits before building further on top of it.
2. **Safety screening is still entirely unimplemented.** This is launch-blocking per PDR 0006 and `docs/15 Constitution.md` §3, and was explicitly deferred this session ("onboarding flow first, safety stubbed for now") — it needs real backend work: a new endpoint plus a risk/crisis classifier, checked on every answer in real time, with the authority to pre-empt the rest of onboarding. Nothing resembling this exists yet.
3. **`ConsentScreen` gap, confirmed not fixed.** It only requests the OS microphone/speech-recognition permission — it does not present the actual Covenant promise-language `docs/05 Onboarding.md` §3 Step 4 specifies. Flagged as an open question in PDR 0006; still open.

## 3. Other fixes landed this session

- **Voice-capture retry race condition fixed** (`hooks/useVoiceCapture.ts`) — "Try again" during a voice answer used to silently fail on the first tap because a stray async event from the aborted previous session landed on the new session's listeners. Fixed with generation-tagged listeners and a short settle delay before restarting.
- **TTS now prefers an Enhanced-quality system voice** (`hooks/useQuestionVoice.ts`) when the device has one downloaded, instead of always using the lowest-quality default. Genuine premium neural TTS (ChatGPT-voice quality) remains a separate, bigger, not-yet-scoped feature requiring a backend call and real per-question cost.

## 4. Files touched this session

`prototype/expo/`: `hooks/useVoiceCapture.ts`, `hooks/useQuestionVoice.ts`, `constants/onboardingQuestions.ts`, `types/onboarding.ts`, `stores/onboardingStore.ts`, `features/onboarding/OnboardingCoordinator.tsx`, `features/onboarding/screens/ConversationScreen.tsx`, `features/onboarding/screens/IdentityConfirmScreen.tsx` (new), `features/onboarding/screens/CoachingTouchScreen.tsx` (new), `components/BackButton.tsx` (new), `package.json`/`package-lock.json` (added `expo-dev-client`, ESLint + `eslint-config-expo`), `app.json` (`ITSAppUsesNonExemptEncryption`), `eslint.config.js` (new, auto-generated).

`docs/`: this file, `expo-testing-guide.md`.

`decisions/`: `0006-onboarding-rejects-fixed-interview-requires-safety-gate.md`, `README.md` (index).
