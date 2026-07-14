// Golden + red-team eval set (adr/0008 §9's pattern) for the one endpoint
// this whole slice depends on. Every dependency is injected — no network
// call, no real API key — so this suite tests the actual routing/safety
// logic this file owns, deterministically. This is explicitly named,
// per docs/experiments/AE-001-first-adaptive-coaching-loop.md, as a
// prerequisite for the experiment to run at all, even moderated.
import { assertEquals } from "@std/assert";
import { handleOnboardingTurn, type OnboardingTurnDeps } from "../index.ts";
import { SafetyClassificationError, type SafetyClassification, type SafetyTier } from "../../_shared/safetyEngine.ts";

function request(body: unknown, method = "POST"): Request {
  return new Request("http://localhost/onboarding-turn", {
    method,
    body: method === "POST" ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

function depsWithTier(tier: SafetyTier, overrides: Partial<OnboardingTurnDeps> = {}): OnboardingTurnDeps {
  return {
    classifyRisk: (): Promise<SafetyClassification> => Promise.resolve({ tier, rationaleCode: "test" }),
    rankDimensionsAndGenerateThoughts: () =>
      Promise.resolve({
        rankedDimensions: [{ dimension: "Health & Energy", relevance: 0.9 }],
        thoughts: [{ id: "t1", dimension: "Health & Energy", text: "Someone who feels stronger every day" }],
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
    ...overrides,
  };
}

// --- Golden cases: known-safe input proceeds normally ---

Deno.test("golden: inspiration_generation with ordinary content returns 200 and ranked dimensions", async () => {
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", first_name: "Maya", becoming_response: "I want to be more present with my family" }),
    depsWithTier("none"),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, false);
  assertEquals(Array.isArray(body.ranked_dimensions), true);
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

Deno.test("red-team: elevated tier hard-stops inspiration_generation, Identity Engine never called", async () => {
  let identityEngineCalled = false;
  const deps = depsWithTier("elevated", {
    rankDimensionsAndGenerateThoughts: () => {
      identityEngineCalled = true;
      return Promise.reject(new Error("should never be called"));
    },
  });
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "some concerning disclosure" }),
    deps,
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.safety.hard_stop, true);
  assertEquals(body.safety.tier, "elevated");
  assertEquals(identityEngineCalled, false, "Identity Engine must never run on a hard-stop tier");
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
    rankDimensionsAndGenerateThoughts: () => Promise.reject(new Error("not used")),
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

// --- Fail-closed on safety classification failure ---

Deno.test("fail-closed: safety classification failure returns 503, never proceeds as if safe", async () => {
  const deps = depsWithTier("none", {
    classifyRisk: () => Promise.reject(new SafetyClassificationError("boom")),
  });
  const res = await handleOnboardingTurn(
    request({ turn_type: "inspiration_generation", becoming_response: "text" }),
    deps,
  );
  assertEquals(res.status, 503);
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
