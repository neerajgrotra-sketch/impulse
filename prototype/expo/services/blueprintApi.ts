import type { BlueprintResponse, TranscriptTurn } from "@/types/onboarding";

/**
 * The one backend call in this app: full transcript in, Human Blueprint out.
 * Calls the existing, unmodified `generate-blueprint` Supabase Edge Function
 * (prototype/backend/) — same endpoint, same request contract, same schema
 * the Swift client's BlueprintAPIClient.swift already uses. Nothing about
 * the backend changed to make this work.
 *
 * One real incompatibility, documented and fixed here (client-side only):
 * this app's TS domain types are camelCase (idiomatic TS, matches every
 * other type in `types/onboarding.ts`), but the Edge Function's wire format
 * is snake_case (`question_key`, `who_you_are`, ...) — see
 * `prototype/backend/supabase/functions/generate-blueprint/index.ts`. The
 * Swift client bridges the same gap via Codable's `CodingKeys`. This file's
 * `toWireTranscript` / `parseBlueprintResponse` are the equivalent bridge on
 * this side — the only place in the app that knows the wire format exists.
 */

const REQUEST_TIMEOUT_MS = 30_000;

export type BlueprintApiErrorKind =
  | "config"
  | "network"
  | "timeout"
  | "aborted"
  | "server"
  | "invalid-response";

export class BlueprintApiError extends Error {
  readonly kind: BlueprintApiErrorKind;

  constructor(kind: BlueprintApiErrorKind, message: string) {
    super(message);
    this.name = "BlueprintApiError";
    this.kind = kind;
  }
}

type WireTranscriptTurn = {
  question_key: string;
  question_text: string;
  answer_text: string;
};

type WireQuoteItem = Record<string, unknown>;

function toWireTranscript(transcript: TranscriptTurn[]): WireTranscriptTurn[] {
  return transcript.map((turn) => ({
    question_key: turn.questionKey,
    question_text: turn.questionText,
    answer_text: turn.answerText,
  }));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isQuoteItem(value: unknown, key: string): value is WireQuoteItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return isNonEmptyString(item[key]) && isNonEmptyString(item.quote);
}

/**
 * Safe JSON validation: every field is checked before it's trusted, rather
 * than blindly casting the response `as BlueprintResponse`. A shape the
 * backend never actually sends (a network intermediary mangling the body, a
 * future backend change that isn't reflected here) fails loudly and
 * specifically here, not as a confusing render crash three screens later.
 */
function parseBlueprintResponse(raw: unknown): BlueprintResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new BlueprintApiError("invalid-response", "Blueprint response was not an object.");
  }
  const body = raw as Record<string, unknown>;

  const requiredStringFields = [
    "title",
    "who_you_are",
    "what_drives_you",
    "the_gap",
    "how_ill_coach_you",
  ] as const;

  for (const field of requiredStringFields) {
    if (!isNonEmptyString(body[field])) {
      throw new BlueprintApiError("invalid-response", `Blueprint response is missing "${field}".`);
    }
  }

  // Bounds mirror BLUEPRINT_SCHEMA's own minItems/maxItems exactly (2–3
  // strengths, 1–2 friction points) — a valid backend response can never
  // violate these (Claude's structured output is constrained to the schema
  // at generation time), but checking shape without checking length would
  // let a hypothetical empty array through and render as a bare "What stood
  // out" label with nothing beneath it.
  if (
    !Array.isArray(body.strengths) ||
    body.strengths.length < 2 ||
    body.strengths.length > 3 ||
    !body.strengths.every((item) => isQuoteItem(item, "strength"))
  ) {
    throw new BlueprintApiError("invalid-response", 'Blueprint response has an invalid "strengths" field.');
  }
  if (
    !Array.isArray(body.friction_points) ||
    body.friction_points.length < 1 ||
    body.friction_points.length > 2 ||
    !body.friction_points.every((item) => isQuoteItem(item, "condition"))
  ) {
    throw new BlueprintApiError(
      "invalid-response",
      'Blueprint response has an invalid "friction_points" field.'
    );
  }

  return {
    title: body.title as string,
    whoYouAre: body.who_you_are as string,
    whatDrivesYou: body.what_drives_you as string,
    theGap: body.the_gap as string,
    strengths: body.strengths as { strength: string; quote: string }[],
    frictionPoints: body.friction_points as { condition: string; quote: string }[],
    howIllCoachYou: body.how_ill_coach_you as string,
  };
}

function isErrorPayload(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && isNonEmptyString((value as Record<string, unknown>).error);
}

function readConfig(): { url: string; anonKey: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!isNonEmptyString(url) || !isNonEmptyString(anonKey)) return null;
  return { url: url.replace(/\/$/, ""), anonKey };
}

if (__DEV__ && !readConfig()) {
  console.warn(
    "[blueprintApi] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set — " +
      "the Blueprint request will fail with a config error until prototype/expo/.env is filled in. " +
      "See docs/expo-first-run.md §6."
  );
}

export async function generateBlueprint(
  transcript: TranscriptTurn[],
  options?: { signal?: AbortSignal }
): Promise<BlueprintResponse> {
  const config = readConfig();
  if (!config) {
    throw new BlueprintApiError(
      "config",
      "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not configured."
    );
  }

  const controller = new AbortController();
  const externalSignal = options?.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${config.url}/functions/v1/generate-blueprint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify({ transcript: toWireTranscript(transcript) }),
      signal: controller.signal,
    });
  } catch (err) {
    if (externalSignal?.aborted) {
      throw new BlueprintApiError("aborted", "Request was cancelled.");
    }
    if (controller.signal.aborted) {
      throw new BlueprintApiError("timeout", `The request took longer than ${REQUEST_TIMEOUT_MS / 1000}s.`);
    }
    throw new BlueprintApiError("network", err instanceof Error ? err.message : "Network request failed.");
  } finally {
    clearTimeout(timeoutId);
  }

  let rawBody: unknown;
  try {
    rawBody = await response.json();
  } catch {
    throw new BlueprintApiError("invalid-response", "The server response was not valid JSON.");
  }

  if (!response.ok) {
    const message = isErrorPayload(rawBody) ? rawBody.error : `Request failed with status ${response.status}.`;
    throw new BlueprintApiError("server", message);
  }

  return parseBlueprintResponse(rawBody);
}

/** Never surface `err.message` directly in the UI — it can carry backend
 *  implementation detail (a Deno stack fragment, a lint-failure reason).
 *  This is the one calm, investor-safe message shown regardless of cause;
 *  the real `error` is still logged for whoever is running the demo. */
export function toInvestorSafeMessage(error: unknown): string {
  if (error instanceof BlueprintApiError) {
    console.error(`[blueprintApi] ${error.kind}: ${error.message}`);
  } else {
    console.error("[blueprintApi] unexpected error:", error);
  }
  return "I'm having trouble putting this together right now. Let's try again.";
}
