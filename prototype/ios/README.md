# iOS — Demo Polish Mode

> **This is now the design specification, not the active build.** As of 2026-07, the investor demo is being rebuilt on React Native + Expo at [`prototype/expo/`](../expo/) — see [`docs/investor-prototype.md`](../../docs/investor-prototype.md)'s "Frontend update" note for why (no Mac in the build workflow). Every screen, timing, and piece of copy below is still the source of truth for *what to build*; this folder itself just isn't what ships. It's kept complete and unmodified as the reference implementation.

The full investor journey: Welcome → Consent → 8-question voice conversation → Thinking → Human Blueprint → The Promise → Understanding Confirmation. No tabs, no auth, no persistence — one linear flow.

## This folder is source only — no `.xcodeproj`

This environment has no Xcode/macOS toolchain, so no Xcode project file was generated here (a hand-authored `.pbxproj` is fragile and not worth the risk of a corrupt project file). To run it:

1. In Xcode: **File → New → Project → iOS → App**. Name it `ImpulseBlueprint`, interface: SwiftUI, language: Swift. Set the deployment target to **iOS 17.0** (the code uses `@Observable` and `AVAudioApplication.requestRecordPermission()`, both iOS 17+).
2. Delete the default `ContentView.swift` and the generated `ImpulseBlueprintApp.swift`.
3. Drag the `App/`, `Coordinator/`, `Store/`, `Models/`, `Services/`, `Screens/`, and `Components/` folders from this directory into the Xcode project (check "Copy items if needed" and "Create groups").
4. Add the required `Info.plist` entries (Xcode's generated `Info.plist` has neither — the app will crash on first mic/speech access without them):
   - `NSMicrophoneUsageDescription` — *"Impulse listens to your answers so it can understand you."*
   - `NSSpeechRecognitionUsageDescription` — *"Impulse transcribes your voice to build your Human Blueprint."*
5. Fill in `App/AppConfig.swift` with your Supabase project URL and anon key (see `../backend/README.md`).
6. Build and run on a real device or the simulator (voice input needs a real device for a real demo — the simulator's mic passthrough is unreliable).

## Architecture

One `@Observable` state machine (`OnboardingSessionStore`) drives everything; a single lightweight `PrototypeCoordinator` switches on `OnboardingPhase`. No per-screen ViewModel layer — at this scope (one real stateful screen, `ConversationView`) a full MVVM-per-screen setup is overhead the build doesn't need. See file-level comments for the reasoning behind each simplification.

```
ImpulseBlueprintApp
└── PrototypeCoordinator                  (switches on OnboardingPhase)
    ├── WelcomeView
    ├── ConsentView
    ├── ConversationView                  (re-driven per question via .task(id:))
    │   └── VoiceOrbView
    ├── ThinkingView                      (cinematic cycling category labels)
    ├── BlueprintView                     (editorial typography, no cards)
    │   └── EmphasizedText (repeated)     (renders *"quoted"* fragments as emphasis)
    ├── PromiseView                       (static, original, one line at a time)
    ├── UnderstandingConfirmationView     (slider + local-only optional note)
    └── ErrorRetryView
```

`App/DesignSystem.swift` holds the shared visual tokens (warm off-white ink, one sparing accent color, the dark gradient background, a small-caps "eyebrow" label helper) used across every screen in the journey — introduced in Demo Polish Mode so the whole flow reads as one considered thing rather than seven separately-styled screens.

## What's deliberately not here

Per the mission: no authentication, no notifications, no memory, no analytics, no Apple Health, no Recovery Engine, no adaptive coaching, no settings, no subscriptions, no long-term storage, no production architecture. See the top-level `../README.md` for what's cut and why.

## Known gaps to close before a real demo audience

- **Voice quality.** `QuestionVoicePlayer` uses the system TTS voice (`AVSpeechSynthesizer`), not a premium neural voice. `docs/investor-prototype.md` §6 flags this as the roadmap's biggest real risk against the "ChatGPT Voice" bar — swapping in pre-generated premium audio for the 8 fixed questions is a contained change (replace `QuestionVoicePlayer`'s implementation; nothing else depends on it). Not touched in Demo Polish Mode.
- **Manual "Done" button.** The conversation ends each answer on a tap, not automatic silence detection — a deliberate reliability choice for an untested build, not the original design.
- **Understanding Confirmation's edit field is local-only.** There is deliberately no second backend endpoint to send it to (the mission requires maintaining the single endpoint) — see the file's header comment and the top-level README's Demo Polish Mode section for the reasoning.
- **The Promise's copy hasn't been read aloud by a human yet.** It's original, but tone-setting prose like this needs a spoken read before it's shown to an investor, not just a text review.
