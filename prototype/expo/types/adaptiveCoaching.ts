import type { LifeDimension } from "@/constants/lifeDimensions";

/** Mirrors the backend's safetyEngine.ts tiers (docs/15 Constitution.md §3.1). */
export type SafetyTier = "none" | "low" | "elevated" | "crisis";

/** One of the four Coaching Beats legal on this slice's single adaptive turn
 * (adr/0013's vocabulary — never "Moment," never "Experience/Moment Engine"). */
export type CoachingBeat = "Reflection" | "Recognition" | "Clarification" | "Ownership";

/** Canon §2's Coaching Move enum, verbatim. */
export type CoachingMove = "Reflect" | "Reframe" | "Question" | "Contrast" | "Commit" | "Affirm" | "Hold-Silence";

export type RankedDimension = {
  dimension: LifeDimension;
  relevance: number;
};

/** Provenance of a thought's actual TEXT — distinct from `VisionFragment.origin`
 *  (which records how it entered the Canvas). "ai" = the model generated it
 *  this session, grounded in the person's own statement. "fallback" =
 *  `pickContextualThoughts` (constants/thoughtLibrary.ts), offered only
 *  after the 8-second generation budget was exceeded — must never be
 *  presented as AI output. "user" = typed or spoken by the person directly.
 *  The whole point of this field: the UI can always answer "did the AI
 *  actually say this?" truthfully. */
export type ThoughtSource = "ai" | "fallback" | "user";

export type GeneratedThought = {
  id: string;
  dimension: LifeDimension;
  text: string;
  source: ThoughtSource;
};

/**
 * One Vision Canvas fragment (decisions/0012 — up to 5, replacing the single
 * free-text vision card). `origin` records how it entered the Canvas, purely
 * so `deriveIdentityStatement` is applied only to `thought_tap` fragments —
 * never to typed/spoken content, per PDR 0007's verbatim rule.
 */
export type VisionFragment = {
  id: string;
  text: string;
  origin: "thought_tap" | "typed" | "spoken";
  /** True once the user has edited a thought-tap-derived fragment away from
   * its original generated wording — feeds the "accepted AI wording vs.
   * manual edits" telemetry signal without storing what changed. */
  edited: boolean;
  /** See `ThoughtSource` — carried onto the fragment so a fallback-derived
   *  or user-authored entry can still be told apart from real AI output
   *  anywhere downstream (Vision Canvas display, telemetry, debug overlay). */
  source: ThoughtSource;
};

export type PsychologicalState = {
  observed: string[];
  inferred: { statement: string; confidence: number }[];
  unknown: string[];
};

export type InspirationResponse = {
  safety: { tier: SafetyTier; hardStop: false };
  rankedDimensions: RankedDimension[];
  thoughts: GeneratedThought[];
  requestId: string;
  promptVersion: string;
  latencyMs: number;
  retryCount: number;
};

export type OnboardingBeatResponse = {
  safety: { tier: SafetyTier; hardStop: false };
  psychologicalState: PsychologicalState;
  chosenBeat: CoachingBeat;
  chosenMove: CoachingMove;
  message: string;
  rationaleCode: string;
  confidence: number;
  moveDowngraded: boolean;
  promptVersion: string;
  latencyMs: number;
};

/** AE-001's terminal turn — replaces `onboarding_beat`'s role as the final
 *  screen's content source (see the postmortem this responds to,
 *  docs/experiments/AE-001-postmortem-and-design-review.md Part 6, on why a
 *  single uniformly-confident-voice output is the wrong shape here). A
 *  synthesized interpretation, never a concatenation of the selected Vision
 *  Canvas fragments. */
export type UnderstandingReview = {
  headline: string;
  coreAspiration: string;
  interpretation: string;
  identityStatement: string;
  emergingThemes: string[];
  uncertainties: string[];
  confidence: "low" | "medium" | "high";
};

export type FinalSynthesisResponse = {
  safety: { tier: SafetyTier; hardStop: false };
  understanding: UnderstandingReview;
  requestId: string;
  promptVersion: string;
  latencyMs: number;
};

export type HardStopResponse = {
  safety: { tier: "elevated" | "crisis"; hardStop: true; message: string };
  requestId: string;
};

/** One exchange in the adaptive-questioning engine's conversation — the
 *  architecture the AE-001 postmortem's "Option B/C" direction named
 *  (docs/experiments/AE-001-postmortem-and-design-review.md Part 3, Part 6),
 *  built now as real backend infrastructure ahead of a full onboarding
 *  re-choreography. Not currently rendered by any shipped screen — see
 *  `requestNextQuestion` in services/onboardingTurnApi.ts. */
export type AdaptiveQuestionTurn = {
  question: string;
  answer: string;
};

export type AdaptiveQuestionResponse = {
  safety: { tier: SafetyTier; hardStop: false };
  psychologicalState: PsychologicalState;
  /** Empty when `done` is true (nothing further to ask). */
  question: string;
  /** 3-5 short, concretely differentiated answer directions — never an
   *  8-item uniformly-confident menu. Empty when `done` is true. */
  options: string[];
  allowFreeText: boolean;
  /** True once the engine has enough understanding to move to
   *  synthesizeUnderstanding's final review — either the model's own
   *  judgment, or the code-enforced turn ceiling (adaptiveInterviewEngine.ts's
   *  MAX_ADAPTIVE_TURNS). */
  done: boolean;
  doneReason: string;
  requestId: string;
  promptVersion: string;
  latencyMs: number;
};

/**
 * The adaptive-coaching phase machine — a separate, isolated store from
 * `stores/onboardingStore.ts`'s already-shipped PDR-0006 flow (AE-001 is a
 * parallel experiment, not a modification of it).
 */
export type AdaptivePhase =
  | { status: "opening" }
  | { status: "name" }
  | { status: "moment-one" }
  | { status: "generating-inspiration" }
  | { status: "inspiration-vision" }
  | { status: "reviewing" }
  | { status: "understanding-review" }
  | { status: "safety-hand-off"; message: string };
