import type {
  AdaptiveQuestionResponse,
  AdaptiveQuestionTurn,
  CoachingBeat,
  CoachingMove,
  FinalSynthesisResponse,
  GeneratedThought,
  HardStopResponse,
  InspirationResponse,
  OnboardingBeatResponse,
  PsychologicalState,
  RankedDimension,
  SafetyTier,
  ThoughtSource,
  UnderstandingReview,
  VisionFragment,
} from "@/types/adaptiveCoaching";

/**
 * The one backend call AE-001 needs (docs/experiments/AE-001-first-adaptive-coaching-loop.md):
 * calls the `onboarding-turn` Supabase Edge Function for both turn types this
 * slice uses. Mirrors `services/blueprintApi.ts`'s exact shape (timeout,
 * typed error kinds, manual response validation, a calm never-leak-raw-errors
 * message) rather than inventing a different HTTP client pattern.
 *
 * A hard-stop is NOT an HTTP error — the backend returns 200 with
 * `safety.hardStop: true` (adr/0013's Safety Engine can pre-empt the whole
 * turn, but that is itself a valid, expected outcome, not a failure of the
 * request). Callers must check `.safety.hardStop` before touching any other
 * field on the response.
 */

// inspiration_generation was rebuilt (see identityEngine.ts) to one merged
// model call with a layered timing budget, deliberately NOT three timers
// racing to the same instant:
//   provider call(s):    20s  (identityEngine.ts PROVIDER_BUDGET_MS)
//   server total return: 21s  (identityEngine.ts SERVER_TOTAL_BUDGET_MS)
//   this client timeout: 24s
// These numbers were originally specified as an 8s/8s/10s budget on the
// stated assumption that 8 short thoughts would be a "lighter" generation
// task. That assumption was tested against the live endpoint (20 real
// requests) and found wrong: effort "high" measured 14-20s+ per call,
// "medium" 9-14s, and even "low" (what identityEngine.ts actually uses)
// measured 8.7-10s for a single attempt — already at or above an 8-second
// total budget before any retry. The budget here is set to the measured
// reality, not the original target; see identityEngine.ts's header comment
// for the full writeup and the disclosed product-level consequence (the
// "recovery state by 8 seconds" requirement is no longer met on the
// success path at this budget). The 3s margin over the server's own 21s
// target exists for the same reason the original 2s margin did: so the
// server can finish classifying its own failure and return a structured
// 504/502 before the client gives up and reports a generic "aborted" with
// no server-side explanation. onboarding_beat is unchanged and keeps its
// own, separately generous budget below.
const INSPIRATION_TIMEOUT_MS = 24_000;

// onboarding_beat is out of scope for the inspiration-generation rebuild —
// kept at its original, generous timeout.
const ONBOARDING_BEAT_TIMEOUT_MS = 120_000;

// final_synthesis is a single prose-generation call with the same latency
// profile as the onboarding_beat call it replaces as AE-001's terminal turn
// — same generous budget, not a new number to justify.
const FINAL_SYNTHESIS_TIMEOUT_MS = 120_000;

// adaptive_question is a single "medium effort" call, lighter than
// final_synthesis's — 60s leaves real margin over
// adaptiveInterviewEngine.ts's own 45s provider budget.
const ADAPTIVE_QUESTION_TIMEOUT_MS = 60_000;

export type OnboardingTurnApiErrorKind =
  | "config"
  | "network"
  | "timeout"
  | "overloaded"
  | "aborted"
  | "server"
  | "invalid-response";

export class OnboardingTurnApiError extends Error {
  readonly kind: OnboardingTurnApiErrorKind;

