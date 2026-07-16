// Identity Engine's inspiration-generation turn — rebuilt as the smallest
// reliable vertical slice after the previous rank-15-dimensions/generate-~20
// approach was found, on real devices, to produce latency routinely in the
// 30-50s range (up to 3 model attempts, each a large ask) with no way for
// the UI to tell an AI thought from a curated fallback one. This version:
// one model call, exactly one job pair (classify risk, generate 8 thoughts
// grounded in what the person actually said), a bounded provider-call
// budget, and at most one bounded retry inside it.
//
// Timing budget, three layers with deliberate margin (not three timers
// racing each other — see each constant's own comment below):
//   PROVIDER_BUDGET_MS  (6.5s) — the model call(s) themselves.
//   SERVER_TOTAL_BUDGET_MS (8s) — this function's whole return, including
//                                 parsing/validation/derivation overhead.
//   Client timeout (10s, onboardingTurnApi.ts) — gives the server room to
//                                 finish classifying its own failure and
//                                 return a structured 504 before the client
//                                 gives up and reports a generic abort.
// Only PROVIDER_BUDGET_MS is enforced with an actual abort (via the SDK's
// per-request `timeout`) — SERVER_TOTAL_BUDGET_MS is a target backed by
// margin (parsing ~8 short JSON objects is sub-millisecond work) and
// checked observably (onboarding-turn/index.ts logs `over_budget: true` if
// it's ever exceeded) rather than a second abort mechanism, since aborting
// AFTER the model has already answered would throw away a completed,
// usable result for no benefit.
//
// Folding risk classification into this same call — rather than a separate
// classifier call ahead of it — is decisions/0010's own endorsed shape
// ("folding real per-turn risk-tier classification into the Engine's
// required call... is the correct resolution shape for PDR 0006's gap"),
// not a new safety posture invented for this rebuild. The model classifies;
// mapTierToAction (safetyEngine.ts) still makes the actual proceed/hard-stop
// decision in code, and the caller (onboarding-turn/index.ts) MUST discard
// rankedDimensions/thoughts whenever the returned tier hard-stops — this
// call always runs once regardless of tier (there is no cheaper way to know
// the tier without running it), but a hard-stop tier must still mean the
// generated content is never shown.
import Anthropic from "npm:@anthropic-ai/sdk";
import { anthropic, MODEL } from "./anthropicClient.ts";
import { findBannedWord } from "./bannedWords.ts";
import { isLifeDimension, LIFE_DIMENSIONS, type LifeDimension } from "./lifeDimensions.ts";
import { assembleInspirationPrompt } from "./promptBuilder.ts";
import type { SafetyTier } from "./safetyEngine.ts";

export interface RankedDimension {
  dimension: LifeDimension;
  relevance: number;
}

export type ThoughtSource = "ai";

export interface GeneratedThought {
  id: string;
  dimension: LifeDimension;
  text: string;
  source: ThoughtSource;
}

export interface InspirationResult {
  safety: { tier: SafetyTier; rationaleCode: string };
  rankedDimensions: RankedDimension[];
  thoughts: GeneratedThought[];
  meta: {
    attempts: number;
    providerLatencyMs: number;
    parseLatencyMs: number;
  };
}

/** `category` drives OBSERVABILITY's "error category" log field and lets
 *  the endpoint pick an honest HTTP status (504 for a real timeout, 502 for
 *  everything else) instead of collapsing every failure into one code. */
export type IdentityEngineErrorCategory =
  | "timeout"
  | "refusal"
  | "malformed_json"
  | "incomplete_or_invalid"
  | "network"
  | "unknown";

export class IdentityEngineError extends Error {
  readonly category: IdentityEngineErrorCategory;
  constructor(category: IdentityEngineErrorCategory, message: string) {
    super(message);
    this.category = category;
  }
}

