import { create } from "zustand";
import { onboardingQuestions } from "@/constants/onboardingQuestions";
import type { BlueprintResponse, OnboardingPhase, TranscriptTurn } from "@/types/onboarding";

/**
 * The single global onboarding store — one session, one linear pass, in
 * memory only, mirroring the Swift prototype's `OnboardingSessionStore`.
 * Nothing here persists beyond the app's lifetime; nothing here belongs to
 * any screen after this flow ends.
 *
 * Deliberately absent: recording/speaking/microphone state. That's
 * ephemeral per-screen device capability, not onboarding progress — it
 * lives in `hooks/useVoiceCapture` and `hooks/useQuestionVoice`, mirroring
 * the Swift split between `OnboardingSessionStore` (progress) and the
 * separate `SpeechRecognizer` / `QuestionVoicePlayer` services. Also
 * deliberately absent: a general-purpose `isLoading` flag — `ThinkingScreen`
 * being mounted *is* the loading signal (Milestone 5: the field existed
 * from Milestone 3 but nothing ever read it, so it was removed rather than
 * left as state that could silently drift from reality).
 *
 * The Blueprint request itself (services/blueprintApi.ts) is NOT called
 * from here — ThinkingScreen owns the fetch lifecycle (AbortController,
 * cancellation on unmount) and just calls the actions below to report the
 * outcome. That split mirrors Swift's `generateBlueprint()`/`retry()` being
 * store methods while still giving a React screen proper cleanup semantics.
 */
type OnboardingState = {
  phase: OnboardingPhase;
  transcript: TranscriptTurn[];
  blueprint: BlueprintResponse | null;
  understandingConfirmed: boolean | null;

  beginConsentFlow: () => void;
  beginConversation: () => void;
  /** Appends the answer for the current question and advances — or, after
   *  the last question, moves to `thinking`. Mirrors OnboardingSessionStore.recordAnswer. */
  recordAnswer: (answerText: string) => void;
  /** Called on a successful response — advances to `blueprint`. */
  blueprintSucceeded: (blueprint: BlueprintResponse) => void;
  /** Called on failure — moves to `failed`. `transcript` is untouched, so a
   *  retry has everything it needs without re-running onboarding. */
  blueprintFailed: (message: string) => void;
  /** Re-enters `thinking` with the same transcript — ThinkingScreen remounts
   *  and fires the request again. Mirrors OnboardingSessionStore.retry(). */
  retryBlueprintGeneration: () => void;
  /** Leaves the reflection screen for `promise` — mirrors OnboardingSessionStore.advanceFromBlueprint(). */
  advanceFromBlueprint: () => void;
  reset: () => void;
};

const initialState = {
  phase: { status: "welcome" } as OnboardingPhase,
  transcript: [] as TranscriptTurn[],
  blueprint: null as BlueprintResponse | null,
  understandingConfirmed: null as boolean | null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  beginConsentFlow: () => set({ phase: { status: "consent" } }),
  beginConversation: () => set({ phase: { status: "conversation", questionIndex: 0 } }),

  recordAnswer: (answerText) => {
    const { phase, transcript } = get();
    if (phase.status !== "conversation") return;

    const question = onboardingQuestions[phase.questionIndex];
    if (!question) return;

    const nextTranscript = [
      ...transcript,
      {
        questionKey: question.id,
        questionText: question.text,
        answerText: answerText.trim(),
      },
    ];

    const nextIndex = phase.questionIndex + 1;
    set({
      transcript: nextTranscript,
      phase:
        nextIndex < onboardingQuestions.length
          ? { status: "conversation", questionIndex: nextIndex }
          : { status: "thinking" },
    });
  },

  blueprintSucceeded: (blueprint) => set({ blueprint, phase: { status: "blueprint" } }),

  blueprintFailed: (message) => set({ phase: { status: "failed", message } }),

  retryBlueprintGeneration: () => set({ phase: { status: "thinking" } }),

  advanceFromBlueprint: () => set({ phase: { status: "promise" } }),

  reset: () => set({ ...initialState }),
}));
