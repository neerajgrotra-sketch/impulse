// Coach Engine's onboarding-beat turn (adr/0013 Part 2) — not a separate
// "Next-Moment Engine": this is the same "Coach Engine chooses a move" step
// 04 AI Brain.md §3 already describes for ordinary dialogue turns, applied to
// the identity-capture surface's first-ever adaptive step. The model
// classifies and drafts; this module owns every branch — which Beat/Move is
// even legal on turn one, and what happens if the model returns something
// outside that legal set.
import Anthropic from "npm:@anthropic-ai/sdk";
import { anthropic, MODEL } from "./anthropicClient.ts";
import { findBannedWord } from "./bannedWords.ts";
import type { LifeDimension } from "./lifeDimensions.ts";
import {
  assembleFinalSynthesisPrompt,
  assembleOnboardingBeatPrompt,
  type FinalSynthesisFragmentInput,
  type VisionFragmentInput,
} from "./promptBuilder.ts";

export type CoachingBeat = "Reflection" | "Recognition" | "Clarification" | "Ownership";
export type CoachingMove = "Reflect" | "Reframe" | "Question" | "Contrast" | "Commit" | "Affirm" | "Hold-Silence";

/** Legal on this slice's single, first-ever adaptive turn — a code-owned
 *  restriction, not left to the model's own judgment (04 AI Brain.md §1: the
 *  backend owns what is allowed). Anything else the model returns is
 *  deterministically downgraded to "Affirm", flagged, never silently shipped. */
const FIRST_TURN_ELIGIBLE_MOVES: readonly CoachingMove[] = ["Reflect", "Question", "Affirm"];

export interface PsychologicalState {
  observed: string[];
  inferred: { statement: string; confidence: number }[];
  unknown: string[];
}

export interface OnboardingBeatResult {
  psychologicalState: PsychologicalState;
  chosenBeat: CoachingBeat;
  chosenMove: CoachingMove;
  message: string;
  rationaleCode: string;
  confidence: number;
  flags: string[];
  moveDowngraded: boolean;
}

/** `category` mirrors identityEngine.ts's `IdentityEngineErrorCategory` —
 *  same reasoning: it drives an honest HTTP status and an observable log
 *  field instead of collapsing every failure into one generic error. Added
 *  here specifically because `synthesizeUnderstanding` (the Understanding
 *  Review's final_synthesis call) previously had NO categorization and NO
 *  bounded retry at all — unlike identityEngine.ts's inspiration-generation
 *  call, a transient provider hiccup here failed the whole turn on its very
 *  first occurrence. See this file's `synthesizeUnderstanding` doc comment
 *  for the full root-cause writeup. */
export type CoachEngineErrorCategory = "timeout" | "overloaded" | "refusal" | "malformed_json" | "network" | "unknown";

export class CoachEngineError extends Error {
  readonly category: CoachEngineErrorCategory;
  constructor(category: CoachEngineErrorCategory, message: string) {
    super(message);
    this.category = category;
  }
}

/** Same classification identityEngine.ts's `categorizeCallError` uses, plus
 *  the one category that module's own postmortem
 *  (docs/experiments/AE-001-postmortem-and-design-review.md Part 1) named
 *  and never actually added anywhere: a 529 `overloaded_error` is an
 *  `Anthropic.InternalServerError` (any status >= 500), distinguished from a
 *  generic 5xx by the SDK's own parsed `.type` field — not a timeout, not a
 *  connection error, and not the same as "we have a bug." */
function categorizeCallError(err: unknown): CoachEngineErrorCategory {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (err instanceof Anthropic.APIConnectionError) return "network";
  if (err instanceof Anthropic.InternalServerError && err.type === "overloaded_error") return "overloaded";
  return "unknown";
}

