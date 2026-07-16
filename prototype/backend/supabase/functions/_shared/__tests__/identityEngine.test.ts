import Anthropic from "npm:@anthropic-ai/sdk";
import { assertEquals, assertMatch, assertRejects } from "@std/assert";
import { findThoughtSetViolation, generateInspiration, IdentityEngineError, type ModelResponse } from "../identityEngine.ts";

function thoughts(count: number, text = (i: number) => `Someone who does thing ${i}`) {
  return Array.from({ length: count }, (_, i) => ({ text: text(i) }));
}

Deno.test("findThoughtSetViolation passes a clean set of 8", () => {
  const violation = findThoughtSetViolation({ thoughts: thoughts(8) });
  assertEquals(violation, null);
});

Deno.test("findThoughtSetViolation passes down to the tolerance floor (6)", () => {
  const violation = findThoughtSetViolation({ thoughts: thoughts(6) });
  assertEquals(violation, null);
});

Deno.test("findThoughtSetViolation passes up to the tolerance ceiling (10)", () => {
  const violation = findThoughtSetViolation({ thoughts: thoughts(10) });
  assertEquals(violation, null);
});

Deno.test("findThoughtSetViolation catches under-generation — the real device failure this guardrail exists for", () => {
  const violation = findThoughtSetViolation({ thoughts: thoughts(2) });
  assertMatch(violation ?? "", /generated 2 thoughts/);
});

Deno.test("findThoughtSetViolation catches a near-empty response (0 thoughts)", () => {
  const violation = findThoughtSetViolation({ thoughts: [] });
  assertMatch(violation ?? "", /generated 0 thoughts/);
});

Deno.test("findThoughtSetViolation catches over-generation past the tolerance ceiling", () => {
  const violation = findThoughtSetViolation({ thoughts: thoughts(11) });
  assertMatch(violation ?? "", /generated 11 thoughts/);
});

Deno.test("findThoughtSetViolation catches a banned word in any thought", () => {
  const violation = findThoughtSetViolation({
    thoughts: thoughts(8, (i) => (i === 3 ? "Someone who never fails at anything" : `Someone who does thing ${i}`)),
  });
  assertMatch(violation ?? "", /banned word "fail"/);
});

Deno.test("findThoughtSetViolation catches goal/wish-phrased content, not identity-shaped", () => {
  const violation = findThoughtSetViolation({
    thoughts: thoughts(8, (i) => (i === 0 ? "I want to be better at this" : `Someone who does thing ${i}`)),
  });
  assertMatch(violation ?? "", /goal\/wish-phrased/);
});

// --- generateInspiration: retry/timeout/refusal/malformed-JSON, via an
// injected fake modelCall — no network call, no real API key, exercising
// the actual load-bearing retry/budget/categorization logic this module
// owns (dependency-injection-over-module-mocking, matching safetyEngine.ts's
// own `classifyRisk(text, classifier)` pattern). ---

const VALID_INPUT = { firstName: "Maya", becomingResponse: "I want to be the very best" };

function validResponse(overrides: Partial<{ tier: string; thoughtCount: number }> = {}): ModelResponse {
  const tier = overrides.tier ?? "none";
  const count = overrides.thoughtCount ?? 8;
  const thoughtsJson = Array.from({ length: count }, (_, i) => ({ dimension: "Habits & Discipline", text: `Someone who does thing ${i}` }));
  return {
    stop_reason: "end_turn",
    content: [{ type: "text", text: JSON.stringify({ safety: { tier, rationale_code: "test" }, thoughts: thoughtsJson }) }],
  };
}

function malformedResponse(): ModelResponse {
  return { stop_reason: "end_turn", content: [{ type: "text", text: "not valid json{{{" }] };
}

function refusalResponse(): ModelResponse {
  return { stop_reason: "refusal", content: [] };
}

function sequence(...responses: (ModelResponse | Error)[]) {
  let call = 0;
  const retryNotes: (string | undefined)[] = [];
  const fn = (_userMessage: string, _system: string, _timeoutMs: number, retryNote?: string) => {
    const next = responses[call];
    call += 1;
    retryNotes.push(retryNote);
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  };
  fn.retryNotes = retryNotes;
  return fn;
}

Deno.test("generateInspiration succeeds on the first attempt with a valid response", async () => {
  const result = await generateInspiration(VALID_INPUT, sequence(validResponse()));
  assertEquals(result.thoughts.length, 8);
  assertEquals(result.meta.attempts, 1);
  assertEquals(result.safety.tier, "none");
  assertEquals(result.thoughts.every((t) => t.source === "ai"), true);
});

Deno.test("generateInspiration derives rankedDimensions from the thoughts' own dimension tags, not a model-provided ranking", async () => {
  const response: ModelResponse = {
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          safety: { tier: "none", rationale_code: "test" },
          thoughts: [
            { dimension: "Habits & Discipline", text: "Someone who follows through" },
            { dimension: "Habits & Discipline", text: "Someone who shows up daily" },
            { dimension: "Confidence & Self-Worth", text: "Someone who trusts their own judgment" },
            { dimension: "Confidence & Self-Worth", text: "Someone who stands by hard calls" },
            { dimension: "Confidence & Self-Worth", text: "Someone who owns their choices" },
            { dimension: "Personal Growth", text: "Someone who keeps sharpening their craft" },
          ],
        }),
      },
    ],
  };
  const result = await generateInspiration(VALID_INPUT, sequence(response));
  const discipline = result.rankedDimensions.find((d) => d.dimension === "Habits & Discipline");
  const confidence = result.rankedDimensions.find((d) => d.dimension === "Confidence & Self-Worth");
  assertEquals(discipline?.relevance, 2 / 6);
  assertEquals(confidence?.relevance, 3 / 6);
});

