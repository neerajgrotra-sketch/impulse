// Identity Engine's new capability (adr/0013 Part 2): rank Life Dimension
// relevance and generate inspiration content from it. Not a separate engine —
// per the reconciliation ADR, this is "model who the user is becoming"
// (Identity Engine's existing job), just with a new output field, called via
// Coach Engine's inspiration-generation turn shape.
import { anthropic, MODEL } from "./anthropicClient.ts";
import { findBannedWord } from "./bannedWords.ts";
import { isLifeDimension, LIFE_DIMENSIONS, type LifeDimension } from "./lifeDimensions.ts";
import { assembleInspirationPrompt } from "./promptBuilder.ts";

export interface RankedDimension {
  dimension: LifeDimension;
  relevance: number;
}

export interface GeneratedThought {
  id: string;
  dimension: LifeDimension;
  text: string;
}

export interface InspirationResult {
  rankedDimensions: RankedDimension[];
  thoughts: GeneratedThought[];
}

export class IdentityEngineError extends Error {}

// Structured-output JSON Schema only supports minItems/maxItems of 0 or 1 —
// arbitrary bounds (15 dimensions, ~20 thoughts) are enforced by the
// prompt instructions instead (assembleInspirationPrompt's layer1Task) and
// checked in code below (lintInspirationResult / the dimension-count check),
// not by the schema.
const INSPIRATION_SCHEMA = {
  type: "object",
  properties: {
    ranked_dimensions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimension: { type: "string", enum: LIFE_DIMENSIONS },
          relevance: { type: "number" },
        },
        required: ["dimension", "relevance"],
        additionalProperties: false,
      },
    },
    thoughts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimension: { type: "string", enum: LIFE_DIMENSIONS },
          text: { type: "string" },
        },
        required: ["dimension", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["ranked_dimensions", "thoughts"],
  additionalProperties: false,
} as const;

function extractJSONText(content: { type: string; text?: string }[]): string | null {
  const block = content.find((b) => b.type === "text");
  return block?.text ?? null;
}

/** Same content-quality bar decisions/0007 already established for the
 *  curated thought library — identity-shaped, never goal/wish-phrased,
 *  never containing a banned word. Applied here because the guarantee that
 *  was once "reviewed once, on a fixed 29-entry file" now has to hold across
 *  unbounded generated content instead (decisions/0012's own named risk). */
function lintThought(text: string): string | null {
  const bannedHit = findBannedWord(text);
  if (bannedHit) return `banned word "${bannedHit}"`;
  if (/^i (want|wish)\b/i.test(text.trim())) return "goal/wish-phrased, not identity-shaped";
  return null;
}

function lintInspirationResult(result: { thoughts: { text: string }[] }): string | null {
  for (const thought of result.thoughts) {
    const violation = lintThought(thought.text);
    if (violation) return violation;
  }
  return null;
}

// Structured-output JSON Schema can't express minItems/maxItems beyond 0/1
// (see INSPIRATION_SCHEMA's own comment), so layer1Task's "rank ALL 15
// dimensions, generate ~20 thoughts" is prompt text only — nothing stops the
// model from returning a technically-valid, near-empty response. Found on a
// real device: a terse/joking becoming_response ("I wanna be the very best")
// got back only 2 ranked dimensions and zero thoughts, which passed
// lintInspirationResult trivially (no thoughts means no thought can violate
// anything) and shipped as a 200 with nothing for Vision Canvas to show —
// silently, no error anywhere. This is the completeness half of that same
// quality bar, checked in code since the schema can't check it. Set well
// below the ~20 target (not requiring the model hit its target exactly) —
// still comfortably more than ThoughtStream needs to sustain a full session,
// since it only ever shows one bubble at a time.
export const MIN_THOUGHTS = 12;

export function findCompletenessViolation(result: {
  ranked_dimensions: { dimension: string }[];
  thoughts: { text: string }[];
}): string | null {
  const rankedCount = new Set(result.ranked_dimensions.map((d) => d.dimension)).size;
  if (rankedCount < LIFE_DIMENSIONS.length) {
    return `only ranked ${rankedCount} of the ${LIFE_DIMENSIONS.length} required Life Dimensions — every one must get a score`;
  }
  if (result.thoughts.length < MIN_THOUGHTS) {
    return `only generated ${result.thoughts.length} thoughts — at least ${MIN_THOUGHTS} are required, however short or plain the person's own answer was`;
  }
  return null;
}