// 300-900ms, matching the postmortem's own recommended range for
// identityEngine.ts's sibling fix — a short, jittered pause before retrying
// into a provider that just said "I'm overloaded," rather than an immediate
// retry straight back into the same condition.
const OVERLOAD_BACKOFF_BASE_MS = 300;
const OVERLOAD_BACKOFF_JITTER_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ONBOARDING_BEAT_SCHEMA = {
  type: "object",
  properties: {
    psychological_state: {
      type: "object",
      properties: {
        observed: { type: "array", items: { type: "string" } },
        inferred: {
          type: "array",
          items: {
            type: "object",
            properties: { statement: { type: "string" }, confidence: { type: "number" } },
            required: ["statement", "confidence"],
            additionalProperties: false,
          },
        },
        unknown: { type: "array", items: { type: "string" } },
      },
      required: ["observed", "inferred", "unknown"],
      additionalProperties: false,
    },
    chosen_beat: { type: "string", enum: ["Reflection", "Recognition", "Clarification", "Ownership"] },
    chosen_move: {
      type: "string",
      enum: ["Reflect", "Reframe", "Question", "Contrast", "Commit", "Affirm", "Hold-Silence"],
    },
    message: { type: "string" },
    rationale_code: { type: "string" },
    confidence: { type: "number" },
    flags: {
      type: "array",
      items: { type: "string", enum: ["safety_concern", "needs_more_context", "low_confidence", "user_distress"] },
    },
  },
  required: ["psychological_state", "chosen_beat", "chosen_move", "message", "rationale_code", "confidence", "flags"],
  additionalProperties: false,
} as const;

export type SynthesisConfidence = "low" | "medium" | "high";

export interface UnderstandingReview {
  headline: string;
  coreAspiration: string;
  interpretation: string;
  identityStatement: string;
  emergingThemes: string[];
  uncertainties: string[];
  confidence: SynthesisConfidence;
}

export interface SynthesizeUnderstandingInput {
  firstName: string;
  becomingResponse: string;
  visionCanvas: FinalSynthesisFragmentInput[];
  dismissedThoughts?: { text: string; source: "ai" | "fallback" | "user" }[];
  correctionNote?: string;
}

const UNDERSTANDING_REVIEW_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    core_aspiration: { type: "string" },
    interpretation: { type: "string" },
    identity_statement: { type: "string" },
    emerging_themes: { type: "array", items: { type: "string" } },
    uncertainties: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: [
    "headline",
    "core_aspiration",
    "interpretation",
    "identity_statement",
    "emerging_themes",
    "uncertainties",
    "confidence",
  ],
  additionalProperties: false,
} as const;

/** The only shape this function actually reads off an SDK response — kept
 *  minimal and structural (matches identityEngine.ts's own `ModelResponse`)
 *  so an injected fake in tests doesn't need to construct a real SDK
 *  `Message` object. */
export interface SynthesisModelResponse {
  stop_reason: string | null;
  content: { type: string; text?: string }[];
}

// Wall-clock budget for the model call(s) alone (original attempt + the one
// bounded retry) — same shape as identityEngine.ts's PROVIDER_BUDGET_MS, but
// this number is a reasoned choice, not yet a measured one: no acceptance
// harness exists for this specific call the way one does for inspiration
// generation (see the postmortem, Part 1). 60s leaves the 120s client-side
// FINAL_SYNTHESIS_TIMEOUT_MS (onboardingTurnApi.ts) real margin for the two
// classifyRisk calls this turn also makes (inbound + outbound) plus parsing.
const SYNTHESIS_PROVIDER_BUDGET_MS = 60_000;
const SYNTHESIS_MAX_ATTEMPTS = 2;