  constructor(kind: OnboardingTurnApiErrorKind, message: string) {
    super(message);
    this.name = "OnboardingTurnApiError";
    this.kind = kind;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function readConfig(): { url: string; anonKey: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!isNonEmptyString(url) || !isNonEmptyString(anonKey)) return null;
  return { url: url.replace(/\/$/, ""), anonKey };
}

if (__DEV__ && !readConfig()) {
  console.warn(
    "[onboardingTurnApi] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set — " +
      "onboarding-turn requests will fail with a config error until prototype/expo/.env is filled in."
  );
}

function isErrorPayload(value: unknown): value is { error: string; error_category?: unknown } {
  return typeof value === "object" && value !== null && isNonEmptyString((value as Record<string, unknown>).error);
}

async function postOnboardingTurn(
  body: Record<string, unknown>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<unknown> {
  const config = readConfig();
  if (!config) {
    throw new OnboardingTurnApiError(
      "config",
      "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not configured."
    );
  }

  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${config.url}/functions/v1/onboarding-turn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw new OnboardingTurnApiError("aborted", "Request was cancelled.");
    if (controller.signal.aborted) {
      throw new OnboardingTurnApiError("timeout", `The request took longer than ${timeoutMs / 1000}s.`);
    }
    throw new OnboardingTurnApiError("network", err instanceof Error ? err.message : "Network request failed.");
  } finally {
    clearTimeout(timeoutId);
  }

  let rawBody: unknown;
  try {
    rawBody = await response.json();
  } catch {
    throw new OnboardingTurnApiError("invalid-response", "The server response was not valid JSON.");
  }

  if (!response.ok) {
    const message = isErrorPayload(rawBody) ? rawBody.error : `Request failed with status ${response.status}.`;
    // The backend embeds a structured `error_category` in every error body
    // (onboarding-turn/index.ts's `jsonError`) precisely so a transient
    // provider-capacity issue never has to be inferred from an HTTP status
    // code shared with unrelated meanings (503 is already "safety check
    // infra failed" here) — read it directly instead of guessing from
    // `response.status` alone.
    const category = isErrorPayload(rawBody) && isNonEmptyString(rawBody.error_category) ? rawBody.error_category : null;
    // A 504 is the server's own honest "I hit my timeout budget" signal —
    // surfaced as `kind: "timeout"` so callers show the same recovery UI as
    // a client-side abort, not a generic "server error" message for what is,
    // behaviorally, a timeout.
    const kind = category === "overloaded" ? "overloaded" : response.status === 504 ? "timeout" : "server";
    throw new OnboardingTurnApiError(kind, message);
  }

  return rawBody;
}

function isValidSafetyTier(value: unknown): value is SafetyTier {
  return value === "none" || value === "low" || value === "elevated" || value === "crisis";
}

function parseHardStop(body: Record<string, unknown>, safety: Record<string, unknown>): HardStopResponse | null {
  if (safety.hard_stop !== true) return null;
  if (!isNonEmptyString(safety.message)) {
    throw new OnboardingTurnApiError("invalid-response", "Hard-stop response is missing a message.");
  }
  const tier = safety.tier;
  if (tier !== "elevated" && tier !== "crisis") {
    throw new OnboardingTurnApiError("invalid-response", "Hard-stop response has an invalid tier.");
  }
  return {
    safety: { tier, hardStop: true, message: safety.message },
    requestId: isNonEmptyString(body.request_id) ? body.request_id : "",
  };
}

function parseInspirationResponse(raw: unknown): InspirationResponse | HardStopResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response was not an object.");
  }
  const body = raw as Record<string, unknown>;
  const safety = body.safety as Record<string, unknown> | undefined;
  if (typeof safety !== "object" || safety === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing safety information.");
  }

  const hardStop = parseHardStop(body, safety);
  if (hardStop) return hardStop;

  if (!isValidSafetyTier(safety.tier)) {
    throw new OnboardingTurnApiError("invalid-response", "Response has an invalid safety tier.");
  }
  if (!Array.isArray(body.ranked_dimensions) || !Array.isArray(body.thoughts)) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing ranked_dimensions/thoughts.");
  }

  return {
    safety: { tier: safety.tier, hardStop: false },
    rankedDimensions: body.ranked_dimensions as RankedDimension[],
    thoughts: body.thoughts as GeneratedThought[],
    requestId: String(body.request_id ?? ""),
    promptVersion: String(body.prompt_version ?? ""),
    latencyMs: Number(body.latency_ms ?? 0),
    retryCount: Number(body.retry_count ?? 0),
  };
}

function parsePsychologicalState(value: unknown): PsychologicalState {
  if (typeof value !== "object" || value === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing psychological_state.");
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.observed) || !Array.isArray(record.inferred) || !Array.isArray(record.unknown)) {
    throw new OnboardingTurnApiError("invalid-response", "psychological_state has an invalid shape.");
  }
  return {
    observed: record.observed as string[],
    inferred: record.inferred as { statement: string; confidence: number }[],
    unknown: record.unknown as string[],
  };
}

