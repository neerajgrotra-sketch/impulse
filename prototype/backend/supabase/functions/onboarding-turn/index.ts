// AE-001's one backend endpoint (docs/experiments/AE-001-first-adaptive-coaching-loop.md).
// "One request, one response," no DB, no long-term storage — same posture as
// generate-blueprint/index.ts. Safety Engine runs first, unconditionally, on
// every inbound turn (decisions/0006, adr/0008 §4, adr/0013) — a code-level
// guarantee, not a network-boundary one (see the module's own doc comment
// for why one Edge Function, not several, is the right shape for this).
//
// inspiration_generation is the exception to "classify, then route" below,
// and deliberately so: decisions/0010 already endorsed folding real
// per-turn risk-tier classification into the Identity Engine's own required
// call rather than a separate classifier call ahead of it, specifically so
// this turn stays "exactly one low-latency model request." identityEngine.ts
// always runs (there's no cheaper way to learn the tier), but its
// rankedDimensions/thoughts are held back — never reach jsonOk — whenever
// mapTierToAction says hard-stop. onboarding_beat keeps the original
// classify-first-then-route shape unchanged; it is out of scope for this
// rebuild.
//
// Deploy:
//   supabase functions deploy onboarding-turn --no-verify-jwt
// (matches generate-blueprint's existing convention — see prototype/backend/README.md
// for the caveat that --no-verify-jwt must not carry over to anything handling
// real persisted user data; this endpoint persists nothing.)
import {
  AdaptiveInterviewError,
  chooseNextQuestion as realChooseNextQuestion,
  type NextQuestionInput,
  type NextQuestionResult,
} from "../_shared/adaptiveInterviewEngine.ts";
import { MODEL } from "../_shared/anthropicClient.ts";
import {
  chooseOnboardingBeat as realChooseOnboardingBeat,
  CoachEngineError,
  synthesizeUnderstanding as realSynthesizeUnderstanding,
  type ChooseBeatInput,
  type OnboardingBeatResult,
  type SynthesizeUnderstandingInput,
  type UnderstandingReview,
} from "../_shared/coachEngine.ts";
import {
  generateInspiration as realGenerateInspiration,
  IdentityEngineError,
  SERVER_TOTAL_BUDGET_MS,
  type GenerateInspirationInput,
  type InspirationResult,
} from "../_shared/identityEngine.ts";
import { isLifeDimension, type LifeDimension } from "../_shared/lifeDimensions.ts";
import { logInspirationRequest } from "../_shared/requestLog.ts";
import {
  classifyRisk as realClassifyRisk,
  HARD_STOP_MESSAGE,
  mapTierToAction,
  SafetyClassificationError,
  type SafetyClassification,
} from "../_shared/safetyEngine.ts";

interface InspirationRequest {
  turn_type: "inspiration_generation";
  first_name?: string;
  becoming_response: string;
}

interface OnboardingBeatRequest {
  turn_type: "onboarding_beat";
  first_name?: string;
  becoming_response: string;
  ranked_dimensions: { dimension: string; relevance: number }[];
  vision_canvas: { text: string }[];
}

interface FinalSynthesisRequest {
  turn_type: "final_synthesis";
  first_name?: string;
  becoming_response: string;
  vision_canvas: { text: string; source: "ai" | "fallback" | "user"; edited: boolean }[];
  dismissed_thoughts?: { text: string; source: "ai" | "fallback" | "user" }[];
  correction_note?: string;
}

/** The adaptive-questioning engine's turn — architecture authorized ahead of
 *  a full onboarding re-choreography (see adaptiveInterviewEngine.ts's own
 *  header comment). Not currently called by any shipped screen; exists so a
 *  future adaptive-interview UI has a real, tested backend turn to call
 *  rather than inventing one from scratch. */
interface AdaptiveQuestionRequest {
  turn_type: "adaptive_question";
  first_name?: string;
  becoming_response: string;
  history: { question: string; answer: string }[];
}

type OnboardingTurnRequest = InspirationRequest | OnboardingBeatRequest | FinalSynthesisRequest | AdaptiveQuestionRequest;

/** Every external effect this handler needs, injectable for tests — the
 *  golden/red-team eval set exercises the real routing/safety/validation
 *  logic in this file without a network call or a real API key, matching
 *  this codebase's dependency-injection-over-module-mocking convention. */
