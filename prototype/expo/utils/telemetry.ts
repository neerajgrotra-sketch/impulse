import type { CoachingBeat } from "@/types/adaptiveCoaching";

/**
 * AE-001-only, log-only telemetry (docs/experiments/AE-001-first-adaptive-coaching-loop.md).
 * No analytics SDK exists in this codebase and none is added here — every
 * event is a `console.log`, gated by `__DEV__`, and never carries raw
 * fragment/response text or any identifier beyond what Expo already
 * collects incidentally. Counts, enums, and durations only.
 */
export type TelemetryEvent =
  | { type: "time_to_first_interaction"; ms: number }
  | { type: "time_to_continue"; ms: number }
  | { type: "thoughts_selected"; count: number }
  | { type: "thoughts_edited"; count: number }
  | { type: "thoughts_deleted"; count: number }
  | { type: "input_modality"; modality: "voice" | "typed" }
  | { type: "ai_wording_accepted_vs_edited"; accepted: number; edited: number }
  | { type: "coaching_beat_chosen"; beat: CoachingBeat };

export function logTelemetryEvent(event: TelemetryEvent): void {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log("[AE-001 telemetry]", event);
}
