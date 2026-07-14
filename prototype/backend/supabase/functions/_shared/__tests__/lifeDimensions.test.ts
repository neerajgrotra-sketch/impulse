import { assertEquals } from "@std/assert";
import { isLifeDimension, LIFE_DIMENSIONS } from "../lifeDimensions.ts";

Deno.test("LIFE_DIMENSIONS has exactly 15 canonical entries, per decisions/0012", () => {
  assertEquals(LIFE_DIMENSIONS.length, 15);
});

Deno.test("LIFE_DIMENSIONS has no duplicates", () => {
  const unique = new Set(LIFE_DIMENSIONS);
  assertEquals(unique.size, LIFE_DIMENSIONS.length);
});

Deno.test("LIFE_DIMENSIONS includes Spirituality, unconditionally ranked like every other dimension", () => {
  assertEquals(LIFE_DIMENSIONS.includes("Spirituality"), true);
});

Deno.test("isLifeDimension correctly validates membership", () => {
  assertEquals(isLifeDimension("Health & Energy"), true);
  assertEquals(isLifeDimension("Not A Real Dimension"), false);
});
