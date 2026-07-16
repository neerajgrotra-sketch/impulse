// Coach Engine's onboarding-beat turn (adr/0013 Part 2) — not a separate
// "Next-Moment Engine": this is the same "Coach Engine chooses a move" step
// 04 AI Brain.md §3 already describes for ordinary dialogue turns, applied to
// the identity-capture surface's first-ever adaptive step. The model
// classifies and drafts; this module owns every branch — which Beat/Move is
// even legal on turn one, and what happens if the model returns something
// outside that legal set.
import { anthropic, MODEL } from "./anthropicClient.ts";
import { findBannedWord } from "./bannedWords.ts";
import type { LifeDimension } from "./lifeDimensions.ts";
import { assembleOnboardingBeatPrompt, type VisionFragmentInput } from "./promptBuilder.ts";

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

export class CoachEngineError extends Error {}

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
      `onboarding-beat generation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (response.stop_reason === "refusal") {
    throw new CoachEngineError("model declined to respond");
  }

  const rawText = extractJSONText(response.content);
  if (!rawText) throw new CoachEngineError("no text content returned");

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
    throw new CoachEngineError("model output was not valid JSON");
  }

  // Tone lint on the outbound message — same bar generate-blueprint already
  // applies, checked here in addition to the caller's own safety re-check.
  const bannedHit = findBannedWord(parsed.message);
  if (bannedHit) {
    throw new CoachEngineError(`generated message contained banned word "${bannedHit}"`);
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
