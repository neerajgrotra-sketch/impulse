import { act } from "@testing-library/react-native";
import { MAX_VISION_FRAGMENTS, useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

describe("useAdaptiveCoachingStore", () => {
  beforeEach(() => {
    act(() => {
      useAdaptiveCoachingStore.getState().reset();
    });
  });

  it("starts on the name phase", () => {
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "name" });
  });

  it("advances name -> moment-one -> generating-inspiration in order", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().setFirstName("  Maya  ");
      useAdaptiveCoachingStore.getState().beginMomentOne();
    });
    expect(useAdaptiveCoachingStore.getState().firstName).toBe("Maya");
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "moment-one" });

    act(() => {
      useAdaptiveCoachingStore.getState().submitBecomingResponse("  I want to follow through  ");
    });
    expect(useAdaptiveCoachingStore.getState().becomingResponse).toBe("I want to follow through");
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "generating-inspiration" });
  });

  it("inspirationReceived stores the ranked dimensions/thoughts and advances to inspiration-vision", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().inspirationReceived(
        {
          rankedDimensions: [{ dimension: "Health & Energy", relevance: 0.9 }],
          thoughts: [{ id: "t1", dimension: "Health & Energy", text: "Someone who feels stronger" }],
        },
        { lastSafetyTier: "none", lastLatencyMs: 800, lastRawPayload: {} }
      );
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.phase).toEqual({ status: "inspiration-vision" });
    expect(state.rankedDimensions).toHaveLength(1);
    expect(state.thoughtPool).toHaveLength(1);
  });

  it("inspirationHardStopped routes to safety-hand-off with the given message", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().inspirationHardStopped("please reach out to someone");
    });
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({
      status: "safety-hand-off",
      message: "please reach out to someone",
    });
  });

  it("addVisionFragment appends a fragment and moves to reviewing", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "Someone who follows through", origin: "thought_tap", edited: false });
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.visionCanvas).toHaveLength(1);
    expect(state.visionCanvas[0].text).toBe("Someone who follows through");
    expect(state.phase).toEqual({ status: "reviewing" });
  });

  it("never exceeds MAX_VISION_FRAGMENTS", () => {
    act(() => {
      for (let i = 0; i < MAX_VISION_FRAGMENTS + 3; i++) {
        useAdaptiveCoachingStore.getState().addVisionFragment({ text: `fragment ${i}`, origin: "typed", edited: false });
      }
    });
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(MAX_VISION_FRAGMENTS);
  });

  it("editVisionFragment updates text and marks edited", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "original", origin: "thought_tap", edited: false });
    });
    const id = useAdaptiveCoachingStore.getState().visionCanvas[0].id;
    act(() => {
      useAdaptiveCoachingStore.getState().editVisionFragment(id, "edited text");
    });
    const fragment = useAdaptiveCoachingStore.getState().visionCanvas[0];
    expect(fragment.text).toBe("edited text");
    expect(fragment.edited).toBe(true);
  });

  it("removeVisionFragment removes exactly the targeted fragment", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "keep", origin: "typed", edited: false });
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "remove", origin: "typed", edited: false });
    });
    const [, toRemove] = useAdaptiveCoachingStore.getState().visionCanvas;
    act(() => {
      useAdaptiveCoachingStore.getState().removeVisionFragment(toRemove.id);
    });
    const remaining = useAdaptiveCoachingStore.getState().visionCanvas;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].text).toBe("keep");
  });

  it("reorderVisionFragments moves a fragment to the target index", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "a", origin: "typed", edited: false });
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "b", origin: "typed", edited: false });
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "c", origin: "typed", edited: false });
    });
    act(() => {
      useAdaptiveCoachingStore.getState().reorderVisionFragments(2, 0);
    });
    expect(useAdaptiveCoachingStore.getState().visionCanvas.map((f) => f.text)).toEqual(["c", "a", "b"]);
  });

  it("reorderVisionFragments is a no-op for an out-of-bounds index", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "a", origin: "typed", edited: false });
    });
    act(() => {
      useAdaptiveCoachingStore.getState().reorderVisionFragments(0, 5);
    });
    expect(useAdaptiveCoachingStore.getState().visionCanvas.map((f) => f.text)).toEqual(["a"]);
  });

  it("beginSubmittingForBeat sets isSubmitting true; beatReceived clears it and advances to coaching-beat", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().beginSubmittingForBeat();
    });
    expect(useAdaptiveCoachingStore.getState().isSubmitting).toBe(true);

    act(() => {
      useAdaptiveCoachingStore.getState().beatReceived(
        {
          beat: "Clarification",
          move: "Question",
          message: "What does that look like day to day?",
          psychologicalState: { observed: [], inferred: [], unknown: [] },
        },
        { lastSafetyTier: "none", lastLatencyMs: 900, lastRawPayload: {} }
      );
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.isSubmitting).toBe(false);
    expect(state.phase).toEqual({
      status: "coaching-beat",
      beat: "Clarification",
      move: "Question",
      message: "What does that look like day to day?",
    });
  });

  it("beatHardStopped and beatFailed both clear isSubmitting", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().beginSubmittingForBeat();
      useAdaptiveCoachingStore.getState().beatHardStopped("please reach out");
    });
    expect(useAdaptiveCoachingStore.getState().isSubmitting).toBe(false);
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "safety-hand-off", message: "please reach out" });
  });

  it("reset returns to the initial state", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().setFirstName("Maya");
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "x", origin: "typed", edited: false });
      useAdaptiveCoachingStore.getState().reset();
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.phase).toEqual({ status: "name" });
    expect(state.firstName).toBe("");
    expect(state.visionCanvas).toHaveLength(0);
  });
});
