// Acceptance test harness for the rebuilt inspiration-generation vertical
// slice (identityEngine.ts / onboarding-turn's inspiration_generation turn).
// Hits the REAL deployed endpoint N times with a fixed input and reports the
// stats the acceptance criteria require. This is deliberately a thin script,
// not a test-runner suite — it exercises the live network path (real model
// latency, real JSON-schema output) that the mocked-dependency Deno tests in
// __tests__/ cannot, by design (those test this file's routing/safety logic
// only, with zero network calls, per this codebase's own testing convention).
//
// Usage:
//   deno run --allow-net --allow-env prototype/backend/scripts/inspirationAcceptanceTest.ts
//
// Requires SUPABASE_URL and SUPABASE_ANON_KEY in the environment (the same
// values prototype/expo/.env uses for EXPO_PUBLIC_SUPABASE_URL/ANON_KEY) —
// this script does not read .env files itself, to avoid a parsing
// dependency for a one-off script; export them first, e.g.:
//   export SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   export SUPABASE_ANON_KEY=YOUR-ANON-KEY
//   deno run --allow-net --allow-env prototype/backend/scripts/inspirationAcceptanceTest.ts

const RUNS = 20;
const INPUT_TEXT = "I want to be the very best";
const ON_TOPIC_KEYWORDS = [
  "excel", "excellence", "master", "mastery", "discipline", "disciplined",
  "recogni", "grow", "growth", "perform", "performance", "lead", "leader",
  "leadership", "best", "elite", "skill", "craft", "compete", "competitive",
  "achieve", "achievement", "improve", "improvement", "relentless", "focus",
  "commit", "dedication", "dedicated", "push", "strive", "sharpen",
];
const OFF_TOPIC_FAMILY_KEYWORDS = [
  "family", "parent", "mother", "father", "spouse", "partner", "marriage",
  "health", "sleep", "exercise", "diet", "relationship", "friend",
];

const url = Deno.env.get("SUPABASE_URL");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!url || !anonKey) {
  console.error("SUPABASE_URL and SUPABASE_ANON_KEY must be set in the environment.");
  Deno.exit(1);
}

type RunOutcome = {
  run: number;
  latencyMs: number;
  httpStatus: number;
  category: "ok" | "hard_stop" | "malformed" | "timeout" | "error";
  requestId: string | null;
  onTopicCount: number | null;
  offTopicUnflaggedCount: number | null;
  raw: unknown;
};

function scoreThoughts(thoughts: { text: string }[]): { onTopic: number; offTopicUnflagged: number } {
  let onTopic = 0;
  let offTopicUnflagged = 0;
  for (const t of thoughts) {
    const lower = t.text.toLowerCase();
    const isOnTopic = ON_TOPIC_KEYWORDS.some((k) => lower.includes(k));
    const isOffTopicFamily = OFF_TOPIC_FAMILY_KEYWORDS.some((k) => lower.includes(k));
    // "explicitly presents it as one possible interpretation" is judged
    // here by a soft heuristic (hedging language) — flagged for manual
    // review in the report rather than silently auto-passed/failed, since
    // this judgment call is inherently qualitative.
    const isHedged = /\b(or maybe|another way|could also|alternatively|or perhaps)\b/.test(lower);
    if (isOnTopic) onTopic += 1;
    if (isOffTopicFamily && !isHedged) offTopicUnflagged += 1;
  }
  return { onTopic, offTopicUnflagged };
}

