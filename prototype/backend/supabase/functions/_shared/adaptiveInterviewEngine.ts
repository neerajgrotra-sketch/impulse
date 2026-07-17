// The adaptive-questioning engine — the architecture the AE-001 postmortem's
// "Option B/C" direction named as the likely conclusion of a proper Design
// Council pass (docs/experiments/AE-001-postmortem-and-design-review.md
// Part 3, Part 4, Part 6), authorized to be built now, ahead of that full
// re-choreography, as real working infrastructure rather than a design doc.
//
// What this replaces: "generate 8 identity statements from one answer,
// immediately." What it does instead: ask ONE good curious follow-up
// question at a time, each grounded in everything said so far, until enough
// is understood to move to a synthesized understanding (coachEngine.ts's
// synthesizeUnderstanding) — the same Observed/Inferred/Unknown discipline
// `chooseOnboardingBeat` already applies, extended one step earlier and
// applied turn-over-turn instead of once.
//
// This module deliberately does NOT decide how many moments the onboarding
// journey has, does not wire itself into AE-001's shipped coordinator/store,
// and does not replace the current 3-Moment flow — it is the engine a future
// adaptive-interview screen would call, built and tested now so that future
// work is "wire up a screen," not "invent the backend turn from scratch."
//
// Reliability posture matches identityEngine.ts / coachEngine.ts exactly
// (explicit per-call timeout + `maxRetries: 0`, a bounded retry loop with
// backoff on a genuine provider overload, honest error categorization) —
// this is the THIRD time this exact shape has been built in this codebase;
// see coachEngine.ts's synthesizeUnderstanding for the root-cause writeup on
// why every model call needs it, not just the ones that have already broken
// in production.
import Anthropic from "npm:@anthropic-ai/sdk";
import { anthropic, MODEL } from "./anthropicClient.ts";
import { findBannedWord } from "./bannedWords.ts";
import type { PsychologicalState } from "./coachEngine.ts";
import { assembleAdaptiveQuestionPrompt, type AdaptiveQuestionTurnInput } from "./promptBuilder.ts";

export type AdaptiveInterviewErrorCategory = "timeout" | "overloaded" | "refusal" | "malformed_json" | "network" | "unknown";

export class AdaptiveInterviewError extends Error {
  readonly category: AdaptiveInterviewErrorCategory;
  constructor(category: AdaptiveInterviewErrorCategory, message: string) {
    super(message);
    this.category = category;
  }
}

function categorizeCallError(err: unknown): AdaptiveInterviewErrorCategory {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (err instanceof Anthropic.APIConnectionError) return "network";
  if (err instanceof Anthropic.InternalServerError && err.type === "overloaded_error") return "overloaded";
  return "unknown";
}

const OVERLOAD_BACKOFF_BASE_MS = 300;
const OVERLOAD_BACKOFF_JITTER_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Hard, code-enforced ceiling — the model's own `done` signal is never
 *  trusted alone (same "the model classifies, code decides" rule every
 *  other engine in this slice applies). Chosen to land inside the "5-8
 *  adaptive moments" range named when this engine was authorized; revisit
 *  once real usage data exists — this is a reasoned placeholder, not a
 *  measured product decision. */
export const MAX_ADAPTIVE_TURNS = 6;

const OPTIONS_MIN = 3;
const OPTIONS_MAX = 5;

export interface NextQuestionInput {
  firstName: string;
  becomingResponse: string;
  history: AdaptiveQuestionTurnInput[];
}

export interface NextQuestionResult {
  psychologicalState: PsychologicalState;
  question: string;
  options: string[];
  allowFreeText: boolean;
  done: boolean;
  doneReason: string;
  meta: { attempts: number; modelCalled: boolean };
}

const ADAPTIVE_QUESTION_SCHEMA = {
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
    question: { type: "string" },
    options: { type: "array", items: { type: "string" } },
    allow_free_text: { type: "boolean" },
    done: { type: "boolean" },
    done_reason: { type: "string" },
  },
  required: ["psychological_state", "question", "options", "allow_free_text", "done", "done_reason"],
  additionalProperties: false,
} as const;

type RawNextQuestion = {
  psychological_state: PsychologicalState;
  question: string;
  options: string[];
  allow_free_text: boolean;
  done: boolean;
  done_reason: string;
};

/** The only shape this module reads off an SDK response — matches
 *  identityEngine.ts's own `ModelResponse` / coachEngine.ts's
 *  `SynthesisModelResponse` so an injected fake in tests doesn't need a real
 *  SDK object. */
export interface AdaptiveQuestionModelResponse {
  stop_reason: string | null;
  content: { type: string; text?: string }[];
}

function extractJSONText(content: { type: string; text?: string }[]): string | null {
  const block = content.find((b) => b.type === "text");
  return block?.text ?? null;
}

/** Options must be a genuinely differentiated, bounded set (Option C's
 *  "fewer, better, honestly differentiated" bar, per the postmortem's Design
 *  Council pass — never an 8-item uniformly-confident menu), never contain
 *  a banned word, and the question must never exactly repeat one already
 *  asked (the concrete "adaptive" failure mode: asking the same thing twice
 *  because nothing tracked what was already covered). */
