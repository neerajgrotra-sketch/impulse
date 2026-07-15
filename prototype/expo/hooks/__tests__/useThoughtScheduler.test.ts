import { act, renderHook } from "@testing-library/react-native";
import { thoughtLibrary } from "@/constants/thoughtLibrary";
import {
  THOUGHT_ENTER_DURATION_MS,
  THOUGHT_EXIT_DURATION_MS,
  THOUGHT_INITIAL_DELAY_MS,
  THOUGHT_MAX_PAUSE_MS,
  THOUGHT_MAX_VISIBLE_MS,
  THOUGHT_MIN_PAUSE_MS,
  THOUGHT_MIN_VISIBLE_MS,
  useThoughtScheduler,
} from "@/hooks/useThoughtScheduler";

const RANDOM_VALUE = 0.5;
const VISIBLE_MS = THOUGHT_MIN_VISIBLE_MS + RANDOM_VALUE * (THOUGHT_MAX_VISIBLE_MS - THOUGHT_MIN_VISIBLE_MS);
const PAUSE_MS = THOUGHT_MIN_PAUSE_MS + RANDOM_VALUE * (THOUGHT_MAX_PAUSE_MS - THOUGHT_MIN_PAUSE_MS);
const FULL_CYCLE_MS = THOUGHT_ENTER_DURATION_MS + VISIBLE_MS + THOUGHT_EXIT_DURATION_MS + PAUSE_MS;

describe("useThoughtScheduler", () => {
  let randomSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.useFakeTimers();
    // Deterministic durations make the timer chain exactly predictable.
    randomSpy = jest.spyOn(Math, "random").mockReturnValue(RANDOM_VALUE);
  });

  afterEach(() => {
    randomSpy.mockRestore();
    jest.clearAllTimers();
  });

  it("shows nothing until the initial delay elapses", async () => {
    const { result } = await renderHook(() => useThoughtScheduler({ paused: false }));

    expect(result.current.thought).toBeNull();
    expect(result.current.phase).toBe("idle");

    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS - 1);
    });
    expect(result.current.thought).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.thought).not.toBeNull();
    expect(result.current.phase).toBe("entering");
  });

  it("never shows the same thought twice within one session", async () => {
    const { result } = await renderHook(() => useThoughtScheduler({ paused: false }));

    const seen = new Set<string>();

    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS);
    });

    for (let i = 0; i < thoughtLibrary.length; i += 1) {
      const thought = result.current.thought;
      expect(thought).not.toBeNull();
      expect(seen.has(thought!.id)).toBe(false);
      seen.add(thought!.id);

      await act(async () => {
        jest.advanceTimersByTime(FULL_CYCLE_MS);
      });
    }

    expect(seen.size).toBe(thoughtLibrary.length);
  });

  it("pauses while recording/editing and does not advance", async () => {
    const { result, rerender } = await renderHook(
      (props: { paused: boolean }) => useThoughtScheduler(props),
      { initialProps: { paused: true } }
    );

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.thought).toBeNull();
    expect(result.current.phase).toBe("idle");

    await rerender({ paused: false });
    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS);
    });
    const activeThought = result.current.thought;
    expect(activeThought).not.toBeNull();

    // Simulate the user starting to record/edit mid-cycle.
    await rerender({ paused: true });
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.phase).toBe("idle");
  });

  it("clears its pending timer on unmount", async () => {
    const clearSpy = jest.spyOn(globalThis, "clearTimeout");
    const { unmount } = await renderHook(() => useThoughtScheduler({ paused: false }));

    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS);
    });

    await unmount();
    expect(clearSpy).toHaveBeenCalled();

    const callsBeforeAdvance = clearSpy.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    // No new timers should have fired/rescheduled after unmount.
    expect(clearSpy.mock.calls.length).toBe(callsBeforeAdvance);

    clearSpy.mockRestore();
  });

  it("holds the first thought under Reduce Motion instead of auto-rotating", async () => {
    const { result } = await renderHook(() =>
      useThoughtScheduler({ paused: false, reduceMotion: true })
    );

    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS + THOUGHT_ENTER_DURATION_MS);
    });
    const firstThought = result.current.thought;
    expect(firstThought).not.toBeNull();
    expect(result.current.phase).toBe("visible");

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(result.current.thought).toBe(firstThought);
    expect(result.current.phase).toBe("visible");
  });

  it("draws from a newly-swapped thoughtSource immediately, not after the old queue drains", async () => {
    // Regression test for a real device bug: AE-001's Vision Canvas screen
    // starts with the curated default source, then swaps to a personalized
    // AI-generated source once the backend responds. Because the queue is a
    // ref that only refills when empty, the swap alone didn't take effect —
    // leftover curated thoughts kept surfacing (unrelated to what the user
    // typed) until that whole pre-shuffled queue happened to drain.
    const curatedSource = () => [
      { id: "curated-1", text: "curated one", theme: "Personal Growth" as const },
      { id: "curated-2", text: "curated two", theme: "Personal Growth" as const },
    ];
    const personalizedSource = () => [
      { id: "personal-1", text: "about your actual answer", theme: "Health & Energy" as const },
    ];

    const { result, rerender } = await renderHook(
      (props: { thoughtSource: () => ReturnType<typeof curatedSource> }) =>
        useThoughtScheduler({ paused: false, thoughtSource: props.thoughtSource }),
      { initialProps: { thoughtSource: curatedSource } }
    );

    // First thought comes from the curated source, as expected.
    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS);
    });
    expect(result.current.thought?.id.startsWith("curated-")).toBe(true);

    // Swap sources mid-session (the queue still has one curated item left
    // unpopped) — the very next draw should come from the new source, not
    // from the stale curated leftover.
    await rerender({ thoughtSource: personalizedSource });
    await act(async () => {
      jest.advanceTimersByTime(FULL_CYCLE_MS);
    });

    expect(result.current.thought?.id).toBe("personal-1");
  });

  it("holds the first thought for an active screen reader, independent of Reduce Motion", async () => {
    const { result } = await renderHook(() =>
      useThoughtScheduler({ paused: false, reduceMotion: false, screenReaderEnabled: true })
    );

    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS + THOUGHT_ENTER_DURATION_MS);
    });
    const firstThought = result.current.thought;
    expect(firstThought).not.toBeNull();
    expect(result.current.phase).toBe("visible");

    // A screen reader alone (Reduce Motion off) still suspends rotation —
    // this is a distinct accessibility need, not a Reduce Motion side effect.
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(result.current.thought).toBe(firstThought);
    expect(result.current.phase).toBe("visible");
  });
});
