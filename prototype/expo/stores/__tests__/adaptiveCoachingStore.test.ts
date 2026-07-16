import { act } from "@testing-library/react-native";
import { MAX_VISION_FRAGMENTS, useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

describe("useAdaptiveCoachingStore", () => {
  beforeEach(() => {
    act(() => {
      useAdaptiveCoachingStore.getState().resetJourney("everything");
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
          thoughts: [{ id: "t1", dimension: "Health & Energy", text: "Someone who feels stronger", source: "ai" }],
        },
        { lastSafetyTier: "none", lastLatencyMs: 800, lastRawPayload: {}, lastRequestId: "req-1" }
      );
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.phase).toEqual({ status: "inspiration-vision" });
    expect(state.rankedDimensions).toHaveLength(1);
    expect(state.thoughtPool).toHaveLength(1);
  });

  it("moreThoughtsReceived replaces the pool without changing phase ('reviewing' stays 'reviewing')", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().inspirationReceived(
        {
          rankedDimensions: [{ dimension: "Health & Energy", relevance: 0.9 }],
          thoughts: [{ id: "t1", dimension: "Health & Energy", text: "original thought", source: "ai" }],
        },
        { lastSafetyTier: "none", lastLatencyMs: 800, lastRawPayload: {}, lastRequestId: "req-1" }
      );
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "picked one", origin: "thought_tap", edited: false, source: "ai" });
    });
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "reviewing" });

    act(() => {
      useAdaptiveCoachingStore.getState().moreThoughtsReceived({
        rankedDimensions: [{ dimension: "Relationships", relevance: 0.7 }],
        thoughts: [{ id: "t2", dimension: "Relationships", text: "a fresh thought", source: "ai" }],
      });
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.phase).toEqual({ status: "reviewing" });
    expect(state.thoughtPool).toEqual([{ id: "t2", dimension: "Relationships", text: "a fresh thought", source: "ai" }]);
    expect(state.visionCanvas).toHaveLength(1);
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
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "Someone who follows through", origin: "thought_tap", edited: false, source: "user" });
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.visionCanvas).toHaveLength(1);
    expect(state.visionCanvas[0].text).toBe("Someone who follows through");
    expect(state.phase).toEqual({ status: "reviewing" });
  });

  it("never exceeds MAX_VISION_FRAGMENTS", () => {
    act(() => {
      for (let i = 0; i < MAX_VISION_FRAGMENTS + 3; i++) {
        useAdaptiveCoachingStore.getState().addVisionFragment({ text: `fragment ${i}`, origin: "typed", edited: false, source: "user" });
      }
    });
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(MAX_VISION_FRAGMENTS);
  });

  it("editVisionFragment updates text and marks edited", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "original", origin: "thought_tap", edited: false, source: "user" });
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
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "keep", origin: "typed", edited: false, source: "user" });
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "remove", origin: "typed", edited: false, source: "user" });
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
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "a", origin: "typed", edited: false, source: "user" });
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "b", origin: "typed", edited: false, source: "user" });
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "c", origin: "typed", edited: false, source: "user" });
    });
    act(() => {
      useAdaptiveCoachingStore.getState().reorderVisionFragments(2, 0);
    });
    expect(useAdaptiveCoachingStore.getState().visionCanvas.map((f) => f.text)).toEqual(["c", "a", "b"]);
  });

  it("reorderVisionFragments is a no-op for an out-of-bounds index", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "a", origin: "typed", edited: false, source: "user" });
    });
    act(() => {
      useAdaptiveCoachingStore.getState().reorderVisionFragments(0, 5);
    });
    expect(useAdaptiveCoachingStore.getState().visionCanvas.map((f) => f.text)).toEqual(["a"]);
  });

  it("beginUnderstandingReview stores the dismissed thoughts and advances to understanding-review", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().beginUnderstandingReview([{ text: "a thought they skipped", source: "ai" }]);
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.phase).toEqual({ status: "understanding-review" });
    expect(state.dismissedThoughts).toEqual([{ text: "a thought they skipped", source: "ai" }]);
  });

  it("understandingReviewReceived stores the structured review without changing phase", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().beginUnderstandingReview([]);
      useAdaptiveCoachingStore.getState().understandingReviewReceived({
        headline: "Excellence on your own terms",
        coreAspiration: "You want to become exceptional without letting comparison define you.",
        interpretation: "interpretation",
        identityStatement: "identity",
        emergingThemes: ["theme"],
        uncertainties: ["uncertainty"],
        confidence: "medium",
      });
    });
    const state = useAdaptiveCoachingStore.getState();
    expect(state.phase).toEqual({ status: "understanding-review" });
    expect(state.understandingReview?.headline).toBe("Excellence on your own terms");
  });

  it("understandingReviewHardStopped routes to safety-hand-off", () => {
    act(() => {
      useAdaptiveCoachingStore.getState().understandingReviewHardStopped("please reach out");
    });
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "safety-hand-off", message: "please reach out" });
  });

  describe("resetJourney", () => {
    function populateJourney() {
      useAdaptiveCoachingStore.getState().setFirstName("Maya");
      useAdaptiveCoachingStore.getState().beginMomentOne();
      useAdaptiveCoachingStore.getState().submitBecomingResponse("I want to follow through");
      useAdaptiveCoachingStore.getState().inspirationReceived(
        {
          rankedDimensions: [{ dimension: "Health & Energy", relevance: 0.9 }],
          thoughts: [{ id: "t1", dimension: "Health & Energy", text: "Someone who feels stronger", source: "ai" }],
        },
        { lastSafetyTier: "none", lastLatencyMs: 800, lastRawPayload: {}, lastRequestId: "req-1" }
      );
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: "Someone who follows through", origin: "thought_tap", edited: false, source: "ai" });
      useAdaptiveCoachingStore.getState().beginUnderstandingReview([{ text: "dismissed one", source: "ai" }]);
      useAdaptiveCoachingStore.getState().understandingReviewReceived({
        headline: "headline",
        coreAspiration: "aspiration",
        interpretation: "interpretation",
        identityStatement: "identity",
        emergingThemes: ["theme"],
        uncertainties: ["uncertainty"],
        confidence: "medium",
      });
    }

    it("'restart' preserves firstName, clears the reflection journey, and lands on moment-one", () => {
      act(populateJourney);
      act(() => {
        useAdaptiveCoachingStore.getState().resetJourney("restart");
      });
      const state = useAdaptiveCoachingStore.getState();
      expect(state.firstName).toBe("Maya");
      expect(state.phase).toEqual({ status: "moment-one" });
      expect(state.becomingResponse).toBe("");
      expect(state.rankedDimensions).toHaveLength(0);
      expect(state.thoughtPool).toHaveLength(0);
      expect(state.visionCanvas).toHaveLength(0);
      expect(state.dismissedThoughts).toHaveLength(0);
      expect(state.understandingReview).toBeNull();
    });

    it("'everything' also clears firstName and lands on name", () => {
      act(populateJourney);
      act(() => {
        useAdaptiveCoachingStore.getState().resetJourney("everything");
      });
      const state = useAdaptiveCoachingStore.getState();
      expect(state.firstName).toBe("");
      expect(state.phase).toEqual({ status: "name" });
      expect(state.visionCanvas).toHaveLength(0);
      expect(state.understandingReview).toBeNull();
    });

    it("no old thoughts reappear after either reset scope", () => {
      act(populateJourney);
      act(() => {
        useAdaptiveCoachingStore.getState().resetJourney("restart");
      });
      expect(useAdaptiveCoachingStore.getState().thoughtPool).toHaveLength(0);
      expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(0);

      act(populateJourney);
      act(() => {
        useAdaptiveCoachingStore.getState().resetJourney("everything");
      });
      expect(useAdaptiveCoachingStore.getState().thoughtPool).toHaveLength(0);
      expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(0);
    });
  });
});