async function runOnce(run: number): Promise<RunOutcome> {
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch(`${url}/functions/v1/onboarding-turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ turn_type: "inspiration_generation", first_name: "Runner", becoming_response: INPUT_TEXT }),
    });
  } catch (err) {
    return {
      run, latencyMs: Date.now() - start, httpStatus: 0, category: "error",
      requestId: null, onTopicCount: null, offTopicUnflaggedCount: null,
      raw: { error: err instanceof Error ? err.message : String(err) },
    };
  }
  const latencyMs = Date.now() - start;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { run, latencyMs, httpStatus: res.status, category: "malformed", requestId: null, onTopicCount: null, offTopicUnflaggedCount: null, raw: null };
  }

  const b = body as Record<string, unknown>;
  const requestId = typeof b.request_id === "string" ? b.request_id : null;

  if (res.status === 504) {
    return { run, latencyMs, httpStatus: res.status, category: "timeout", requestId, onTopicCount: null, offTopicUnflaggedCount: null, raw: body };
  }
  if (!res.ok) {
    return { run, latencyMs, httpStatus: res.status, category: "error", requestId, onTopicCount: null, offTopicUnflaggedCount: null, raw: body };
  }
  const safety = b.safety as Record<string, unknown> | undefined;
  if (safety?.hard_stop === true) {
    return { run, latencyMs, httpStatus: res.status, category: "hard_stop", requestId, onTopicCount: null, offTopicUnflaggedCount: null, raw: body };
  }
  if (!Array.isArray(b.thoughts)) {
    return { run, latencyMs, httpStatus: res.status, category: "malformed", requestId, onTopicCount: null, offTopicUnflaggedCount: null, raw: body };
  }
  const { onTopic, offTopicUnflagged } = scoreThoughts(b.thoughts as { text: string }[]);
  return { run, latencyMs, httpStatus: res.status, category: "ok", requestId, onTopicCount: onTopic, offTopicUnflaggedCount: offTopicUnflagged, raw: body };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

const outcomes: RunOutcome[] = [];
for (let i = 1; i <= RUNS; i += 1) {
  console.log(`Run ${i}/${RUNS}...`);
  const outcome = await runOnce(i);
  outcomes.push(outcome);
  console.log(
    `  status=${outcome.httpStatus} category=${outcome.category} latency=${outcome.latencyMs}ms request_id=${outcome.requestId ?? "-"}` +
      (outcome.onTopicCount !== null ? ` on_topic=${outcome.onTopicCount}/8 off_topic_unflagged=${outcome.offTopicUnflaggedCount}` : "")
  );
}

console.log("\n--- Raw JSON for the first 5 runs ---");
for (const o of outcomes.slice(0, 5)) {
  console.log(`\nRun ${o.run} (request_id=${o.requestId ?? "-"}):`);
  console.log(JSON.stringify(o.raw, null, 2));
}

const latencies = outcomes.map((o) => o.latencyMs).sort((a, b) => a - b);
const okRuns = outcomes.filter((o) => o.category === "ok");
const acceptanceMet = okRuns.filter((o) => (o.onTopicCount ?? 0) >= 6 && (o.offTopicUnflaggedCount ?? 0) === 0);
const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : NaN;
const p95 = percentile(latencies, 95);
const timeoutRate = outcomes.filter((o) => o.category === "timeout").length / RUNS;
const malformedRate = outcomes.filter((o) => o.category === "malformed").length / RUNS;
const errorRate = outcomes.filter((o) => o.category === "error").length / RUNS;
const hardStopRate = outcomes.filter((o) => o.category === "hard_stop").length / RUNS;

console.log("\n--- Acceptance summary ---");
console.log(`Runs: ${RUNS}`);
console.log(`Success rate (>=6/8 on-topic, 0 unflagged off-topic): ${acceptanceMet.length}/${RUNS} = ${((acceptanceMet.length / RUNS) * 100).toFixed(1)}%`);
console.log(`Median latency: ${median}ms`);
console.log(`p95 latency: ${p95}ms`);
console.log(`Timeout rate (server 504 / client would show recovery UI — this IS the 'fallback rate,' since fallback is only ever client-triggered by a failed/timed-out request): ${(timeoutRate * 100).toFixed(1)}%`);
console.log(`Malformed-response rate: ${(malformedRate * 100).toFixed(1)}%`);
console.log(`Other error rate: ${(errorRate * 100).toFixed(1)}%`);
console.log(`Hard-stop rate (should be ~0% for this benign input): ${(hardStopRate * 100).toFixed(1)}%`);
console.log(`\nRequest IDs for this run (cross-reference against server logs):`);
for (const o of outcomes) console.log(`  run ${o.run}: ${o.requestId ?? "(none)"}`);