Deno.test("generateInspiration retries once after malformed JSON, then succeeds — attempts reported as 2", async () => {
  const result = await generateInspiration(VALID_INPUT, sequence(malformedResponse(), validResponse()));
  assertEquals(result.meta.attempts, 2);
  assertEquals(result.thoughts.length, 8);
});

Deno.test("generateInspiration retries once after a refusal, then succeeds", async () => {
  const result = await generateInspiration(VALID_INPUT, sequence(refusalResponse(), validResponse()));
  assertEquals(result.meta.attempts, 2);
});

Deno.test("generateInspiration retries once after under-generation, and the retry prompt names the violation", async () => {
  const fn = sequence(validResponse({ thoughtCount: 2 }), validResponse());
  await generateInspiration(VALID_INPUT, fn);
  assertEquals(fn.retryNotes[0], undefined, "first attempt gets no retry note");
  assertMatch(fn.retryNotes[1] ?? "", /violated a rule/);
  assertMatch(fn.retryNotes[1] ?? "", /generated 2 thoughts/);
});

Deno.test("generateInspiration fails closed (malformed_json) after MAX_ATTEMPTS malformed responses — never fabricates a result", async () => {
  await assertRejects(
    () => generateInspiration(VALID_INPUT, sequence(malformedResponse(), malformedResponse())),
    IdentityEngineError,
  );
});

Deno.test("generateInspiration's malformed_json failure carries the correct error category", async () => {
  try {
    await generateInspiration(VALID_INPUT, sequence(malformedResponse(), malformedResponse()));
    throw new Error("expected generateInspiration to throw");
  } catch (err) {
    if (!(err instanceof IdentityEngineError)) throw err;
    assertEquals(err.category, "malformed_json");
  }
});

Deno.test("generateInspiration fails closed (refusal category) after MAX_ATTEMPTS refusals", async () => {
  try {
    await generateInspiration(VALID_INPUT, sequence(refusalResponse(), refusalResponse()));
    throw new Error("expected generateInspiration to throw");
  } catch (err) {
    if (!(err instanceof IdentityEngineError)) throw err;
    assertEquals(err.category, "refusal");
  }
});

Deno.test("generateInspiration treats a real provider timeout as immediately terminal — no retry spent on a timed-out attempt", async () => {
  let calls = 0;
  const fn = (): Promise<ModelResponse> => {
    calls += 1;
    return Promise.reject(new Anthropic.APIConnectionTimeoutError());
  };
  try {
    await generateInspiration(VALID_INPUT, fn);
    throw new Error("expected generateInspiration to throw");
  } catch (err) {
    if (!(err instanceof IdentityEngineError)) throw err;
    assertEquals(err.category, "timeout");
  }
  assertEquals(calls, 1, "a timeout must not consume the bounded retry — it's the budget itself that's exhausted");
});

Deno.test("generateInspiration retries once on a network error, then succeeds", async () => {
  const result = await generateInspiration(
    VALID_INPUT,
    sequence(new Anthropic.APIConnectionError({ message: "connection reset" }), validResponse()),
  );
  assertEquals(result.meta.attempts, 2);
});

Deno.test("generateInspiration fails closed (network category) after MAX_ATTEMPTS network errors", async () => {
  try {
    await generateInspiration(
      VALID_INPUT,
      sequence(
        new Anthropic.APIConnectionError({ message: "connection reset" }),
        new Anthropic.APIConnectionError({ message: "connection reset" }),
      ),
    );
    throw new Error("expected generateInspiration to throw");
  } catch (err) {
    if (!(err instanceof IdentityEngineError)) throw err;
    assertEquals(err.category, "network");
  }
});

Deno.test("generateInspiration fails closed (incomplete_or_invalid) when safety.tier is missing or invalid, even with valid thoughts", async () => {
  const badTier: ModelResponse = {
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          safety: { tier: "not_a_real_tier", rationale_code: "test" },
          thoughts: Array.from({ length: 8 }, (_, i) => ({ dimension: "Habits & Discipline", text: `Someone who does thing ${i}` })),
        }),
      },
    ],
  };
  try {
    await generateInspiration(VALID_INPUT, sequence(badTier, badTier));
    throw new Error("expected generateInspiration to throw");
  } catch (err) {
    if (!(err instanceof IdentityEngineError)) throw err;
    assertEquals(err.category, "incomplete_or_invalid");
  }
});

Deno.test("generateInspiration never returns a hard-stop tier silently as 'safe' — elevated/crisis still parse through, decision is the caller's", async () => {
  const result = await generateInspiration(VALID_INPUT, sequence(validResponse({ tier: "crisis" })));
  assertEquals(result.safety.tier, "crisis");
  // This module itself does not withhold content on a hard-stop tier — that
  // guarantee is onboarding-turn/index.ts's job (see its own red-team test).
  // Asserting the tier round-trips faithfully, unsoftened, is this module's
  // share of that guarantee.
  assertEquals(result.thoughts.length, 8);
});