// Structured-output JSON Schema only supports minItems/maxItems of 0 or 1 —
// "exactly 8" is enforced by the prompt instruction plus the code-level
// count check below (validateThoughtCount), not by the schema.
const INSPIRATION_SCHEMA = {
  type: "object",
  properties: {
    safety: {
      type: "object",
      properties: {
        tier: { type: "string", enum: ["none", "low", "elevated", "crisis"] },
        rationale_code: { type: "string" },
      },
      required: ["tier", "rationale_code"],
      additionalProperties: false,
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
  required: ["safety", "thoughts"],
  additionalProperties: false,
} as const;

type RawInspirationResponse = {
  safety: { tier: string; rationale_code: string };
  thoughts: { dimension: string; text: string }[];
};

/** The only shape this module actually reads off an SDK response — kept
 *  minimal and structural (not `Anthropic.Message`) so a test's fake
 *  `modelCall` doesn't need to construct a real SDK object, matching this
 *  codebase's dependency-injection-over-module-mocking convention (see
 *  safetyEngine.ts's own injectable `classifier` param). */
export interface ModelResponse {
  stop_reason: string | null;
  content: { type: string; text?: string }[];
}

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

// The target is exactly 8; this range tolerates minor model variance
// without either silently accepting a near-empty response (the real
// under-generation failure this guardrail exists to catch — see
// identityEngine's git history) or demanding a brittle exact match.
const TARGET_THOUGHT_COUNT = 8;
const MIN_THOUGHT_COUNT = 6;
const MAX_THOUGHT_COUNT = 10;

export function findThoughtSetViolation(result: { thoughts: { text: string }[] }): string | null {
  if (result.thoughts.length < MIN_THOUGHT_COUNT || result.thoughts.length > MAX_THOUGHT_COUNT) {
    return `generated ${result.thoughts.length} thoughts — expected close to ${TARGET_THOUGHT_COUNT} (between ${MIN_THOUGHT_COUNT} and ${MAX_THOUGHT_COUNT})`;
  }
  for (const thought of result.thoughts) {
    const violation = lintThought(thought.text);
    if (violation) return violation;
  }
  return null;
}

function isValidTier(value: string): value is SafetyTier {
  return value === "none" || value === "low" || value === "elevated" || value === "crisis";
}

// Wall-clock budget for the model call(s) alone (original attempt + the one
// bounded retry), not per-attempt — a slow first attempt must leave less
// room for a retry, never reset the clock. Each individual model call is
// given whatever budget remains via the SDK's own per-request `timeout`, so
// a hung request can't silently consume the entire window. Set below
// SERVER_TOTAL_BUDGET_MS (not equal to it) so parsing/validation/derivation
// and the endpoint's own logging always have slack left, rather than racing
// the provider call to the same instant.
const PROVIDER_BUDGET_MS = 6_500;

// Documented target for generateInspiration's total return time (provider
// call(s) + parse + validate + derive rankedDimensions). Not independently
// enforced with its own abort — see this file's header comment for why —
// but onboarding-turn/index.ts logs an explicit `over_budget` flag if actual
// latency ever exceeds it, so a violated assumption is observable rather
// than silently eating into the client's own margin.
export const SERVER_TOTAL_BUDGET_MS = 8_000;

const MAX_ATTEMPTS = 2;

function categorizeCallError(err: unknown): IdentityEngineErrorCategory {
  // The SDK's error classes don't set `.name`/`.message` predictably enough
  // to string-match — `instanceof` against the actual classes is the
  // reliable check. APIConnectionTimeoutError extends APIConnectionError,
  // so it's checked first (order matters).
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (err instanceof Anthropic.APIConnectionError) return "network";
  return "unknown";
}

async function callModel(userMessage: string, system: string, timeoutMs: number, retryNote?: string): Promise<ModelResponse> {
  return await anthropic.messages.create(
    {
      model: MODEL.dialogue,
      max_tokens: 1024,
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: INSPIRATION_SCHEMA },
      },
      system,
      messages: [
        { role: "user", content: retryNote ? `${userMessage}\n\n${retryNote}` : userMessage },
      ],
    },
    // maxRetries: 0 — retries are this module's own bounded loop, not the
    // SDK's, so every attempt is visible to and counted by our own budget.
    { timeout: timeoutMs, maxRetries: 0 },
  );
}

export interface GenerateInspirationInput {
  firstName: string;
  becomingResponse: string;
}

/** `modelCall` is injectable (defaults to the real Sonnet call) so tests can
 *  exercise the retry/timeout/refusal/malformed-JSON logic below — the
 *  actual load-bearing code in this module — without a network call or a
 *  real API key, matching this codebase's dependency-injection-over-
 *  module-mocking convention (safetyEngine.ts's `classifyRisk` does the
 *  same for its own classifier call). */
