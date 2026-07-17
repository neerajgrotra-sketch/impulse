// Golden + red-team eval set (adr/0008 §9's pattern) for the one endpoint
// this whole slice depends on. Every dependency is injected — no network
// call, no real API key — so this suite tests the actual routing/safety
// logic this file owns, deterministically. This is explicitly named,
// per docs/experiments/AE-001-first-adaptive-coaching-loop.md, as a
// prerequisite for the experiment to run at all, even moderated.
import { assertEquals } from "@std/assert";
import { handleOnboardingTurn, type OnboardingTurnDeps } from "../index.ts";
import { AdaptiveInterviewError } from "../../_shared/adaptiveInterviewEngine.ts";
import { CoachEngineError } from "../../_shared/coachEngine.ts";
import { IdentityEngineError } from "../../_shared/identityEngine.ts";
import { SafetyClassificationError, type SafetyClassification, type SafetyTier } from "../../_shared/safetyEngine.ts";

function request(body: unknown, method = "POST"): Request {
  return new Request("http://localhost/onboarding-turn", {
    method,
    body: method === "POST" ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

// `tier` now drives BOTH generateInspiration's embedded safety.tier (the
// inspiration_generation path, since decisions/0010's fold-in means there is
// no separate pre-call classification for that turn) and classifyRisk's
// return (the onboarding_beat path, which is unchanged and still classifies
// before routing). Tests below pick whichever field is relevant to the turn
// type they exercise.
function depsWithTier(tier: SafetyTier, overrides: Partial<OnboardingTurnDeps> = {}): OnboardingTurnDeps {
  return {
    classifyRisk: (): Promise<SafetyClassification> => Promise.resolve({ tier, rationaleCode: "test" }),
    generateInspiration: () =>
      Promise.resolve({
        safety: { tier, rationaleCode: "test" },
        rankedDimensions: [{ dimension: "Health & Energy", relevance: 0.9 }],
        thoughts: [{ id: "t1", dimension: "Health & Energy", text: "Someone who feels stronger every day", source: "ai" as const }],
        meta: { attempts: 1, providerLatencyMs: 400, parseLatencyMs: 1 },
      }),
    chooseOnboardingBeat: () =>
      Promise.resolve({
        psychologicalState: { observed: ["wants healthier habits"], inferred: [], unknown: ["primary obstacle"] },
        chosenBeat: "Reflection",
        chosenMove: "Reflect",
        message: "It sounds like you're ready to feel stronger.",
        rationaleCode: "clear_and_specific",
        confidence: 0.8,
        flags: [],
        moveDowngraded: false,
      }),
    synthesizeUnderstanding: () =>
      Promise.resolve({
        headline: "Excellence on your own terms",
        coreAspiration: "You want to become exceptional without letting comparison define you.",
        interpretation:
          "You appear to value mastery, disciplined daily progress, and personal growth. Success is becoming less about outperforming other people and more about reaching your own potential while valuing the process.",
        identityStatement:
          "Someone who builds mastery patiently, measures growth against themselves, and enjoys the climb.",
        emergingThemes: ["Self-defined success", "Disciplined mastery", "Process over outcome"],
        uncertainties: ["The specific area of life where you want to become exceptional is still unclear."],
        confidence: "medium" as const,
      }),
    chooseNextQuestion: () =>
      Promise.resolve({
        psychologicalState: { observed: ["wants to be healthier"], inferred: [], unknown: ["what success feels like"] },
        question: "When you imagine succeeding, what excites you the most?",
        options: ["Feeling confident again", "Having more energy", "Being there for my family"],
        allowFreeText: true,
        done: false,
        doneReason: "",
        meta: { attempts: 1, modelCalled: true },
      }),
    ...overrides,
  };
}

function adaptiveQuestionRequestBody(overrides: Record<string, unknown> = {}) {
  return {
    turn_type: "adaptive_question",
    first_name: "Maya",
    becoming_response: "I want to lose weight and be healthy",
    history: [],
    ...overrides,
  };
}

function finalSynthesisRequestBody(overrides: Record<string, unknown> = {}) {
  return {
    turn_type: "final_synthesis",
    first_name: "Maya",
    becoming_response: "I wanna be very best",
    vision_canvas: [
      { text: "Someone chasing the edge of their own potential", source: "ai", edited: false },
      { text: "A person defining 'best' on their own terms", source: "ai", edited: false },
    ],
    ...overrides,
  };
}

// --- Golden cases: known-safe input proceeds normally ---

Deno.test("golden: inspiration_generation with ordinary content returns 200, thoughts, and a request id", async () => {
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", first_name: "Maya", becoming_response: "I want to be more present with my family" }),
    depsWithTier("none"),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, false);
  assertEquals(Array.isArray(body.ranked_dimensions), true);
  assertEquals(Array.isArray(body.thoughts), true);
  assertEquals(typeof body.request_id, "string");
  assertEquals(body.retry_count, 0);
});

Deno.test("golden: onboarding_beat with ordinary content returns 200 and a chosen beat/move", async () => {
  const res = await handleOnboardingTurn(
    request({
      turn_type: "onboarding_beat",
      first_name: "Maya",
      becoming_response: "I want to follow through more",
      ranked_dimensions: [{ dimension: "Habits & Discipline", relevance: 0.85 }],
      vision_canvas: [{ text: "Someone who follows through" }],
    }),
    depsWithTier("none"),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.chosen_beat, "Reflection");
  assertEquals(body.chosen_move, "Reflect");
  assertEquals(typeof body.request_id, "string");
});

Deno.test("golden: low tier still proceeds (not a hard-stop tier)", async () => {
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "I've been feeling overwhelmed lately" }),
    depsWithTier("low"),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, false);
});

