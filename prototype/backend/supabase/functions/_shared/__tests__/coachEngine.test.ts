import Anthropic from "npm:@anthropic-ai/sdk";
import { assertEquals, assertMatch, assertRejects } from "@std/assert";
import { CoachEngineError, synthesizeUnderstanding, type SynthesisModelResponse } from "../coachEngine.ts";

// synthesizeUnderstanding: retry/timeout/overload/refusal/malformed-JSON, via
// an injected fake modelCall — no network call, no real API key, exercising
// the actual load-bearing retry/budget/categorization logic this function
// was rebuilt to have (it previously had none at all — see its own doc
// comment for the root-cause writeup this suite guards against regressing).

const VALID_INPUT = {
  firstName: "Maya",
  becomingResponse: "I wanna be very best",
  visionCanvas: [
    { text: "Someone chasing the edge of their own potential", source: "ai" as const, edited: false },
    { text: "A person defining 'best' on their own terms", source: "ai" as const, edited: false },
  ],
};

function validResponse(overrides: Partial<{ headline: string }> = {}): SynthesisModelResponse {
  return {
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          headline: overrides.headline ?? "Excellence on your own terms",
          core_aspiration: "You want to become exceptional without letting comparison define you.",
          interpretation: "You appear to value mastery and disciplined daily progress.",
          identity_statement: "Someone who builds mastery patiently.",
          emerging_themes: ["Self-defined success"],
          uncertainties: ["The specific area is still unclear."],
          confidence: "medium",
        }),
      },
    ],
  };
}

function malformedResponse(): SynthesisModelResponse {
  return { stop_reason: "end_turn", content: [{ type: "text", text: "not valid json{{{" }] };
}

function refusalResponse(): SynthesisModelResponse {
  return { stop_reason: "refusal", content: [] };
}

function sequence(...responses: (SynthesisModelResponse | Error)[]) {
  let call = 0;
  const fn = (_userMessage: string, _system: string, _timeoutMs: number) => {
    const next = responses[call];
    call += 1;
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  };
  fn.callCount = () => call;
  return fn;
}

Deno.test("synthesizeUnderstanding succeeds on the first attempt with a valid response", async () => {
  const result = await synthesizeUnderstanding(VALID_INPUT, sequence(validResponse()));
  assertEquals(result.headline, "Excellence on your own terms");
  assertEquals(result.confidence, "medium");
});

Deno.test("synthesizeUnderstanding retries once after malformed JSON, then succeeds", async () => {
  const result = await synthesizeUnderstanding(VALID_INPUT, sequence(malformedResponse(), validResponse()));
  assertEquals(result.headline, "Excellence on your own terms");
});

Deno.test("synthesizeUnderstanding retries once after a refusal, then succeeds", async () => {
  const result = await synthesizeUnderstanding(VALID_INPUT, sequence(refusalResponse(), validResponse()));
  assertEquals(result.headline, "Excellence on your own terms");
});

Deno.test("synthesizeUnderstanding fails closed (malformed_json) after exhausting the bounded retry", async () => {
  await assertRejects(
    () => synthesizeUnderstanding(VALID_INPUT, sequence(malformedResponse(), malformedResponse())),
    CoachEngineError,
  );
});

Deno.test("synthesizeUnderstanding's malformed_json failure carries the correct error category", async () => {
  try {
    await synthesizeUnderstanding(VALID_INPUT, sequence(malformedResponse(), malformedResponse()));
    throw new Error("expected synthesizeUnderstanding to throw");
  } catch (err) {
    if (!(err instanceof CoachEngineError)) throw err;
    assertEquals(err.category, "malformed_json");
  }
});

Deno.test("synthesizeUnderstanding fails closed (refusal category) after exhausting the bounded retry", async () => {
  try {
    await synthesizeUnderstanding(VALID_INPUT, sequence(refusalResponse(), refusalResponse()));
    throw new Error("expected synthesizeUnderstanding to throw");
  } catch (err) {
    if (!(err instanceof CoachEngineError)) throw err;
    assertEquals(err.category, "refusal");
  }
});