export function findAdaptiveQuestionViolation(
  result: { question: string; options: string[] },
  history: AdaptiveQuestionTurnInput[],
): string | null {
  if (result.options.length < OPTIONS_MIN || result.options.length > OPTIONS_MAX) {
    return `generated ${result.options.length} options — expected between ${OPTIONS_MIN} and ${OPTIONS_MAX}`;
  }
  const questionBannedHit = findBannedWord(result.question);
  if (questionBannedHit) return `banned word "${questionBannedHit}" in question`;
  for (const option of result.options) {
    if (typeof option !== "string" || option.trim().length === 0) return "an option is missing or empty";
    const bannedHit = findBannedWord(option);
    if (bannedHit) return `banned word "${bannedHit}" in an option`;
  }
  const alreadyAsked = history.some((turn) => turn.question.trim().toLowerCase() === result.question.trim().toLowerCase());
  if (alreadyAsked) return "question repeats one already asked in this conversation";
  return null;
}

const PROVIDER_BUDGET_MS = 45_000;
const MAX_ATTEMPTS = 2;

async function callModel(userMessage: string, system: string, timeoutMs: number, retryNote?: string): Promise<AdaptiveQuestionModelResponse> {
  return await anthropic.messages.create(
    {
      model: MODEL.dialogue,
      max_tokens: 1024,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: ADAPTIVE_QUESTION_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: retryNote ? `${userMessage}\n\n${retryNote}` : userMessage }],
    },
    { timeout: timeoutMs, maxRetries: 0 },
  );
}

/**
 * Chooses the next adaptive follow-up question, or signals that enough is
 * understood to move on. `modelCall` is injectable (defaults to the real
 * call) so tests exercise the retry/backoff/categorization/termination logic
 * without a network call, matching this codebase's established convention.
 */
export async function chooseNextQuestion(
  input: NextQuestionInput,
  modelCall: (userMessage: string, system: string, timeoutMs: number, retryNote?: string) => Promise<AdaptiveQuestionModelResponse> = callModel,
): Promise<NextQuestionResult> {
  // The hard ceiling — enforced here, in code, before ever spending a model
  // call, so the model's own `done` judgment is never the only thing
  // standing between this conversation and an infinite interview.
  if (input.history.length >= MAX_ADAPTIVE_TURNS) {
    return {
      psychologicalState: { observed: [], inferred: [], unknown: [] },
      question: "",
      options: [],
      allowFreeText: false,
      done: true,
      doneReason: `reached the ${MAX_ADAPTIVE_TURNS}-question ceiling`,
      meta: { attempts: 0, modelCalled: false },
    };
  }

  const { system, userMessage } = assembleAdaptiveQuestionPrompt({
    firstName: input.firstName,
    becomingResponse: input.becomingResponse,
    history: input.history,
  });

  const startedAt = Date.now();
  let parsed: RawNextQuestion | null = null;
  let violation: string | null = null;
  let attempts = 0;

  for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
    const remaining = PROVIDER_BUDGET_MS - (Date.now() - startedAt);
    if (remaining <= 0) {
      throw new AdaptiveInterviewError(
        "timeout",
        `exceeded the ${PROVIDER_BUDGET_MS}ms provider budget before attempt ${attempts} could start`,
      );
    }

    const retryNote =
      violation === null ? undefined : `Your previous draft violated a rule: ${violation}. Regenerate the full response so it satisfies every rule.`;

    let response: AdaptiveQuestionModelResponse;
    try {
      response = await modelCall(userMessage, system, remaining, retryNote);
    } catch (err) {
      const category = categorizeCallError(err);
      if (attempts === MAX_ATTEMPTS || category === "timeout") {
        throw new AdaptiveInterviewError(category, `adaptive-question generation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      if (category === "overloaded") {
        await sleep(OVERLOAD_BACKOFF_BASE_MS + Math.random() * OVERLOAD_BACKOFF_JITTER_MS);
      }
      continue;
    }

    if (response.stop_reason === "refusal") {
      if (attempts === MAX_ATTEMPTS) throw new AdaptiveInterviewError("refusal", "model declined to generate a next question");
      continue;
    }

    const rawText = extractJSONText(response.content);
    if (!rawText) {
      if (attempts === MAX_ATTEMPTS) throw new AdaptiveInterviewError("malformed_json", "no text content returned");
      continue;
    }

    let attemptParsed: RawNextQuestion;
    try {
      attemptParsed = JSON.parse(rawText);
    } catch {
      if (attempts === MAX_ATTEMPTS) throw new AdaptiveInterviewError("malformed_json", "model output was not valid JSON");
      continue;
    }

    // A model signaling `done: true` has nothing further to lint — question/
    // options are ignored by the caller in that case (see this file's own
    // schema doc comment), so the violation check below only applies when
    // it isn't done yet.
    if (attemptParsed.done) {
      parsed = attemptParsed;
      break;
    }

    if (!Array.isArray(attemptParsed.options)) {
      violation = "options is missing or not an array";
      if (attempts === MAX_ATTEMPTS) {
        throw new AdaptiveInterviewError("unknown", `adaptive-question content failed validation after ${MAX_ATTEMPTS} attempts: ${violation}`);
      }
      continue;
    }

    violation = findAdaptiveQuestionViolation(attemptParsed, input.history);
    if (!violation) {
      parsed = attemptParsed;
      break;
    }
    if (attempts === MAX_ATTEMPTS) {
      throw new AdaptiveInterviewError("unknown", `adaptive-question content failed the content lint after ${MAX_ATTEMPTS} attempts: ${violation}`);
    }
  }

  if (!parsed) throw new AdaptiveInterviewError("unknown", "adaptive-question generation produced no result");

  return {
    psychologicalState: parsed.psychological_state,
    question: parsed.question,
    options: parsed.options,
    allowFreeText: parsed.allow_free_text,
    done: parsed.done,
    doneReason: parsed.done_reason,
    meta: { attempts, modelCalled: true },
  };
}
