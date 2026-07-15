import { assertEquals, assertMatch } from "@std/assert";
import { LIFE_DIMENSIONS } from "../lifeDimensions.ts";
import { findCompletenessViolation, MIN_THOUGHTS } from "../identityEngine.ts";

function fullRankedDimensions() {
  return LIFE_DIMENSIONS.map((dimension) => ({ dimension }));
}

function thoughts(count: number) {
  return Array.from({ length: count }, (_, i) => ({ text: `thought ${i}` }));
}

Deno.test("findCompletenessViolation passes a full response", () => {
  const violation = findCompletenessViolation({
    ranked_dimensions: fullRankedDimensions(),
    thoughts: thoughts(MIN_THOUGHTS),
  });
  assertEquals(violation, null);
});

Deno.test("findCompletenessViolation catches an under-ranked response — the real device case (2 of 15 dimensions, 0 thoughts)", () => {
  const violation = findCompletenessViolation({
    ranked_dimensions: [{ dimension: "Personal Growth" }, { dimension: "Confidence & Self-Worth" }],
    thoughts: [],
  });
  assertMatch(violation ?? "", /only ranked 2 of the 15 required Life Dimensions/);
});

Deno.test("findCompletenessViolation catches full dimensions but too few thoughts", () => {
  const violation = findCompletenessViolation({
    ranked_dimensions: fullRankedDimensions(),
    thoughts: thoughts(MIN_THOUGHTS - 1),
  });
  assertMatch(violation ?? "", new RegExp(`only generated ${MIN_THOUGHTS - 1} thoughts`));
});

Deno.test("findCompletenessViolation treats duplicate dimension entries as not covering the taxonomy", () => {
  const violation = findCompletenessViolation({
    ranked_dimensions: Array.from({ length: LIFE_DIMENSIONS.length }, () => ({ dimension: "Personal Growth" })),
    thoughts: thoughts(MIN_THOUGHTS),
  });
  assertMatch(violation ?? "", /only ranked 1 of the 15 required Life Dimensions/);
});
