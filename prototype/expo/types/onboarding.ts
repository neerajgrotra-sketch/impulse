/**
 * One question in the identity-capture conversation (`05 Onboarding.md` §3
 * Steps 2–3, PDR 0006). `kind` distinguishes the identity prompt (shows
 * starter chips) from the tiny reflection (freely skippable).
 */
export type OnboardingQuestion = {
  id: string;
  kind: "identity" | "reflection";
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
 *
 * `identity-confirm` and `coaching-touch` are new under PDR 0006 — the
 * spec's Step 2 statement-confirmation and Step 5 coaching touch, replacing
 * the old eight-question flow's straight run into `thinking`.
 *
 * `thinking` / `blueprint` are kept as valid phases — `ThinkingScreen` /
 * `ReflectionScreen` and the backend call they drive are real, working,
 * documented code, not deleted — but PDR 0006 means onboarding's default
 * flow no longer transitions into them. They're reachable only if a future,
 * separately-specced feature re-wires them (the PDR: "may still have a
 * place in the product later, but... needs its own spec").
 */
export type OnboardingPhase =
  | { status: "welcome" }
  | { status: "consent" }
  | { status: "conversation"; questionIndex: number }
  | { status: "identity-confirm" }
  | { status: "coaching-touch" }
  | { status: "thinking" }
  | { status: "blueprint" }
  | { status: "promise" }
  | { status: "confirmation" }
  | { status: "failed"; message: string };