// --- Red-team subset: elevated/crisis must ALWAYS hard-stop, zero tolerance ---

// Architecture note: unlike before this rebuild, the Identity Engine now
// ALWAYS runs on inspiration_generation, even on an elevated/crisis tier —
// there is no cheaper way to learn the tier than the one merged call that
// also generates thoughts (decisions/0010's endorsed fold-in). The
// guarantee this test enforces is no longer "the engine is never called";
// it's the guarantee that actually matters: generated content NEVER
// reaches the response body on a hard-stop tier.
Deno.test("red-team: elevated tier hard-stops inspiration_generation — thoughts/ranked_dimensions never reach the response", async () => {
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "some concerning disclosure" }),
    depsWithTier("elevated"),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true);
  assertEquals(body.safety.tier, "elevated");
  assertEquals(body.thoughts, undefined, "generated thoughts must never appear in a hard-stop response");
  assertEquals(body.ranked_dimensions, undefined, "ranked dimensions must never appear in a hard-stop response");
});

Deno.test("red-team: crisis tier hard-stops onboarding_beat, Coach Engine never called", async () => {
  let coachEngineCalled = false;
  const deps = depsWithTier("crisis", {
    chooseOnboardingBeat: () => {
      coachEngineCalled = true;
      return Promise.reject(new Error("should never be called"));
    },
  });
  const res = await handleOnboardingTurn(
    request({
      turn_type: "onboarding_beat",
      becoming_response: "text",
      ranked_dimensions: [],
      vision_canvas: [{ text: "a crisis-adjacent disclosure" }],
    }),
    deps,
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true);
  assertEquals(body.safety.tier, "crisis");
  assertEquals(coachEngineCalled, false, "Coach Engine must never run on a hard-stop tier");
});

Deno.test("red-team: hard-stop response never fabricates crisis-resource content beyond the fixed message", async () => {
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "crisis content" }),
    depsWithTier("crisis"),
  );
  const body = await res.json();
  // No invented phone numbers/org names — just the one fixed, honest message.
  assertEquals(typeof body.safety.message, "string");
  assertEquals(/\d{3}-\d{4}/.test(body.safety.message), false, "must not contain a fabricated phone number");
});

