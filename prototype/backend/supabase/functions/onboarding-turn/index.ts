// AE-001's one backend endpoint (docs/experiments/AE-001-first-adaptive-coaching-loop.md).
// "One request, one response," no DB, no long-term storage — same posture as
// generate-blueprint/index.ts. Safety Engine runs first, unconditionally, on
// every inbound turn (decisions/0006, adr/0008 §4, adr/0013) — a code-level
// guarantee, not a network-boundary one (see the module's own doc comment
// for why one Edge Function, not several, is the right shape for this).
//
// Deploy:
//   supabase functions deploy onboarding-turn --no-verify-jwt
// (matches generate-blueprint's existing convention — see prototype/backend/README.md
// for the caveat that --no-verify-jwt must not carry over to anything handling
// real persisted user data; this endpoint persists nothing.)
import {
  chooseOnboardingBeat as realChooseOnboardingBeat,
  CoachEngineError,
  type ChooseBeatInput,
  type OnboardingBeatResult,
} from "../_shared/coachEngine.ts";
import {
  IdentityEngineError,
  rankDimensionsAndGenerateThoughts as realRankDimensionsAndGenerateThoughts,
  type InspirationResult,
  type RankAndGenerateInput,
} from "../_shared/identityEngine.ts";
import { isLifeDimension, type LifeDimension } from "../_shared/lifeDimensions.ts";
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

type OnboardingTurnRequest = InspirationRequest | OnboardingBeatRequest;

/** Every external effect this handler needs, injectable for tests — the
 *  golden/red-team eval set exercises the real routing/safety/validation
 *  logic in this file without a network call or a real API key, matching
 *  this codebase's dependency-injection-over-module-mocking convention. */
export interface OnboardingTurnDeps {
  classifyRisk: (text: string) => Promise<SafetyClassification>;
  rankDimensionsAndGenerateThoughts: (input: RankAndGenerateInput) => Promise<InspirationResult>;
  chooseOnboardingBeat: (input: ChooseBeatInput) => Promise<OnboardingBeatResult>;
}

const defaultDeps: OnboardingTurnDeps = {
  classifyRisk: realClassifyRisk,
  rankDimensionsAndGenerateThoughts: realRankDimensionsAndGenerateThoughts,
  chooseOnboardingBeat: realChooseOnboardingBeat,
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function hardStopBody(tier: "elevated" | "crisis") {
  return { safety: { tier, hard_stop: true, message: HARD_STOP_MESSAGE } };
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

  // Step 2: extract the user-authored text this turn must screen first.
  const textToScreen =
    payload.turn_type === "inspiration_generation"
      ? (payload.becoming_response ?? "")
      : payload.turn_type === "onboarding_beat"
        ? (payload.vision_canvas ?? []).map((f) => f.text).join("\n")
        : "";

  // Step 3+4: Safety Engine runs first, unconditionally. A classification
  // failure fails CLOSED — a retryable error, never an assumed-safe tier.
  let safety: SafetyClassification;
  try {
    safety = await deps.classifyRisk(textToScreen);
  } catch (err) {
    if (err instanceof SafetyClassificationError) {
      return jsonError("safety_check_failed: please try again", 503);
    }
    return jsonError("unexpected error during safety screening", 502);
  }

  const action = mapTierToAction(safety.tier);
  if (action.hardStop) {
    // Code-level short-circuit — Identity/Coach Engine are never called on
    // elevated/crisis, regardless of turn_type.
    return jsonOk(hardStopBody(safety.tier as "elevated" | "crisis"));
  }

  // Step 5: route by turn_type, only once cleared.
  if (payload.turn_type === "inspiration_generation") {
    if (!isValidInspirationRequest(payload)) {
      return jsonError("becoming_response is required and must be non-empty", 400);
    }
    const start = Date.now();
    let result: InspirationResult;
    try {
      result = await deps.rankDimensionsAndGenerateThoughts({
        firstName: payload.first_name ?? "",
        becomingResponse: payload.becoming_response,
      });
    } catch (err) {
      if (err instanceof IdentityEngineError) return jsonError(err.message, 502);
      return jsonError("unexpected error during inspiration generation", 502);
    }
    return jsonOk({
      safety: { tier: safety.tier, hard_stop: false },
      ranked_dimensions: result.rankedDimensions,
      thoughts: result.thoughts,
      prompt_version: "onboarding-inspiration-v1",
      latency_ms: Date.now() - start,
    });
  }

  if (payload.turn_type === "onboarding_beat") {
    if (!isValidOnboardingBeatRequest(payload)) {
      return jsonError("vision_canvas is required and must be non-empty", 400);
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
      if (err instanceof CoachEngineError) return jsonError(err.message, 502);
      return jsonError("unexpected error while choosing the next coaching beat", 502);
    }

    // Step 5 (onboarding_beat only): a second, OUTBOUND safety re-check on
    // the generated message itself — never render an unscreened outbound
    // turn, per decisions/0010's finding that this must be distinct from an
    // ordinary-failure fallback.
    let outboundSafety: SafetyClassification;
    try {
      outboundSafety = await deps.classifyRisk(result.message);
    } catch {
      return jsonError("safety_check_failed: please try again", 503);
    }
    const outboundAction = mapTierToAction(outboundSafety.tier);
    if (outboundAction.hardStop) {
      return jsonOk(hardStopBody(outboundSafety.tier as "elevated" | "crisis"));
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
      prompt_version: "onboarding-beat-v1",
      latency_ms: Date.now() - start,
    });
  }

  return jsonError("unknown turn_type", 400);
}

Deno.serve((req) => handleOnboardingTurn(req));