// Same reasoning as callModel above: the Understanding Review is this
// turn's whole deliverable, so it gets the model's real default effort.
// `timeout` + `maxRetries: 0` are set explicitly (previously neither was —
// see synthesizeUnderstanding's doc comment for why that was the real bug):
// without them the SDK falls back to its own defaults (a 10-MINUTE request
// timeout, and up to 2 of its own opaque, uncontrolled retries), which is
// far outside this turn's actual 120s client-visible budget and gives this
// module zero visibility into whether a retry ever happened.
async function callSynthesisModel(userMessage: string, system: string, timeoutMs: number): Promise<SynthesisModelResponse> {
  return await anthropic.messages.create(
    {
      model: MODEL.dialogue,
      max_tokens: 2048,
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: UNDERSTANDING_REVIEW_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: userMessage }],
    },
    { timeout: timeoutMs, maxRetries: 0 },
  );
}

type RawUnderstandingReview = {
  headline: string;
  core_aspiration: string;
  interpretation: string;
  identity_statement: string;
  emerging_themes: string[];
  uncertainties: string[];
  confidence: SynthesisConfidence;
};

/**
 * Root cause of the Understanding Review (Moment 3) failures this function
 * was rebuilt to fix: this call had NO explicit timeout, NO bounded retry,
 * and NO error categorization — every other model call in this slice
 * (identityEngine.ts's generateInspiration, this same file's
 * chooseOnboardingBeat) at least retries once; this one didn't, so the
 * exact provider-overload condition the postmortem already root-caused for
 * the sibling inspiration-generation call
 * (docs/experiments/AE-001-postmortem-and-design-review.md Part 1) failed
 * this turn on its very first occurrence, with no distinction from a real
 * bug. `modelCall` is injectable (defaults to the real call) so tests can
 * exercise the retry/backoff/categorization logic without a network call,
 * matching identityEngine.ts's own dependency-injection convention.
 */