// --- The actual root-cause regression this file exists to guard against:
// this function previously had zero retry/backoff/categorization at all, so
// a transient provider-overload error failed the whole turn on its very
// first occurrence — the exact failure class this codebase's own postmortem
// (docs/experiments/AE-001-postmortem-and-design-review.md Part 1) already
// root-caused for the sibling inspiration-generation call. ---

Deno.test("synthesizeUnderstanding retries once on a 529 overload error, then succeeds", async () => {
  const overloadError = new Anthropic.InternalServerError(
    529,
    { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
    "Overloaded",
    new Headers(),
    "overloaded_error",
  );
  const result = await synthesizeUnderstanding(VALID_INPUT, sequence(overloadError, validResponse()));
  assertEquals(result.headline, "Excellence on your own terms");
});

Deno.test("synthesizeUnderstanding fails closed (overloaded category) after exhausting the bounded retry — never silently degrades to 'unknown'", async () => {
  const overloadError = new Anthropic.InternalServerError(
    529,
    { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
    "Overloaded",
    new Headers(),
    "overloaded_error",
  );
  try {
    await synthesizeUnderstanding(VALID_INPUT, sequence(overloadError, overloadError));
    throw new Error("expected synthesizeUnderstanding to throw");
  } catch (err) {
    if (!(err instanceof CoachEngineError)) throw err;
    assertEquals(err.category, "overloaded");
  }
});

Deno.test("synthesizeUnderstanding treats a real provider timeout as immediately terminal — no retry spent on a timed-out attempt", async () => {
  const fn = sequence(new Anthropic.APIConnectionTimeoutError());
  try {
    await synthesizeUnderstanding(VALID_INPUT, fn);
    throw new Error("expected synthesizeUnderstanding to throw");
  } catch (err) {
    if (!(err instanceof CoachEngineError)) throw err;
    assertEquals(err.category, "timeout");
  }
  assertEquals(fn.callCount(), 1, "a timeout must not consume the bounded retry — it's the budget itself that's exhausted");
});

Deno.test("synthesizeUnderstanding retries once on a network error, then succeeds", async () => {
  const result = await synthesizeUnderstanding(
    VALID_INPUT,
    sequence(new Anthropic.APIConnectionError({ message: "connection reset" }), validResponse()),
  );
  assertEquals(result.headline, "Excellence on your own terms");
});

Deno.test("synthesizeUnderstanding fails closed (network category) after exhausting the bounded retry", async () => {
  try {
    await synthesizeUnderstanding(
      VALID_INPUT,
      sequence(
        new Anthropic.APIConnectionError({ message: "connection reset" }),
        new Anthropic.APIConnectionError({ message: "connection reset" }),
      ),
    );
    throw new Error("expected synthesizeUnderstanding to throw");
  } catch (err) {
    if (!(err instanceof CoachEngineError)) throw err;
    assertEquals(err.category, "network");
  }
});

Deno.test("synthesizeUnderstanding rejects a banned word in any generated prose field", async () => {
  const withBannedWord: SynthesisModelResponse = {
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          headline: "You will never fail again",
          core_aspiration: "aspiration",
          interpretation: "interpretation",
          identity_statement: "identity",
          emerging_themes: [],
          uncertainties: [],
          confidence: "low",
        }),
      },
    ],
  };
  await assertRejects(() => synthesizeUnderstanding(VALID_INPUT, sequence(withBannedWord)), CoachEngineError);
});

Deno.test("synthesizeUnderstanding threads age into the assembled prompt, verbatim rule included, when provided", async () => {
  let capturedSystem = "";
  const fn = (_userMessage: string, system: string, _timeoutMs: number) => {
    capturedSystem = system;
    return Promise.resolve(validResponse());
  };
  await synthesizeUnderstanding({ ...VALID_INPUT, age: 48 }, fn);
  assertMatch(capturedSystem, /Their age: 48\./);
  assertMatch(capturedSystem, /Age is weak contextual evidence, not a fact about the user's circumstances\./);
});

Deno.test("synthesizeUnderstanding omits any age line from the prompt when age is not provided", async () => {
  let capturedSystem = "";
  const fn = (_userMessage: string, system: string, _timeoutMs: number) => {
    capturedSystem = system;
    return Promise.resolve(validResponse());
  };
  await synthesizeUnderstanding(VALID_INPUT, fn);
  assertEquals(capturedSystem.includes("Their age:"), false);
});
