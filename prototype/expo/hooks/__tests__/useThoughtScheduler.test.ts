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