export async function synthesizeUnderstanding(
  input: SynthesizeUnderstandingInput,
  modelCall: (userMessage: string, system: string, timeoutMs: number) => Promise<SynthesisModelResponse> = callSynthesisModel,
): Promise<UnderstandingReview> {
  const { system, userMessage } = assembleFinalSynthesisPrompt(input);

  const startedAt = Date.now();
  let parsed: RawUnderstandingReview | null = null;

  for (let attempt = 1; attempt <= SYNTHESIS_MAX_ATTEMPTS; attempt += 1) {
    const remaining = SYNTHESIS_PROVIDER_BUDGET_MS - (Date.now() - startedAt);
    if (remaining <= 0) {
      throw new CoachEngineError(
        "timeout",
        `exceeded the ${SYNTHESIS_PROVIDER_BUDGET_MS}ms provider budget before attempt ${attempt} could start`,
      );
    }

    let response: SynthesisModelResponse;
    try {
      response = await modelCall(userMessage, system, remaining);
    } catch (err) {
      const category = categorizeCallError(err);
      // A real timeout means the budget itself is exhausted — never spend
      // the bounded retry chasing a request that already used its share of
      // the clock (same rule identityEngine.ts's own retry loop applies).
      if (attempt === SYNTHESIS_MAX_ATTEMPTS || category === "timeout") {
        throw new CoachEngineError(
          category,
          `final-synthesis generation failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      // The provider just said "I'm overloaded" — retrying immediately into
      // the same condition is exactly what let a transient capacity blip
      // read as a hard product failure. A short jittered backoff gives it a
      // real chance to clear before the one bounded retry is spent.
      if (category === "overloaded") {
        await sleep(OVERLOAD_BACKOFF_BASE_MS + Math.random() * OVERLOAD_BACKOFF_JITTER_MS);
      }
      continue;
    }

    if (response.stop_reason === "refusal") {
      if (attempt === SYNTHESIS_MAX_ATTEMPTS) throw new CoachEngineError("refusal", "model declined to respond");
      continue;
    }

    const rawText = extractJSONText(response.content);
    if (!rawText) {
      if (attempt === SYNTHESIS_MAX_ATTEMPTS) throw new CoachEngineError("malformed_json", "no text content returned");
      continue;
    }

    try {
      parsed = JSON.parse(rawText);
    } catch {
      if (attempt === SYNTHESIS_MAX_ATTEMPTS) throw new CoachEngineError("malformed_json", "model output was not valid JSON");
      continue;
    }
    break;
  }

  // Unreachable in practice — the loop above always either returns a clean
  // `parsed` or throws on its final attempt — but satisfies the type checker
  // without an `as` cast (same convention as identityEngine.ts).
  if (!parsed) throw new CoachEngineError("unknown", "final-synthesis generation produced no result");

  // Tone lint on every generated prose field — same bar chooseOnboardingBeat
  // already applies to its own message.
  for (const field of [parsed.headline, parsed.core_aspiration, parsed.interpretation, parsed.identity_statement]) {
    const bannedHit = findBannedWord(field);
    if (bannedHit) {
      throw new CoachEngineError("unknown", `generated understanding review contained banned word "${bannedHit}"`);
    }
  }

  return {
    headline: parsed.headline,
    coreAspiration: parsed.core_aspiration,
    interpretation: parsed.interpretation,
    identityStatement: parsed.identity_statement,
    emergingThemes: parsed.emerging_themes,
    uncertainties: parsed.uncertainties,
    confidence: parsed.confidence,
  };
}

function extractJSONText(content: { type: string; text?: string }[]): string | null {
  const block = content.find((b) => b.type === "text");
  return block?.text ?? null;
}

// Same reasoning as identityEngine.ts's callModel: Sonnet 5 scopes down at
// "medium" or lower, and this call's psychological_state/message output
// deserves the model's actual default effort, not one step under it.
async function callModel(userMessage: string, system: string) {
  return await anthropic.messages.create({
    model: MODEL.dialogue,
    max_tokens: 2048,
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: ONBOARDING_BEAT_SCHEMA },
    },
    system,
    messages: [{ role: "user", content: userMessage }],
  });
}

export interface ChooseBeatInput {
  firstName: string;
  becomingResponse: string;
  rankedDimensions: { dimension: LifeDimension; relevance: number }[];
  visionCanvas: VisionFragmentInput[];
}

export async function chooseOnboardingBeat(input: ChooseBeatInput): Promise<OnboardingBeatResult> {
  const { system, userMessage } = assembleOnboardingBeatPrompt(input);

  let response;
  try {
    response = await callModel(userMessage, system);
  } catch (err) {
    throw new CoachEngineError(
      categorizeCallError(err),
      `onboarding-beat generation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (response.stop_reason === "refusal") {
    throw new CoachEngineError("refusal", "model declined to respond");
  }

  const rawText = extractJSONText(response.content);
  if (!rawText) throw new CoachEngineError("malformed_json", "no text content returned");

  let parsed: {
    psychological_state: PsychologicalState;
    chosen_beat: CoachingBeat;
    chosen_move: CoachingMove;
    message: string;
    rationale_code: string;
    confidence: number;
    flags: string[];
  };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new CoachEngineError("malformed_json", "model output was not valid JSON");
  }

  // Tone lint on the outbound message — same bar generate-blueprint already
  // applies, checked here in addition to the caller's own safety re-check.
  const bannedHit = findBannedWord(parsed.message);
  if (bannedHit) {
    throw new CoachEngineError("unknown", `generated message contained banned word "${bannedHit}"`);
  }

  // Move-eligibility guard — deterministic, in code, cannot be talked out of
  // by the model's own stated confidence.
  const moveDowngraded = !FIRST_TURN_ELIGIBLE_MOVES.includes(parsed.chosen_move);
  const chosenMove: CoachingMove = moveDowngraded ? "Affirm" : parsed.chosen_move;

  return {
    psychologicalState: parsed.psychological_state,
    chosenBeat: parsed.chosen_beat,
    chosenMove,
    message: parsed.message,
    rationaleCode: moveDowngraded
      ? `${parsed.rationale_code}; move downgraded from ${parsed.chosen_move} to Affirm (not eligible on first turn)`
      : parsed.rationale_code,
    confidence: parsed.confidence,
    flags: parsed.flags,
    moveDowngraded,
  };
}
