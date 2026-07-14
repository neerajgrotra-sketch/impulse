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
// arbitrary bounds (15 dimensions, 40-55 thoughts) are enforced by the
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

export async function rankDimensionsAndGenerateThoughts(
  input: RankAndGenerateInput,
): Promise<InspirationResult> {
  const { system, userMessage } = assembleInspirationPrompt({
    firstName: input.firstName,
    becomingResponse: input.becomingResponse,
    dimensionEnumValues: LIFE_DIMENSIONS,
  });

  let response;
  try {
    response = await callModel(userMessage, system);
  } catch (err) {
    throw new IdentityEngineError(
      `inspiration generation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (response.stop_reason === "refusal") {
    throw new IdentityEngineError("model declined to generate inspiration content");
  }

  const rawText = extractJSONText(response.content);
  if (!rawText) throw new IdentityEngineError("no text content returned");

  let parsed: { ranked_dimensions: { dimension: string; relevance: number }[]; thoughts: { dimension: string; text: string }[] };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new IdentityEngineError("model output was not valid JSON");
  }

  let violation = lintInspirationResult(parsed);
  if (violation) {
    // One deterministic retry, naming the exact violation — same pattern
    // generate-blueprint already uses for its own tone lint.
    try {
      const retryResponse = await callModel(
        userMessage,
        system,
        `Your previous draft violated a rule: ${violation}. Regenerate every thought so none violate that rule, and re-check each one before responding.`,
      );
      const retryText = extractJSONText(retryResponse.content);
      if (retryText) {
        parsed = JSON.parse(retryText);
        violation = lintInspirationResult(parsed);
      }
    } catch {
      // fall through — the violation check below still fires and fails closed
    }
  }
  if (violation) {
    throw new IdentityEngineError(`inspiration content failed content-quality lint twice: ${violation}`);
  }

  const rankedDimensions: RankedDimension[] = parsed.ranked_dimensions
    .filter((d): d is { dimension: LifeDimension; relevance: number } => isLifeDimension(d.dimension))
    .map((d) => ({ dimension: d.dimension, relevance: d.relevance }));

  const thoughts: GeneratedThought[] = parsed.thoughts
    .filter((t): t is { dimension: LifeDimension; text: string } => isLifeDimension(t.dimension))
    .map((t, i) => ({ id: `t${i + 1}`, dimension: t.dimension, text: t.text }));

  return { rankedDimensions, thoughts };
}