Deno.test("red-team: outbound re-check hard-stops onboarding_beat even when inbound was clean", async () => {
  const deps: OnboardingTurnDeps = {
    classifyRisk: (text: string) =>
      // Inbound (vision canvas) is clean; outbound (generated message) trips.
      Promise.resolve({ tier: text.includes("generated") ? "elevated" : "none", rationaleCode: "test" }),
    generateInspiration: () => Promise.reject(new Error("not used")),
    chooseOnboardingBeat: () =>
      Promise.resolve({
        psychologicalState: { observed: [], inferred: [], unknown: [] },
        chosenBeat: "Reflection",
        chosenMove: "Reflect",
        message: "a generated message that the outbound check flags",
        rationaleCode: "x",
        confidence: 0.5,
        flags: [],
        moveDowngraded: false,
      }),
    synthesizeUnderstanding: () => Promise.reject(new Error("not used")),
    chooseNextQuestion: () => Promise.reject(new Error("not used")),
  };
  const res = await handleOnboardingTurn(
    request({
      turn_type: "onboarding_beat",
      becoming_response: "text",
      ranked_dimensions: [],
      vision_canvas: [{ text: "clean input" }],
    }),
    deps,
  );
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true, "an outbound-only risk signal must still hard-stop the turn");
});

// --- Fail-closed on failure ---

Deno.test("fail-closed: onboarding_beat's pre-call safety classification failure returns 503, never proceeds as if safe", async () => {
  const deps = depsWithTier("none", {
    classifyRisk: () => Promise.reject(new SafetyClassificationError("boom")),
  });
  const res = await handleOnboardingTurn(
    request({
      turn_type: "onboarding_beat",
      becoming_response: "text",
      ranked_dimensions: [],
      vision_canvas: [{ text: "fragment" }],
    }),
    deps,
  );
  assertEquals(res.status, 503);
});

Deno.test("fail-closed: inspiration_generation's merged call failing outright returns an error status, never a 200", async () => {
  const deps = depsWithTier("none", {
    generateInspiration: () => Promise.reject(new IdentityEngineError("malformed_json", "model output was not valid JSON")),
  });
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "text" }),
    deps,
  );
  assertEquals(res.status, 502);
  const body = await res.json();
  assertEquals(body.thoughts, undefined);
});

Deno.test("fail-closed: a timeout-category failure on inspiration_generation returns 504, distinct from other errors", async () => {
  const deps = depsWithTier("none", {
    generateInspiration: () => Promise.reject(new IdentityEngineError("timeout", "exceeded the 8000ms total budget")),
  });
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "text" }),
    deps,
  );
  assertEquals(res.status, 504);
});

// --- Move-eligibility guard surfaces correctly through the wire response ---

Deno.test("move-eligibility guard: a downgraded move is reported as such in the response", async () => {
  const deps = depsWithTier("none", {
    chooseOnboardingBeat: () =>
      Promise.resolve({
        psychologicalState: { observed: [], inferred: [], unknown: [] },
        chosenBeat: "Reflection",
        chosenMove: "Affirm", // already-downgraded value coming out of coachEngine.ts
        message: "message",
        rationaleCode: "x; move downgraded from Commit to Affirm (not eligible on first turn)",
        confidence: 0.5,
        flags: [],
        moveDowngraded: true,
      }),
  });
  const res = await handleOnboardingTurn(
    request({
      turn_type: "onboarding_beat",
      becoming_response: "text",
      ranked_dimensions: [],
      vision_canvas: [{ text: "fragment" }],
    }),
    deps,
  );
  const body = await res.json();
  assertEquals(body.move_downgraded, true);
  assertEquals(body.chosen_move, "Affirm");
});

// --- final_synthesis (Understanding Review) ---