async function callModel(userMessage: string, system: string, retryNote?: string) {
  return await anthropic.messages.create({
    model: MODEL.dialogue,
    max_tokens: 4096,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: INSPIRATION_SCHEMA },
    },
    system,
    messages: [
      { role: "user", content: retryNote ? `${userMessage}\n\n${retryNote}` : userMessage },
    ],
  });
}

export interface RankAndGenerateInput {
  firstName: string;
  becomingResponse: string;
}

// A single corrective retry (MAX_ATTEMPTS = 2) turned out not to be enough:
// hammering the live model with casual/terse becoming_response text (the
// realistic case this guardrail exists for) still under-generated on the
// second attempt roughly as often as the first — a genuinely playful/short
// answer seems to make the model commit to a "light" response and a single
// correction doesn't reliably break that. Bounded at 3 total attempts rather
// than looping unbounded, since this still must fail closed eventually
// rather than run forever on a persistently uncooperative response.
const MAX_ATTEMPTS = 3;

export async function rankDimensionsAndGenerateThoughts(
  input: RankAndGenerateInput,
): Promise<InspirationResult> {
  const { system, userMessage } = assembleInspirationPrompt({
    firstName: input.firstName,
    becomingResponse: input.becomingResponse,
    dimensionEnumValues: LIFE_DIMENSIONS,
  });

  let parsed: { ranked_dimensions: { dimension: string; relevance: number }[]; thoughts: { dimension: string; text: string }[] } | null = null;
  let violation: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const retryNote =
      violation === null
        ? undefined
        : `Your previous draft violated a rule: ${violation}. Regenerate the full response so it satisfies every rule — including ranking all ${LIFE_DIMENSIONS.length} Life Dimensions and generating at least ${MIN_THOUGHTS} thoughts — and re-check it before responding.`;

    let response;
    try {
      response = await callModel(userMessage, system, retryNote);
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        throw new IdentityEngineError(
          `inspiration generation failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      continue;
    }
    if (response.stop_reason === "refusal") {
      if (attempt === MAX_ATTEMPTS) {
        throw new IdentityEngineError("model declined to generate inspiration content");
      }
      continue;
    }

    const rawText = extractJSONText(response.content);
    if (!rawText) {
      if (attempt === MAX_ATTEMPTS) throw new IdentityEngineError("no text content returned");
      continue;
    }

    let attemptParsed: { ranked_dimensions: { dimension: string; relevance: number }[]; thoughts: { dimension: string; text: string }[] };
    try {
      attemptParsed = JSON.parse(rawText);
    } catch {
      if (attempt === MAX_ATTEMPTS) throw new IdentityEngineError("model output was not valid JSON");
      continue;
    }

    violation = lintInspirationResult(attemptParsed) ?? findCompletenessViolation(attemptParsed);
    if (!violation) {
      parsed = attemptParsed;
      break;
    }
    if (attempt === MAX_ATTEMPTS) {
      throw new IdentityEngineError(`inspiration content failed the content/completeness lint after ${MAX_ATTEMPTS} attempts: ${violation}`);
    }
  }

  // Unreachable in practice — the loop above always either returns a clean
  // `parsed` or throws on its final attempt — but satisfies the type checker
  // without an `as` cast.
  if (!parsed) throw new IdentityEngineError("inspiration generation produced no result");

  const rankedDimensions: RankedDimension[] = parsed.ranked_dimensions
    .filter((d): d is { dimension: LifeDimension; relevance: number } => isLifeDimension(d.dimension))
    .map((d) => ({ dimension: d.dimension, relevance: d.relevance }));

  const thoughts: GeneratedThought[] = parsed.thoughts
    .filter((t): t is { dimension: LifeDimension; text: string } => isLifeDimension(t.dimension))
    .map((t, i) => ({ id: `t${i + 1}`, dimension: t.dimension, text: t.text }));

  return { rankedDimensions, thoughts };
}
