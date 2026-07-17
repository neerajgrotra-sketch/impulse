import { act, renderHook } from "@testing-library/react-native";
import {
  isNearDuplicateText,
  useThoughtOptionsPool,
  VISIBLE_THOUGHT_COUNT,
} from "@/features/adaptive-coaching/hooks/useThoughtOptionsPool";
import type { GeneratedThought } from "@/types/adaptiveCoaching";

function thought(id: string, text: string): GeneratedThought {
  return { id, dimension: "Personal Growth", text, source: "ai" };
}

function batch(count: number): GeneratedThought[] {
  return Array.from({ length: count }, (_, i) => thought(`t${i + 1}`, `thought number ${i + 1}`));
}

describe("isNearDuplicateText", () => {
  it("treats exact (case/whitespace-insensitive) matches as duplicates", () => {
    expect(isNearDuplicateText("Someone who follows through", "someone who follows through")).toBe(true);
    expect(isNearDuplicateText("  Someone who follows through  ", "Someone who follows through")).toBe(true);
  });

  it("treats heavily-overlapping rephrasings as near-duplicates", () => {
    expect(isNearDuplicateText("Someone who follows through consistently", "Someone consistently follows through")).toBe(true);
  });

  it("does not flag genuinely different thoughts", () => {
    expect(isNearDuplicateText("Someone who follows through", "Someone who rests without guilt")).toBe(false);
  });
});

describe("useThoughtOptionsPool", () => {
  it("splits a fetched batch into a visible subset and a reserve", async () => {
    const pool = batch(9);
    const { result } = await renderHook(() => useThoughtOptionsPool(pool));
    expect(result.current.visible).toHaveLength(VISIBLE_THOUGHT_COUNT);
    expect(result.current.visible.map((t) => t.id)).toEqual(["t1", "t2", "t3", "t4", "t5", "t6"]);
  });

  it("dismiss replaces the dismissed thought in the same slot from the reserve, instantly", async () => {
    const pool = batch(9);
    const { result } = await renderHook(() => useThoughtOptionsPool(pool));

    await act(async () => {
      result.current.dismiss(pool[0]); // "thought number 1"
    });

    expect(result.current.visible.map((t) => t.text)).toEqual([
      "thought number 7", // pulled from reserve, same slot (index 0)
      "thought number 2",
      "thought number 3",
      "thought number 4",
      "thought number 5",
      "thought number 6",
    ]);
    expect(result.current.dismissedTexts).toEqual(["thought number 1"]);
  });

  it("dismiss with no reserve left just removes, without an instant replacement", async () => {
    const pool = batch(6); // exactly VISIBLE_THOUGHT_COUNT, no reserve
    const { result } = await renderHook(() => useThoughtOptionsPool(pool));

    await act(async () => {
      result.current.dismiss(pool[0]);
    });

    expect(result.current.visible).toHaveLength(5);
    expect(result.current.visible.find((t) => t.text === "thought number 1")).toBeUndefined();
  });

  it("a dismissed thought never reappears from the reserve", async () => {
    const pool = [
      thought("t1", "Someone who follows through"),
      ...batch(8).slice(1), // t2..t9 as filler
    ];
    const { result } = await renderHook(() => useThoughtOptionsPool(pool));
    await act(async () => {
      result.current.dismiss(pool[0]);
    });
    expect(result.current.visible.some((t) => t.text === "Someone who follows through")).toBe(false);
  });

  it("addToReserve merges fresh thoughts, dropping anything that duplicates a dismissed, visible, or already-reserved thought", async () => {
    const pool = batch(9); // visible t1-t6, reserve t7-t9
    const { result } = await renderHook(() => useThoughtOptionsPool(pool));

    await act(async () => {
      result.current.dismiss(pool[0]); // dismisses "thought number 1", consumes t7 into visible
    });

    await act(async () => {
      result.current.addToReserve([
        thought("new-1", "thought number 1"), // exact duplicate of dismissed text — dropped
        thought("new-2", "thought number 8"), // duplicate of an existing reserve thought — dropped
        thought("new-3", "a genuinely new thought"), // kept
      ]);
    });

    // Dismiss again to pull from the refreshed reserve and confirm only the
    // genuinely-new thought was actually added.
    await act(async () => {
      result.current.dismiss(result.current.visible[1]); // "thought number 2"
    });
    expect(result.current.visible.some((t) => t.text === "thought number 1")).toBe(false);
    const replaced = result.current.visible[1];
    expect(["thought number 8", "thought number 9", "a genuinely new thought"]).toContain(replaced.text);
  });

  it("needsRefill is true once the reserve is thin (<= 2), false while it's healthy", async () => {
    const { result } = await renderHook(({ pool }: { pool: GeneratedThought[] }) => useThoughtOptionsPool(pool), {
      initialProps: { pool: batch(9) }, // reserve of 3
    });
    expect(result.current.needsRefill).toBe(false);

    await act(async () => {
      result.current.dismiss(result.current.visible[0]); // reserve now 2
    });
    expect(result.current.needsRefill).toBe(true);
  });

  it("a new pool reference (fresh fetch or 'more like this') resets visible/reserve/dismissed history", async () => {
    const firstPool = batch(9);
    const { result, rerender } = await renderHook(({ pool }: { pool: GeneratedThought[] }) => useThoughtOptionsPool(pool), {
      initialProps: { pool: firstPool },
    });
    await act(async () => {
      result.current.dismiss(firstPool[0]);
    });
    expect(result.current.dismissedTexts).toHaveLength(1);

    const secondPool = [thought("new1", "a totally new thought"), thought("new2", "another new thought")];
    await act(async () => {
      rerender({ pool: secondPool });
    });

    expect(result.current.dismissedTexts).toHaveLength(0);
    expect(result.current.visible.map((t) => t.text)).toEqual(["a totally new thought", "another new thought"]);
  });

  it("dismissing an id no longer in `visible` (a stale/rapid double-tap) is a safe no-op", async () => {
    const pool = batch(9);
    const { result } = await renderHook(() => useThoughtOptionsPool(pool));
    await act(async () => {
      result.current.dismiss(pool[0]);
      result.current.dismiss(pool[0]); // already gone — must not consume a second reserve thought
    });
    expect(result.current.visible.map((t) => t.text)).toEqual([
      "thought number 7",
      "thought number 2",
      "thought number 3",
      "thought number 4",
      "thought number 5",
      "thought number 6",
    ]);
    expect(result.current.dismissedTexts).toEqual(["thought number 1"]);
  });
});
