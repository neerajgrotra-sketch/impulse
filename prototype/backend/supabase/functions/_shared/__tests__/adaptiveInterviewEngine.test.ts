import Anthropic from "npm:@anthropic-ai/sdk";
import { assertEquals, assertRejects } from "@std/assert";
import {
  AdaptiveInterviewError,
  chooseNextQuestion,
  findAdaptiveQuestionViolation,
  MAX_ADAPTIVE_TURNS,
  type AdaptiveQuestionModelResponse,
} from "../adaptiveInterviewEngine.ts";

const VALID_INPUT = { firstName: "Maya", becomingResponse: "I want to lose weight and be healthy", history: [] };

function questionResponse(overrides: Partial<{ options: string[]; question: string; done: boolean }> = {}): AdaptiveQuestionModelResponse {
  return {
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          psychological_state: { observed: ["wants to be healthier"], inferred: [], unknown: ["what success feels like"] },
          question: overrides.question ?? "When you imagine succeeding, what excites you the most?",
          options: overrides.options ?? ["Feeling confident again", "Having more energy", "Being there for my family"],
          allow_free_text: true,
          done: overrides.done ?? false,
          done_reason: "",
        }),
      },
    ],
  };
}

function doneResponse(): AdaptiveQuestionModelResponse {
  return {
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          psychological_state: { observed: ["a lot"], inferred: [], unknown: [] },
          question: "",
          options: [],
          allow_free_text: false,
          done: true,
          done_reason: "enough is understood",
        }),
      },
    ],
  };
}

function malformedResponse(): AdaptiveQuestionModelResponse {
  return { stop_reason: "end_turn", content: [{ type: "text", text: "not valid json{{{" }] };
}

function refusalResponse(): AdaptiveQuestionModelResponse {
  return { stop_reason: "refusal", content: [] };
}

function sequence(...responses: (AdaptiveQuestionModelResponse | Error)[]) {
  let call = 0;
  const fn = (_userMessage: string, _system: string, _timeoutMs: number, _retryNote?: string) => {
    const next = responses[call];
    call += 1;
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  };
  fn.callCount = () => call;
  return fn;
}

Deno.test("findAdaptiveQuestionViolation passes a clean set of 3-5 options", () => {
  for (const count of [3, 4, 5]) {
    const options = Array.from({ length: count }, (_, i) => `Option ${i}`);
    assertEquals(findAdaptiveQuestionViolation({ question: "A new question?", options }, []), null);
  }
});

Deno.test("findAdaptiveQuestionViolation catches too few options", () => {
  assertEquals(findAdaptiveQuestionViolation({ question: "Q?", options: ["only one"] }, []) !== null, true);
});

Deno.test("findAdaptiveQuestionViolation catches too many options (never an 8-item menu)", () => {
  const options = Array.from({ length: 8 }, (_, i) => `Option ${i}`);
  assertEquals(findAdaptiveQuestionViolation({ question: "Q?", options }, []) !== null, true);
});

Deno.test("findAdaptiveQuestionViolation catches a banned word in the question", () => {
  const violation = findAdaptiveQuestionViolation({ question: "Why do you always fail at this?", options: ["a", "b", "c"] }, []);
  assertEquals(violation !== null && violation.includes("fail"), true);
});

Deno.test("findAdaptiveQuestionViolation catches a repeated question — the concrete 'asks the same thing twice' bug", () => {
  const history = [{ question: "What excites you most?", answer: "Energy" }];
  const violation = findAdaptiveQuestionViolation({ question: "What excites you most?", options: ["a", "b", "c"] }, history);
  assertEquals(violation, "question repeats one already asked in this conversation");
});

Deno.test("chooseNextQuestion succeeds on the first attempt with a valid question", async () => {
  const result = await chooseNextQuestion(VALID_INPUT, sequence(questionResponse()));
  assertEquals(result.question, "When you imagine succeeding, what excites you the most?");
  assertEquals(result.options.length, 3);
  assertEquals(result.done, false);
  assertEquals(result.meta.modelCalled, true);
});

Deno.test("chooseNextQuestion never calls the model once the history hits the hard turn ceiling — the model's own 'done' signal is never the only stop condition", async () => {
  const history = Array.from({ length: MAX_ADAPTIVE_TURNS }, (_, i) => ({ question: `Q${i}`, answer: `A${i}` }));
  const fn = sequence(questionResponse());
  const result = await chooseNextQuestion({ ...VALID_INPUT, history }, fn);
  assertEquals(result.done, true);
  assertEquals(result.meta.modelCalled, false);
  assertEquals(fn.callCount(), 0, "the model must never be called once the ceiling is reached");
});

Deno.test("chooseNextQuestion accepts done:true without linting question/options", async () => {
  const result = await chooseNextQuestion(VALID_INPUT, sequence(doneResponse()));
  assertEquals(result.done, true);
  assertEquals(result.doneReason, "enough is understood");
});

Deno.test("chooseNextQuestion retries once after a lint violation (too many options), then succeeds", async () => {
  const tooMany = questionResponse({ options: Array.from({ length: 8 }, (_, i) => `Option ${i}`) });
  const result = await chooseNextQuestion(VALID_INPUT, sequence(tooMany, questionResponse()));
  assertEquals(result.options.length, 3);
});

Deno.test("chooseNextQuestion retries once after malformed JSON, then succeeds", async () => {
  const result = await chooseNextQuestion(VALID_INPUT, sequence(malformedResponse(), questionResponse()));
  assertEquals(result.question.length > 0, true);
});

Deno.test("chooseNextQuestion retries once after a refusal, then succeeds", async () => {
  const result = await chooseNextQuestion(VALID_INPUT, sequence(refusalResponse(), questionResponse()));
  assertEquals(result.question.length > 0, true);
});

Deno.test("chooseNextQuestion fails closed (malformed_json) after exhausting the bounded retry", async () => {
  await assertRejects(() => chooseNextQuestion(VALID_INPUT, sequence(malformedResponse(), malformedResponse())), AdaptiveInterviewError);
});

Deno.test("chooseNextQuestion retries once on a 529 overload error, then succeeds", async () => {
  const overloadError = new Anthropic.InternalServerError(
    529,
    { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
    "Overloaded",
    new Headers(),
    "overloaded_error",
  );
  const result = await chooseNextQuestion(VALID_INPUT, sequence(overloadError, questionResponse()));
  assertEquals(result.question.length > 0, true);
});

Deno.test("chooseNextQuestion fails closed (overloaded category) after exhausting the bounded retry", async () => {
  const overloadError = new Anthropic.InternalServerError(
    529,
    { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
    "Overloaded",
    new Headers(),
    "overloaded_error",
  );
  try {
    await chooseNextQuestion(VALID_INPUT, sequence(overloadError, overloadError));
    throw new Error("expected chooseNextQuestion to throw");
  } catch (err) {
    if (!(err instanceof AdaptiveInterviewError)) throw err;
    assertEquals(err.category, "overloaded");
  }
});

Deno.test("chooseNextQuestion treats a real provider timeout as immediately terminal — no retry spent on a timed-out attempt", async () => {
  const fn = sequence(new Anthropic.APIConnectionTimeoutError());
  try {
    await chooseNextQuestion(VALID_INPUT, fn);
    throw new Error("expected chooseNextQuestion to throw");
  } catch (err) {
    if (!(err instanceof AdaptiveInterviewError)) throw err;
    assertEquals(err.category, "timeout");
  }
  assertEquals(fn.callCount(), 1);
});
