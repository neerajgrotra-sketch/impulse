// OBSERVABILITY for the onboarding-turn endpoint's inspiration-generation
// slice: one structured (JSON, one line) log record per request, so a
// request ID logged here can be grepped straight out of `supabase functions
// logs` / the dashboard. Deliberately not a logging library — one function,
// one shape, matching this codebase's "no dependency for what a few lines
// of code already does" convention (see generate-blueprint's own plain
// console.error usage).
export interface InspirationRequestLog {
  request_id: string;
  turn_type: "inspiration_generation";
  status: "ok" | "hard_stop" | "error";
  model: string;
  total_latency_ms: number;
  provider_latency_ms: number;
  parse_latency_ms: number;
  attempts: number;
  safety_tier: string | null;
  error_category: string | null;
  /** True when total_latency_ms exceeded identityEngine.ts's own
   *  SERVER_TOTAL_BUDGET_MS target (8s) — that budget is deliberately not
   *  enforced with a second abort (see identityEngine.ts's header comment),
   *  so this is how a violated assumption becomes observable instead of a
   *  silent erosion of the client's 10s margin. Expected to be false in
   *  virtually every request; a sustained true rate is a signal the margin
   *  needs revisiting. */
  over_budget: boolean;
}

export function logInspirationRequest(entry: InspirationRequestLog): void {
  console.log(JSON.stringify({ ...entry, ts: new Date().toISOString() }));
}