export interface OnboardingTurnDeps {
  classifyRisk: (text: string) => Promise<SafetyClassification>;
  generateInspiration: (input: GenerateInspirationInput) => Promise<InspirationResult>;
  chooseOnboardingBeat: (input: ChooseBeatInput) => Promise<OnboardingBeatResult>;
  synthesizeUnderstanding: (input: SynthesizeUnderstandingInput) => Promise<UnderstandingReview>;
  chooseNextQuestion: (input: NextQuestionInput) => Promise<NextQuestionResult>;
}

const defaultDeps: OnboardingTurnDeps = {
  classifyRisk: realClassifyRisk,
  generateInspiration: realGenerateInspiration,
  chooseOnboardingBeat: realChooseOnboardingBeat,
  synthesizeUnderstanding: realSynthesizeUnderstanding,
  chooseNextQuestion: realChooseNextQuestion,
};

function jsonError(message: string, status: number, requestId?: string, errorCategory?: string): Response {
  return new Response(
    JSON.stringify({ error: message, request_id: requestId ?? null, error_category: errorCategory ?? null }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function hardStopBody(tier: "elevated" | "crisis", requestId: string) {
  return { safety: { tier, hard_stop: true, message: HARD_STOP_MESSAGE }, request_id: requestId };
}

function isValidInspirationRequest(body: unknown): body is InspirationRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    b.turn_type === "inspiration_generation" &&
    typeof b.becoming_response === "string" &&
    b.becoming_response.trim().length > 0
  );
}

function isValidOnboardingBeatRequest(body: unknown): body is OnboardingBeatRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (b.turn_type !== "onboarding_beat") return false;
  if (typeof b.becoming_response !== "string") return false;
  if (!Array.isArray(b.vision_canvas) || b.vision_canvas.length === 0) return false;
  if (!b.vision_canvas.every((f) => typeof (f as { text?: unknown }).text === "string")) return false;
  if (!Array.isArray(b.ranked_dimensions)) return false;
  return true;
}

function isValidFinalSynthesisRequest(body: unknown): body is FinalSynthesisRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (b.turn_type !== "final_synthesis") return false;
  if (typeof b.becoming_response !== "string") return false;
  if (!Array.isArray(b.vision_canvas) || b.vision_canvas.length === 0) return false;
  if (
    !b.vision_canvas.every(
      (f) =>
        typeof (f as { text?: unknown }).text === "string" &&
        typeof (f as { source?: unknown }).source === "string" &&
        typeof (f as { edited?: unknown }).edited === "boolean",
    )
  ) {
    return false;
  }
  if (b.dismissed_thoughts !== undefined) {
    if (!Array.isArray(b.dismissed_thoughts)) return false;
    if (!b.dismissed_thoughts.every((t) => typeof (t as { text?: unknown }).text === "string")) return false;
  }
  return true;
}

function isValidAdaptiveQuestionRequest(body: unknown): body is AdaptiveQuestionRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (b.turn_type !== "adaptive_question") return false;
  if (typeof b.becoming_response !== "string" || b.becoming_response.trim().length === 0) return false;
  if (!Array.isArray(b.history)) return false;
  return b.history.every(
    (t) => typeof (t as { question?: unknown }).question === "string" && typeof (t as { answer?: unknown }).answer === "string",
  );
}

/** Shared by IdentityEngineError, CoachEngineError, and AdaptiveInterviewError's
 *  categories: a real provider-budget timeout is 504 (the client's own timer will usually
 *  fire first anyway, but a slightly-slower client or a retry-after-abort
 *  race should still see the true reason), everything else — including
 *  "overloaded" — is 502. "overloaded" is deliberately NOT mapped to 503:
 *  this endpoint already uses 503 for a completely different meaning
 *  (safety-classification infra failure, "please try again"), and reusing
 *  it here would blur two different failure modes behind one status code.
 *  Callers that need to distinguish "provider is overloaded" from "we have
 *  a bug" read the response body's `error_category` field instead, which
 *  `jsonError` always includes. */
function statusForErrorCategory(category: string): number {
  return category === "timeout" ? 504 : 502;
}