function parseOnboardingBeatResponse(raw: unknown): OnboardingBeatResponse | HardStopResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response was not an object.");
  }
  const body = raw as Record<string, unknown>;
  const safety = body.safety as Record<string, unknown> | undefined;
  if (typeof safety !== "object" || safety === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing safety information.");
  }

  const hardStop = parseHardStop(body, safety);
  if (hardStop) return hardStop;

  if (!isValidSafetyTier(safety.tier)) {
    throw new OnboardingTurnApiError("invalid-response", "Response has an invalid safety tier.");
  }
  if (!isNonEmptyString(body.chosen_beat) || !isNonEmptyString(body.chosen_move) || !isNonEmptyString(body.message)) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing chosen_beat/chosen_move/message.");
  }

  return {
    safety: { tier: safety.tier, hardStop: false },
    psychologicalState: parsePsychologicalState(body.psychological_state),
    chosenBeat: body.chosen_beat as CoachingBeat,
    chosenMove: body.chosen_move as CoachingMove,
    message: body.message,
    rationaleCode: String(body.rationale_code ?? ""),
    confidence: Number(body.confidence ?? 0),
    moveDowngraded: body.move_downgraded === true,
    promptVersion: String(body.prompt_version ?? ""),
    latencyMs: Number(body.latency_ms ?? 0),
  };
}

function isValidConfidence(value: unknown): value is UnderstandingReview["confidence"] {
  return value === "low" || value === "medium" || value === "high";
}

function parseUnderstandingReview(value: unknown): UnderstandingReview {
  if (typeof value !== "object" || value === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing the understanding review.");
  }
  const r = value as Record<string, unknown>;
  if (
    !isNonEmptyString(r.headline) ||
    !isNonEmptyString(r.core_aspiration) ||
    !isNonEmptyString(r.interpretation) ||
    !isNonEmptyString(r.identity_statement) ||
    !Array.isArray(r.emerging_themes) ||
    !Array.isArray(r.uncertainties) ||
    !isValidConfidence(r.confidence)
  ) {
    // Never silently fall back to rendering something partial/garbled —
    // a malformed synthesis is a failure to surface, never concatenated
    // fragment text presented as if it were a real understanding review.
    throw new OnboardingTurnApiError("invalid-response", "Understanding review is missing required fields.");
  }
  return {
    headline: r.headline,
    coreAspiration: r.core_aspiration,
    interpretation: r.interpretation,
    identityStatement: r.identity_statement,
    emergingThemes: r.emerging_themes as string[],
    uncertainties: r.uncertainties as string[],
    confidence: r.confidence,
  };
}

function parseFinalSynthesisResponse(raw: unknown): FinalSynthesisResponse | HardStopResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response was not an object.");
  }
  const body = raw as Record<string, unknown>;
  const safety = body.safety as Record<string, unknown> | undefined;
  if (typeof safety !== "object" || safety === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing safety information.");
  }

  const hardStop = parseHardStop(body, safety);
  if (hardStop) return hardStop;

  if (!isValidSafetyTier(safety.tier)) {
    throw new OnboardingTurnApiError("invalid-response", "Response has an invalid safety tier.");
  }

  return {
    safety: { tier: safety.tier, hardStop: false },
    understanding: parseUnderstandingReview(body.understanding),
    requestId: String(body.request_id ?? ""),
    promptVersion: String(body.prompt_version ?? ""),
    latencyMs: Number(body.latency_ms ?? 0),
  };
}

function parseAdaptiveQuestionResponse(raw: unknown): AdaptiveQuestionResponse | HardStopResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response was not an object.");
  }
  const body = raw as Record<string, unknown>;
  const safety = body.safety as Record<string, unknown> | undefined;
  if (typeof safety !== "object" || safety === null) {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing safety information.");
  }

  const hardStop = parseHardStop(body, safety);
  if (hardStop) return hardStop;

  if (!isValidSafetyTier(safety.tier)) {
    throw new OnboardingTurnApiError("invalid-response", "Response has an invalid safety tier.");
  }
  if (typeof body.question !== "string" || !Array.isArray(body.options) || typeof body.done !== "boolean") {
    throw new OnboardingTurnApiError("invalid-response", "Response is missing question/options/done.");
  }

  return {
    safety: { tier: safety.tier, hardStop: false },
    psychologicalState: parsePsychologicalState(body.psychological_state),
    question: body.question,
    options: body.options as string[],
    allowFreeText: body.allow_free_text === true,
    done: body.done,
    doneReason: String(body.done_reason ?? ""),
    requestId: String(body.request_id ?? ""),
    promptVersion: String(body.prompt_version ?? ""),
    latencyMs: Number(body.latency_ms ?? 0),
  };
}

