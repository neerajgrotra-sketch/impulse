/** One fixed question in the 8-question conversation. Ported from OnboardingQuestion.swift. */
export type OnboardingQuestion = {
  id: string;
  text: string;
};

/** One question/answer pair — the entire "conversation transcript" sent to the backend. */
export type TranscriptTurn = {
  questionKey: string;
  questionText: string;
  answerText: string;
};

/** Mirrors BLUEPRINT_SCHEMA in prototype/backend/supabase/functions/generate-blueprint/index.ts. */
export type BlueprintResponse = {
  title: string;
  whoYouAre: string;
  whatDrivesYou: string;
  theGap: string;
  strengths: { strength: string; quote: string }[];
  frictionPoints: { condition: string; quote: string }[];
  howIllCoachYou: string;
};

/**
 * Mirrors OnboardingPhase in the Swift prototype's OnboardingSessionStore —
 * a discriminated union so `conversation`'s question index and `failed`'s
 * message travel with the phase itself instead of as separate optional
 * fields on the store.
 */
export type OnboardingPhase =
  | { status: "welcome" }
  | { status: "consent" }
  | { status: "conversation"; questionIndex: number }
  | { status: "thinking" }
  | { status: "blueprint" }
  | { status: "promise" }
  | { status: "confirmation" }
  | { status: "failed"; message: string };