async function handleInspirationGeneration(
  payload: InspirationRequest,
  deps: OnboardingTurnDeps,
  requestId: string,
): Promise<Response> {
  if (!isValidInspirationRequest(payload)) {
    return jsonError("becoming_response is required and must be non-empty", 400, requestId);
  }

  const start = Date.now();
  let result: InspirationResult;
  try {
    result = await deps.generateInspiration({
      firstName: payload.first_name ?? "",
      becomingResponse: payload.becoming_response,
    });
  } catch (err) {
    const category = err instanceof IdentityEngineError ? err.category : "unknown";
    const message = err instanceof IdentityEngineError ? err.message : "unexpected error during inspiration generation";
    logInspirationRequest({
      request_id: requestId,
      turn_type: "inspiration_generation",
      status: "error",
      model: MODEL.dialogue,
      total_latency_ms: Date.now() - start,
      provider_latency_ms: 0,
      parse_latency_ms: 0,
      attempts: 0,
      safety_tier: null,
      error_category: category,
      over_budget: Date.now() - start > SERVER_TOTAL_BUDGET_MS,
    });
    return jsonError(message, statusForErrorCategory(category), requestId, category);
  }

  const action = mapTierToAction(result.safety.tier);
  const totalLatencyMs = Date.now() - start;

  logInspirationRequest({
    request_id: requestId,
    turn_type: "inspiration_generation",
    status: action.hardStop ? "hard_stop" : "ok",
    model: MODEL.dialogue,
    total_latency_ms: totalLatencyMs,
    provider_latency_ms: result.meta.providerLatencyMs,
    parse_latency_ms: result.meta.parseLatencyMs,
    attempts: result.meta.attempts,
    safety_tier: result.safety.tier,
    error_category: null,
    over_budget: totalLatencyMs > SERVER_TOTAL_BUDGET_MS,
  });

  if (action.hardStop) {
    // Code-level short-circuit — rankedDimensions/thoughts were generated
    // (this turn's one model call always produces both), but a hard-stop
    // tier means they are never included in the response body.
    return jsonOk(hardStopBody(result.safety.tier as "elevated" | "crisis", requestId));
  }

  return jsonOk({
    safety: { tier: result.safety.tier, hard_stop: false },
    ranked_dimensions: result.rankedDimensions,
    thoughts: result.thoughts,
    request_id: requestId,
    prompt_version: "onboarding-inspiration-v2",
    latency_ms: totalLatencyMs,
    provider_latency_ms: result.meta.providerLatencyMs,
    parse_latency_ms: result.meta.parseLatencyMs,
    retry_count: result.meta.attempts - 1,
    model: MODEL.dialogue,
  });
}

async function handleOnboardingBeat(
  payload: OnboardingBeatRequest,
  deps: OnboardingTurnDeps,
  requestId: string,
): Promise<Response> {
  // Step 2: extract the user-authored text this turn must screen first.
  const textToScreen = (payload.vision_canvas ?? []).map((f) => f.text).join("\n");

  // Step 3+4: Safety Engine runs first, unconditionally. A classification
  // failure fails CLOSED — a retryable error, never an assumed-safe tier.
  let safety: SafetyClassification;
  try {
    safety = await deps.classifyRisk(textToScreen);
  } catch (err) {
    if (err instanceof SafetyClassificationError) {
      return jsonError("safety_check_failed: please try again", 503, requestId);
    }
    return jsonError("unexpected error during safety screening", 502, requestId);
  }

  const action = mapTierToAction(safety.tier);
  if (action.hardStop) {
    return jsonOk(hardStopBody(safety.tier as "elevated" | "crisis", requestId));
  }

  if (!isValidOnboardingBeatRequest(payload)) {
    return jsonError("vision_canvas is required and must be non-empty", 400, requestId);
  }
  const rankedDimensions = payload.ranked_dimensions
    .filter((d): d is { dimension: LifeDimension; relevance: number } => isLifeDimension(d.dimension))
    .map((d) => ({ dimension: d.dimension, relevance: d.relevance }));

  const start = Date.now();
  let result: OnboardingBeatResult;
  try {
    result = await deps.chooseOnboardingBeat({
      firstName: payload.first_name ?? "",
      becomingResponse: payload.becoming_response,
      rankedDimensions,
      visionCanvas: payload.vision_canvas,
    });
  } catch (err) {
    if (err instanceof CoachEngineError) {
      return jsonError(err.message, statusForErrorCategory(err.category), requestId, err.category);
    }
    return jsonError("unexpected error while choosing the next coaching beat", 502, requestId);
  }

  // Step 5 (onboarding_beat only): a second, OUTBOUND safety re-check on
  // the generated message itself — never render an unscreened outbound
  // turn, per decisions/0010's finding that this must be distinct from an
  // ordinary-failure fallback.
  let outboundSafety: SafetyClassification;
  try {
    outboundSafety = await deps.classifyRisk(result.message);
  } catch {
    return jsonError("safety_check_failed: please try again", 503, requestId);
  }
  const outboundAction = mapTierToAction(outboundSafety.tier);
  if (outboundAction.hardStop) {
    return jsonOk(hardStopBody(outboundSafety.tier as "elevated" | "crisis", requestId));
  }

  return jsonOk({
    safety: { tier: safety.tier, hard_stop: false },
    psychological_state: {
      observed: result.psychologicalState.observed,
      inferred: result.psychologicalState.inferred,
      unknown: result.psychologicalState.unknown,
    },
    chosen_beat: result.chosenBeat,
    chosen_move: result.chosenMove,
    message: result.message,
    rationale_code: result.rationaleCode,
    confidence: result.confidence,
    move_downgraded: result.moveDowngraded,
    request_id: requestId,
    prompt_version: "onboarding-beat-v1",
    latency_ms: Date.now() - start,
  });
}