/**
 * A discriminated-union type guard is needed here because the discriminant
 * (`hardStop`) lives on a nested `safety` property, one level below the
 * union itself — TypeScript's control-flow narrowing only follows a
 * top-level discriminant, so `result.safety.hardStop` alone won't narrow
 * `result`. This function is the one place that does. */
export function isHardStopResponse(
  result: InspirationResponse | OnboardingBeatResponse | FinalSynthesisResponse | AdaptiveQuestionResponse | HardStopResponse
): result is HardStopResponse {
  return result.safety.hardStop === true;
}

export async function requestInspiration(
  input: { firstName: string; age?: number | null; becomingResponse: string },
  options?: { signal?: AbortSignal }
): Promise<InspirationResponse | HardStopResponse> {
  const raw = await postOnboardingTurn(
    {
      turn_type: "inspiration_generation",
      first_name: input.firstName,
      age: input.age ?? undefined,
      becoming_response: input.becomingResponse,
    },
    INSPIRATION_TIMEOUT_MS,
    options?.signal
  );
  return parseInspirationResponse(raw);
}

export async function requestCoachingBeat(
  input: {
    firstName: string;
    becomingResponse: string;
    rankedDimensions: RankedDimension[];
    visionCanvas: VisionFragment[];
  },
  options?: { signal?: AbortSignal }
): Promise<OnboardingBeatResponse | HardStopResponse> {
  const raw = await postOnboardingTurn(
    {
      turn_type: "onboarding_beat",
      first_name: input.firstName,
      becoming_response: input.becomingResponse,
      ranked_dimensions: input.rankedDimensions,
      vision_canvas: input.visionCanvas.map((f) => ({ text: f.text })),
    },
    ONBOARDING_BEAT_TIMEOUT_MS,
    options?.signal
  );
  return parseOnboardingBeatResponse(raw);
}

export async function requestFinalSynthesis(
  input: {
    firstName: string;
    age?: number | null;
    becomingResponse: string;
    visionCanvas: VisionFragment[];
    dismissedThoughts?: { text: string; source: ThoughtSource }[];
    correctionNote?: string;
  },
  options?: { signal?: AbortSignal }
): Promise<FinalSynthesisResponse | HardStopResponse> {
  const raw = await postOnboardingTurn(
    {
      turn_type: "final_synthesis",
      first_name: input.firstName,
      age: input.age ?? undefined,
      becoming_response: input.becomingResponse,
      vision_canvas: input.visionCanvas.map((f) => ({ text: f.text, source: f.source, edited: f.edited })),
      dismissed_thoughts: input.dismissedThoughts,
      correction_note: input.correctionNote,
    },
    FINAL_SYNTHESIS_TIMEOUT_MS,
    options?.signal
  );
  return parseFinalSynthesisResponse(raw);
}

/**
 * The adaptive-questioning engine's client call — architecture built ahead
 * of a full onboarding re-choreography (see adaptiveInterviewEngine.ts's own
 * header comment on the backend). Not called by any shipped screen yet; a
 * future adaptive-interview UI calls this in a loop (feeding each turn's
 * `question`/selected-or-typed answer back in as `history`) until the
 * response's `done` is true, then hands off to `requestFinalSynthesis`.
 */
export async function requestNextQuestion(
  input: { firstName: string; becomingResponse: string; history: AdaptiveQuestionTurn[] },
  options?: { signal?: AbortSignal }
): Promise<AdaptiveQuestionResponse | HardStopResponse> {
  const raw = await postOnboardingTurn(
    {
      turn_type: "adaptive_question",
      first_name: input.firstName,
      becoming_response: input.becomingResponse,
      history: input.history,
    },
    ADAPTIVE_QUESTION_TIMEOUT_MS,
    options?.signal
  );
  return parseAdaptiveQuestionResponse(raw);
}

/** Never surface `err.message` directly — mirrors `blueprintApi.ts`'s own
 *  `toInvestorSafeMessage`, renamed for this context but identical intent:
 *  the real error is logged, the user only ever sees one calm message. */
export function toCalmUserMessage(error: unknown): string {
  if (error instanceof OnboardingTurnApiError) {
    console.error(`[onboardingTurnApi] ${error.kind}: ${error.message}`);
  } else {
    console.error("[onboardingTurnApi] unexpected error:", error);
  }
  return "I'm having a little trouble right now. Let's try that again.";
}