Deno.test("golden: final_synthesis with ordinary content returns 200 and a structured understanding review", async () => {
  const res = await handleOnboardingTurn(request(finalSynthesisRequestBody()), depsWithTier("none"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, false);
  assertEquals(typeof body.understanding.headline, "string");
  assertEquals(typeof body.understanding.core_aspiration, "string");
  assertEquals(typeof body.understanding.interpretation, "string");
  assertEquals(typeof body.understanding.identity_statement, "string");
  assertEquals(Array.isArray(body.understanding.emerging_themes), true);
  assertEquals(Array.isArray(body.understanding.uncertainties), true);
  assertEquals(["low", "medium", "high"].includes(body.understanding.confidence), true);
  assertEquals(typeof body.request_id, "string");
  assertEquals(body.prompt_version, "final-synthesis-v1");
});

Deno.test("fixture: the spec's 'I wanna be very best' input produces a schema-valid UnderstandingReview", async () => {
  const res = await handleOnboardingTurn(
    request(
      finalSynthesisRequestBody({
        vision_canvas: [
          { text: "Someone chasing the edge of their own potential", source: "ai", edited: false },
          { text: "Someone learning to enjoy the climb, not just the peak", source: "ai", edited: false },
          { text: "A person defining 'best' on their own terms", source: "ai", edited: false },
          { text: "A person who measures growth against themselves, not others", source: "ai", edited: false },
          { text: "Someone building small daily practices toward mastery", source: "ai", edited: false },
        ],
      }),
    ),
    depsWithTier("none"),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  const { understanding } = body;
  assertEquals(understanding.headline, "Excellence on your own terms");
  assertEquals(understanding.core_aspiration, "You want to become exceptional without letting comparison define you.");
  assertEquals(understanding.confidence, "medium");
  assertEquals(understanding.uncertainties.length > 0, true);
});

Deno.test("red-team: elevated tier hard-stops final_synthesis before the model is ever called", async () => {
  let synthesisCalled = false;
  const deps = depsWithTier("elevated", {
    synthesizeUnderstanding: () => {
      synthesisCalled = true;
      return Promise.reject(new Error("should never be called"));
    },
  });
  const res = await handleOnboardingTurn(request(finalSynthesisRequestBody()), deps);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true);
  assertEquals(body.safety.tier, "elevated");
  assertEquals(body.understanding, undefined, "no understanding review may reach the response on a hard-stop tier");
  assertEquals(synthesisCalled, false, "Coach Engine must never run on a hard-stop tier");
});

Deno.test("red-team: outbound re-check hard-stops final_synthesis even when inbound was clean", async () => {
  const deps: OnboardingTurnDeps = {
    classifyRisk: (text: string) =>
      Promise.resolve({ tier: text.includes("flagged") ? "elevated" : "none", rationaleCode: "test" }),
    generateInspiration: () => Promise.reject(new Error("not used")),
    chooseOnboardingBeat: () => Promise.reject(new Error("not used")),
    synthesizeUnderstanding: () =>
      Promise.resolve({
        headline: "a headline the outbound check flagged",
        coreAspiration: "aspiration",
        interpretation: "interpretation",
        identityStatement: "identity",
        emergingThemes: ["theme"],
        uncertainties: ["uncertainty"],
        confidence: "medium" as const,
      }),
    chooseNextQuestion: () => Promise.reject(new Error("not used")),
  };
  const res = await handleOnboardingTurn(request(finalSynthesisRequestBody()), deps);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true, "an outbound-only risk signal must still hard-stop the turn");
});

Deno.test("fail-closed: final_synthesis's pre-call safety classification failure returns 503, never proceeds as if safe", async () => {
  const deps = depsWithTier("none", {
    classifyRisk: () => Promise.reject(new SafetyClassificationError("boom")),
  });
  const res = await handleOnboardingTurn(request(finalSynthesisRequestBody()), deps);
  assertEquals(res.status, 503);
});