async function handleFinalSynthesis(
  payload: FinalSynthesisRequest,
  deps: OnboardingTurnDeps,
  requestId: string,
): Promise<Response> {
  if (!isValidFinalSynthesisRequest(payload)) {
    return jsonError("vision_canvas is required and must be non-empty", 400, requestId);
  }

  // Safety Engine runs first, unconditionally, on every inbound turn — same
  // rule handleOnboardingBeat already applies, extended to this turn's own
  // user-authored content (selected + dismissed fragments).
  const textToScreen = [
    ...payload.vision_canvas.map((f) => f.text),
    ...(payload.dismissed_thoughts ?? []).map((t) => t.text),
  ].join("\n");

  let safety: SafetyClassification;
  try {
    safety = await deps.classifyRisk(textToScreen);
  } catch (err) {
    if (err instanceof SafetyClassificationError) {
      return jsonError("safety_check_failed: please try again", 503, requestId);
    }
    return jsonError("unexpected error during safety screening", 502, requestId);
  }

  const action = mapTierToAction(safety.tier);
  if (action.hardStop) {
    return jsonOk(hardStopBody(safety.tier as "elevated" | "crisis", requestId));
  }

  const start = Date.now();
  let result: UnderstandingReview;
  try {
    result = await deps.synthesizeUnderstanding({
      firstName: payload.first_name ?? "",
      becomingResponse: payload.becoming_response,
      visionCanvas: payload.vision_canvas,
      dismissedThoughts: payload.dismissed_thoughts,
      correctionNote: payload.correction_note,
    });
  } catch (err) {
    if (err instanceof CoachEngineError) {
      return jsonError(err.message, statusForErrorCategory(err.category), requestId, err.category);
    }
    return jsonError("unexpected error while synthesizing the understanding review", 502, requestId);
  }

  // Outbound re-check on every generated prose field before ever returning
  // them — never render an unscreened outbound turn.
  let outboundSafety: SafetyClassification;
  try {
    outboundSafety = await deps.classifyRisk(
      [result.headline, result.coreAspiration, result.interpretation, result.identityStatement].join("\n"),
    );
  } catch {
    return jsonError("safety_check_failed: please try again", 503, requestId);
  }
  const outboundAction = mapTierToAction(outboundSafety.tier);
  if (outboundAction.hardStop) {
    return jsonOk(hardStopBody(outboundSafety.tier as "elevated" | "crisis", requestId));
  }

  return jsonOk({
    safety: { tier: safety.tier, hard_stop: false },
    understanding: {
      headline: result.headline,
      core_aspiration: result.coreAspiration,
      interpretation: result.interpretation,
      identity_statement: result.identityStatement,
      emerging_themes: result.emergingThemes,
      uncertainties: result.uncertainties,
      confidence: result.confidence,
    },
    request_id: requestId,
    prompt_version: "final-synthesis-v1",
    latency_ms: Date.now() - start,
  });
}

