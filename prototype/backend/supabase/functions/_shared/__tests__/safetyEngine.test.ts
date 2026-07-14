// The single highest-stakes test file in this slice (adr/0008 §9's bar):
// every tier must map to the correct action, and elevated/crisis must always
// hard-stop, with zero tolerance for a miss. classifyRisk's classifier is
// injected so this suite never needs a real network call or API key.
import { assertEquals, assertRejects } from "@std/assert";
import {
  classifyRisk,
  mapTierToAction,
  SafetyClassificationError,
  type SafetyTier,
} from "../safetyEngine.ts";

Deno.test("mapTierToAction — none proceeds, never hard-stops", () => {
  assertEquals(mapTierToAction("none"), { proceed: true, hardStop: false });
});

Deno.test("mapTierToAction — low proceeds, never hard-stops", () => {
  assertEquals(mapTierToAction("low"), { proceed: true, hardStop: false });
});

Deno.test("mapTierToAction — elevated ALWAYS hard-stops, never proceeds", () => {
  assertEquals(mapTierToAction("elevated"), { proceed: false, hardStop: true });
});

Deno.test("mapTierToAction — crisis ALWAYS hard-stops, never proceeds", () => {
  assertEquals(mapTierToAction("crisis"), { proceed: false, hardStop: true });
});

Deno.test("mapTierToAction — exhaustive over every declared tier, zero misses", () => {
  const tiers: SafetyTier[] = ["none", "low", "elevated", "crisis"];
  for (const tier of tiers) {
    const action = mapTierToAction(tier);
    const shouldHardStop = tier === "elevated" || tier === "crisis";
    assertEquals(action.hardStop, shouldHardStop, `tier "${tier}" hard-stop mismatch`);
    assertEquals(action.proceed, !shouldHardStop, `tier "${tier}" proceed mismatch`);
  }
});

Deno.test("classifyRisk — blank input short-circuits to none, no classifier call", async () => {
  let called = false;
  const result = await classifyRisk("   ", () => {
    called = true;
    return Promise.resolve({ tier: "crisis", rationale_code: "should never be reached" });
  });
  assertEquals(result.tier, "none");
  assertEquals(called, false);
});

Deno.test("classifyRisk — valid classification passes through", async () => {
  const result = await classifyRisk("I want to be more present with my family", () =>
    Promise.resolve({ tier: "none", rationale_code: "ordinary_reflection" }));
  assertEquals(result, { tier: "none", rationaleCode: "ordinary_reflection" });
});

Deno.test("classifyRisk — elevated classification passes through faithfully, not softened", async () => {
  const result = await classifyRisk("some concerning disclosure", () =>
    Promise.resolve({ tier: "elevated", rationale_code: "disclosure_of_abuse" }));
  assertEquals(result.tier, "elevated");
});

Deno.test("classifyRisk — malformed response FAILS CLOSED (throws, never defaults to none)", async () => {
  await assertRejects(
    () => classifyRisk("some text", () => Promise.resolve({ tier: "not_a_real_tier", rationale_code: "x" })),
    SafetyClassificationError,
  );
});

Deno.test("classifyRisk — missing tier field FAILS CLOSED", async () => {
  await assertRejects(
    () => classifyRisk("some text", () => Promise.resolve({ rationale_code: "x" })),
    SafetyClassificationError,
  );
});

Deno.test("classifyRisk — classifier throwing twice FAILS CLOSED after one retry, never assumes safe", async () => {
  let attempts = 0;
  await assertRejects(
    () =>
      classifyRisk("some text", () => {
        attempts++;
        return Promise.reject(new Error("transient network failure"));
      }),
    SafetyClassificationError,
  );
  assertEquals(attempts, 2, "must retry exactly once before failing closed");
});

Deno.test("classifyRisk — succeeds on retry after one transient failure", async () => {
  let attempts = 0;
  const result = await classifyRisk("some text", () => {
    attempts++;
    if (attempts === 1) return Promise.reject(new Error("transient"));
    return Promise.resolve({ tier: "low", rationale_code: "recovered_on_retry" });
  });
  assertEquals(result.tier, "low");
  assertEquals(attempts, 2);
});