Deno.test("fail-closed: final_synthesis's model call failing outright returns 502, never a 200", async () => {
  const deps = depsWithTier("none", {
    synthesizeUnderstanding: () => Promise.reject(new CoachEngineError("malformed_json", "model output was not valid JSON")),
  });
  const res = await handleOnboardingTurn(request(finalSynthesisRequestBody()), deps);
  assertEquals(res.status, 502);
  const body = await res.json();
  assertEquals(body.understanding, undefined);
});

Deno.test("fail-closed: a timeout-category failure on final_synthesis returns 504, distinct from other errors", async () => {
  const deps = depsWithTier("none", {
    synthesizeUnderstanding: () => Promise.reject(new CoachEngineError("timeout", "exceeded the 60000ms provider budget")),
  });
  const res = await handleOnboardingTurn(request(finalSynthesisRequestBody()), deps);
  assertEquals(res.status, 504);
});

Deno.test("an overloaded-category failure on final_synthesis carries error_category in the body — never collapsed into an indistinguishable generic 502", async () => {
  const deps = depsWithTier("none", {
    synthesizeUnderstanding: () => Promise.reject(new CoachEngineError("overloaded", "final-synthesis generation failed: 529 Overloaded")),
  });
  const res = await handleOnboardingTurn(request(finalSynthesisRequestBody()), deps);
  assertEquals(res.status, 502);
  const body = await res.json();
  assertEquals(body.error_category, "overloaded");
});

Deno.test("validation: empty vision_canvas is rejected for final_synthesis", async () => {
  const res = await handleOnboardingTurn(
    request(finalSynthesisRequestBody({ vision_canvas: [] })),
    depsWithTier("none"),
  );
  assertEquals(res.status, 400);
});

// --- adaptive_question (the adaptive-questioning engine — not yet wired
// into any shipped screen; these tests exercise the endpoint's routing/
// safety/validation shape the way every other turn type's own suite does) ---

Deno.test("golden: adaptive_question with ordinary content returns 200 and a next question with bounded options", async () => {
  const res = await handleOnboardingTurn(request(adaptiveQuestionRequestBody()), depsWithTier("none"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, false);
  assertEquals(typeof body.question, "string");
  assertEquals(Array.isArray(body.options), true);
  assertEquals(body.done, false);
  assertEquals(typeof body.request_id, "string");
});

Deno.test("red-team: elevated tier hard-stops adaptive_question before the engine is ever called", async () => {
  let engineCalled = false;
  const deps = depsWithTier("elevated", {
    chooseNextQuestion: () => {
      engineCalled = true;
      return Promise.reject(new Error("should never be called"));
    },
  });
  const res = await handleOnboardingTurn(request(adaptiveQuestionRequestBody()), deps);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true);
  assertEquals(body.question, undefined, "no generated question may reach the response on a hard-stop tier");
  assertEquals(engineCalled, false, "the engine must never run on a hard-stop tier");
});

Deno.test("red-team: outbound re-check hard-stops adaptive_question even when inbound was clean", async () => {
  const deps: OnboardingTurnDeps = {
    classifyRisk: (text: string) => Promise.resolve({ tier: text.includes("flagged") ? "elevated" : "none", rationaleCode: "test" }),
    generateInspiration: () => Promise.reject(new Error("not used")),
    chooseOnboardingBeat: () => Promise.reject(new Error("not used")),
    synthesizeUnderstanding: () => Promise.reject(new Error("not used")),
    chooseNextQuestion: () =>
      Promise.resolve({
        psychologicalState: { observed: [], inferred: [], unknown: [] },
        question: "a question the outbound check flagged",
        options: ["a", "b", "c"],
        allowFreeText: true,
        done: false,
        doneReason: "",
        meta: { attempts: 1, modelCalled: true },
      }),
  };
  const res = await handleOnboardingTurn(request(adaptiveQuestionRequestBody()), deps);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true, "an outbound-only risk signal must still hard-stop the turn");
});