/** The adaptive-questioning engine's turn — not currently reachable from any
 *  shipped screen (see this file's own `AdaptiveQuestionRequest` doc
 *  comment). Follows the exact same safety-first shape every other turn in
 *  this handler does: classify inbound content unconditionally, hard-stop
 *  short-circuits before the engine ever runs, then a second outbound
 *  re-check on the generated question/options before they ever reach a
 *  response. */
async function handleAdaptiveQuestion(
  payload: AdaptiveQuestionRequest,
  deps: OnboardingTurnDeps,
  requestId: string,
): Promise<Response> {
  if (!isValidAdaptiveQuestionRequest(payload)) {
    return jsonError("becoming_response is required and history must be an array of {question, answer}", 400, requestId);
  }

  const textToScreen = [payload.becoming_response, ...payload.history.map((t) => t.answer)].join("\n");

  let safety: SafetyClassification;
  try {
    safety = await deps.classifyRisk(textToScreen);
  } catch (err) {
    if (err instanceof SafetyClassificationError) {
      return jsonError("safety_check_failed: please try again", 503, requestId);
    }
    return jsonError("unexpected error during safety screening", 502, requestId);
  }

  const action = mapTierToAction(safety.tier);
  if (action.hardStop) {
    return jsonOk(hardStopBody(safety.tier as "elevated" | "crisis", requestId));
  }

  const start = Date.now();
  let result: NextQuestionResult;
  try {
    result = await deps.chooseNextQuestion({
      firstName: payload.first_name ?? "",
      becomingResponse: payload.becoming_response,
      history: payload.history,
    });
  } catch (err) {
    if (err instanceof AdaptiveInterviewError) {
      return jsonError(err.message, statusForErrorCategory(err.category), requestId, err.category);
    }
    return jsonError("unexpected error while choosing the next question", 502, requestId);
  }

  // done:true means the engine short-circuited (turn ceiling) or the model
  // signaled enough is understood — question/options are meaningless in
  // that case (never generated, or ignored), so there is nothing to
  // outbound-screen; only re-check when there's real generated text.
  if (!result.done) {
    let outboundSafety: SafetyClassification;
    try {
      outboundSafety = await deps.classifyRisk([result.question, ...result.options].join("\n"));
    } catch {
      return jsonError("safety_check_failed: please try again", 503, requestId);
    }
    const outboundAction = mapTierToAction(outboundSafety.tier);
    if (outboundAction.hardStop) {
      return jsonOk(hardStopBody(outboundSafety.tier as "elevated" | "crisis", requestId));
    }
  }

  return jsonOk({
    safety: { tier: safety.tier, hard_stop: false },
    psychological_state: {
      observed: result.psychologicalState.observed,
      inferred: result.psychologicalState.inferred,
      unknown: result.psychologicalState.unknown,
    },
    question: result.question,
    options: result.options,
    allow_free_text: result.allowFreeText,
    done: result.done,
    done_reason: result.doneReason,
    request_id: requestId,
    prompt_version: "adaptive-question-v1",
    latency_ms: Date.now() - start,
  });
}

export async function handleOnboardingTurn(req: Request, deps: OnboardingTurnDeps = defaultDeps): Promise<Response> {
  if (req.method !== "POST") {
    return jsonError("POST only", 405);
  }

  let payload: OnboardingTurnRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonError("invalid JSON body", 400);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as { turn_type?: unknown }).turn_type !== "string"
  ) {
    return jsonError("turn_type is required", 400);
  }

  const requestId = crypto.randomUUID();

  if (payload.turn_type === "inspiration_generation") {
    return handleInspirationGeneration(payload, deps, requestId);
  }

  if (payload.turn_type === "onboarding_beat") {
    return handleOnboardingBeat(payload, deps, requestId);
  }

  if (payload.turn_type === "final_synthesis") {
    return handleFinalSynthesis(payload, deps, requestId);
  }

  if (payload.turn_type === "adaptive_question") {
    return handleAdaptiveQuestion(payload, deps, requestId);
  }

  return jsonError("unknown turn_type", 400, requestId);
}

Deno.serve((req) => handleOnboardingTurn(req));