export async function generateInspiration(
  input: GenerateInspirationInput,
  modelCall: (userMessage: string, system: string, timeoutMs: number, retryNote?: string) => Promise<ModelResponse> = callModel,
): Promise<InspirationResult> {
  const { system, userMessage } = assembleInspirationPrompt({
    firstName: input.firstName,
    becomingResponse: input.becomingResponse,
    dimensionEnumValues: LIFE_DIMENSIONS,
  });

  const startedAt = Date.now();
  let providerLatencyMs = 0;
  let parsed: RawInspirationResponse | null = null;
  let violation: string | null = null;
  let attempts = 0;

  for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
    const remaining = PROVIDER_BUDGET_MS - (Date.now() - startedAt);
    if (remaining <= 0) {
      throw new IdentityEngineError(
        "timeout",
        `exceeded the ${PROVIDER_BUDGET_MS}ms provider budget before attempt ${attempts} could start`,
      );
    }

    const retryNote =
      violation === null
        ? undefined
        : `Your previous draft violated a rule: ${violation}. Regenerate the full response so it satisfies every rule, including generating close to ${TARGET_THOUGHT_COUNT} thoughts, and re-check it before responding.`;

    const attemptStartedAt = Date.now();
    let response: ModelResponse;
    try {
      response = await modelCall(userMessage, system, remaining, retryNote);
    } catch (err) {
      providerLatencyMs += Date.now() - attemptStartedAt;
      const category = categorizeCallError(err);
      if (attempts === MAX_ATTEMPTS || category === "timeout") {
        throw new IdentityEngineError(
          category,
          `inspiration generation failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      continue;
    }
    providerLatencyMs += Date.now() - attemptStartedAt;

    if (response.stop_reason === "refusal") {
      if (attempts === MAX_ATTEMPTS) {
        throw new IdentityEngineError("refusal", "model declined to generate inspiration content");
      }
      continue;
    }

    const rawText = extractJSONText(response.content);
    if (!rawText) {
      if (attempts === MAX_ATTEMPTS) throw new IdentityEngineError("malformed_json", "no text content returned");
      continue;
    }

    let attemptParsed: RawInspirationResponse;
    try {
      attemptParsed = JSON.parse(rawText);
    } catch {
      if (attempts === MAX_ATTEMPTS) throw new IdentityEngineError("malformed_json", "model output was not valid JSON");
      continue;
    }

    if (!attemptParsed.safety || !isValidTier(attemptParsed.safety.tier)) {
      violation = "missing or invalid safety.tier";
      if (attempts === MAX_ATTEMPTS) {
        throw new IdentityEngineError("incomplete_or_invalid", `inspiration content failed validation after ${MAX_ATTEMPTS} attempts: ${violation}`);
      }
      continue;
    }

    violation = findThoughtSetViolation(attemptParsed);
    if (!violation) {
      parsed = attemptParsed;
      break;
    }
    if (attempts === MAX_ATTEMPTS) {
      throw new IdentityEngineError(
        "incomplete_or_invalid",
        `inspiration content failed the content/completeness lint after ${MAX_ATTEMPTS} attempts: ${violation}`,
      );
    }
  }

  // Unreachable in practice — the loop above always either returns a clean
  // `parsed` or throws on its final attempt — but satisfies the type checker
  // without an `as` cast.
  if (!parsed) throw new IdentityEngineError("unknown", "inspiration generation produced no result");

  const parseStartedAt = Date.now();
  const thoughts: GeneratedThought[] = parsed.thoughts
    .filter((t): t is { dimension: LifeDimension; text: string } => isLifeDimension(t.dimension))
    .map((t, i) => ({ id: `t${i + 1}`, dimension: t.dimension, text: t.text, source: "ai" }));

  // rankedDimensions is derived here, in code, from the 8 thoughts' own
  // dimension tags — not a separate "rank all 15 dimensions" model
  // instruction (that requirement, on top of generation, was a real
  // contributor to the old under-generation/latency failures). It exists
  // only so the downstream onboarding_beat turn (coachEngine.ts, out of
  // scope for this rebuild) still has a `topDimensions` signal to read;
  // it is coarser than a real per-dimension ranking and callers should
  // treat it that way.
  const counts = new Map<LifeDimension, number>();
  for (const t of thoughts) counts.set(t.dimension, (counts.get(t.dimension) ?? 0) + 1);
  const rankedDimensions: RankedDimension[] = [...counts.entries()].map(([dimension, count]) => ({
    dimension,
    relevance: count / thoughts.length,
  }));
  const parseLatencyMs = Date.now() - parseStartedAt;

  // Already validated inside the loop (isValidTier gated `parsed` ever being
  // assigned) — re-checked here only so the type narrows at the point of
  // use, without an `as` cast.
  const tier = parsed.safety.tier;
  if (!isValidTier(tier)) throw new IdentityEngineError("unknown", "unreachable: tier already validated");

  return {
    safety: { tier, rationaleCode: parsed.safety.rationale_code },
    rankedDimensions,
    thoughts,
    meta: { attempts, providerLatencyMs, parseLatencyMs },
  };
}