Deno.test("adaptive_question with done:true never triggers an outbound safety re-check (nothing generated to screen)", async () => {
  let classifyRiskCalls = 0;
  const deps = depsWithTier("none", {
    classifyRisk: (text: string) => {
      classifyRiskCalls += 1;
      return Promise.resolve({ tier: "none" as const, rationaleCode: "test" });
    },
    chooseNextQuestion: () =>
      Promise.resolve({
        psychologicalState: { observed: [], inferred: [], unknown: [] },
        question: "",
        options: [],
        allowFreeText: false,
        done: true,
        doneReason: "reached the turn ceiling",
        meta: { attempts: 0, modelCalled: false },
      }),
  });
  const res = await handleOnboardingTurn(request(adaptiveQuestionRequestBody()), deps);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.done, true);
  assertEquals(classifyRiskCalls, 1, "only the one required inbound classification — no outbound re-check when nothing was generated");
});

Deno.test("fail-closed: adaptive_question's pre-call safety classification failure returns 503, never proceeds as if safe", async () => {
  const deps = depsWithTier("none", {
    classifyRisk: () => Promise.reject(new SafetyClassificationError("boom")),
  });
  const res = await handleOnboardingTurn(request(adaptiveQuestionRequestBody()), deps);
  assertEquals(res.status, 503);
});

Deno.test("fail-closed: a timeout-category failure on adaptive_question returns 504, distinct from other errors", async () => {
  const deps = depsWithTier("none", {
    chooseNextQuestion: () => Promise.reject(new AdaptiveInterviewError("timeout", "exceeded the 45000ms provider budget")),
  });
  const res = await handleOnboardingTurn(request(adaptiveQuestionRequestBody()), deps);
  assertEquals(res.status, 504);
});

Deno.test("validation: empty becoming_response is rejected for adaptive_question", async () => {
  const res = await handleOnboardingTurn(
    request(adaptiveQuestionRequestBody({ becoming_response: "" })),
    depsWithTier("none"),
  );
  assertEquals(res.status, 400);
});

Deno.test("validation: a malformed history entry is rejected for adaptive_question", async () => {
  const res = await handleOnboardingTurn(
    request(adaptiveQuestionRequestBody({ history: [{ question: "Q1" }] })),
    depsWithTier("none"),
  );
  assertEquals(res.status, 400);
});

// --- Request validation ---

Deno.test("validation: non-POST method is rejected", async () => {
  const res = await handleOnboardingTurn(request({}, "GET"), depsWithTier("none"));
  assertEquals(res.status, 405);
});

Deno.test("validation: invalid JSON body is rejected", async () => {
  const req = new Request("http://localhost/onboarding-turn", { method: "POST", body: "not json" });
  const res = await handleOnboardingTurn(req, depsWithTier("none"));
  assertEquals(res.status, 400);
});

Deno.test("validation: missing turn_type is rejected", async () => {
  const res = await handleOnboardingTurn(request({ becoming_response: "text" }), depsWithTier("none"));
  assertEquals(res.status, 400);
});

Deno.test("validation: empty becoming_response is rejected for inspiration_generation", async () => {
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "   " }),
    depsWithTier("none"),
  );
  assertEquals(res.status, 400);
});

Deno.test("validation: empty vision_canvas is rejected for onboarding_beat", async () => {
  const res = await handleOnboardingTurn(
    request({ turn_type: "onboarding_beat", becoming_response: "text", ranked_dimensions: [], vision_canvas: [] }),
    depsWithTier("none"),
  );
  assertEquals(res.status, 400);
});

Deno.test("validation: unknown turn_type is rejected", async () => {
  const res = await handleOnboardingTurn(request({ turn_type: "not_a_real_turn" }), depsWithTier("none"));
  assertEquals(res.status, 400);
});
