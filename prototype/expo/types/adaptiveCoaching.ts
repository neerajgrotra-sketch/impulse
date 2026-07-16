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

export type HardStopResponse = {
  safety: { tier: "elevated" | "crisis"; hardStop: true; message: string };
  requestId: string;
};

/**
 * The adaptive-coaching phase machine — a separate, isolated store from
 * `stores/onboardingStore.ts`'s already-shipped PDR-0006 flow (AE-001 is a
 * parallel experiment, not a modification of it).
 */
export type AdaptivePhase =
  | { status: "name" }
  | { status: "moment-one" }
  | { status: "generating-inspiration" }
  | { status: "inspiration-vision" }
  | { status: "reviewing" }
  | { status: "coaching-beat"; beat: CoachingBeat; move: CoachingMove; message: string }
  | { status: "safety-hand-off"; message: string }
  | { status: "failed"; message: string };
