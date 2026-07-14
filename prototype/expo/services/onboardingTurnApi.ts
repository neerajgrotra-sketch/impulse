import type {
  CoachingBeat,
  CoachingMove,
  GeneratedThought,
  HardStopResponse,
  InspirationResponse,
  OnboardingBeatResponse,
  PsychologicalState,
  RankedDimension,
  SafetyTier,
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

const REQUEST_TIMEOUT_MS = 30_000;

export type OnboardingTurnApiErrorKind = "config" | "network" | "timeout" | "aborted" | "server" | "invalid-response";

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

function isErrorPayload(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && isNonEmptyString((value as Record<string, unknown>).error);
}

async function postOnboardingTurn(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
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
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
      throw new OnboardingTurnApiError("timeout", `The request took longer than ${REQUEST_TIMEOUT_MS / 1000}s.`);
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
    throw new OnboardingTurnApiError("server", message);
  }

  return rawBody;
}

function isValidSafetyTier(value: unknown): value is SafetyTier {
  return value === "none" || value === "low" || value === "elevated" || value === "crisis";
}

function parseHardStop(safety: Record<string, unknown>): HardStopResponse | null {
  if (safety.hard_stop !== true) return null;
  if (!isNonEmptyString(safety.message)) {
    throw new OnboardingTurnApiError("invalid-response", "Hard-stop response is missing a message.");
  }
  const tier = safety.tier;
  if (tier !== "elevated" && tier !== "crisis") {
    throw new OnboardingTurnApiError("invalid-response", "Hard-stop response has an invalid tier.");
  }
  return { safety: { tier, hardStop: true, message: safety.message } };
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

  const hardStop = parseHardStop(safety);
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
    promptVersion: String(body.prompt_version ?? ""),
    latencyMs: Number(body.latency_ms ?? 0),
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

  const hardStop = parseHardStop(safety);
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

/**
 * A discriminated-union type guard is needed here because the discriminant
 * (`hardStop`) lives on a nested `safety` property, one level below the
 * union itself — TypeScript's control-flow narrowing only follows a
 * top-level discriminant, so `result.safety.hardStop` alone won't narrow
 * `result`. This function is the one place that does. */
export function isHardStopResponse(
  result: InspirationResponse | OnboardingBeatResponse | HardStopResponse
): result is HardStopResponse {
  return result.safety.hardStop === true;
}

export async function requestInspiration(
  input: { firstName: string; becomingResponse: string },
  options?: { signal?: AbortSignal }
): Promise<InspirationResponse | HardStopResponse> {
  const raw = await postOnboardingTurn(
    {
      turn_type: "inspiration_generation",
      first_name: input.firstName,
      becoming_response: input.becomingResponse,
    },
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
    options?.signal
  );
  return parseOnboardingBeatResponse(raw);
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
