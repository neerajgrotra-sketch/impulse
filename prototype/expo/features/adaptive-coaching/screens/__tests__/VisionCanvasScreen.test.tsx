import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { VisionCanvasScreen } from "@/features/adaptive-coaching/screens/VisionCanvasScreen";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";

// This screen calls the backend service via direct import rather than
// dependency injection (unlike voiceCapture/questionVoice elsewhere in this
// codebase) — module mocking is the narrow, deliberate exception here rather
// than reworking the screen's design just for testability. Only the network
// calls are mocked — `isHardStopResponse` is a real, pure discriminant
// function the screen relies on for correct routing, and a blind
// `jest.mock()` would auto-stub it to always return `undefined`, silently
// breaking hard-stop routing in this test rather than testing it.
jest.mock("@/services/onboardingTurnApi", () => ({
  ...jest.requireActual("@/services/onboardingTurnApi"),
  requestInspiration: jest.fn(),
}));
import { requestInspiration } from "@/services/onboardingTurnApi";

const mockRequestInspiration = requestInspiration as jest.MockedFunction<typeof requestInspiration>;

function buildVoiceCapture(): VoiceCapture {
  return {
    isAvailable: false,
    isRecording: false,
    transcript: "",
    requestPermission: jest.fn().mockResolvedValue(false),
    start: jest.fn(),
    stop: jest.fn(),
  };
}

async function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <VisionCanvasScreen voiceCapture={buildVoiceCapture()} />
    </SafeAreaProvider>
  );
}

describe("VisionCanvasScreen", () => {
  beforeEach(() => {
    // Not wrapped in `act()` — nothing is mounted yet, and doing so leaves
    // this project's async `render()` unable to pick up the store's
    // already-correct phase on the component's first render.
    useAdaptiveCoachingStore.getState().resetJourney("everything");
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    useAdaptiveCoachingStore.getState().beginMomentOne();
    useAdaptiveCoachingStore.getState().submitBecomingResponse("I want to follow through more");
    mockRequestInspiration.mockReset();
  });

  it("calls requestInspiration on mount while in the generating-inspiration phase, then reveals thoughts on success", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 0.9 }],
      thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" }],
      requestId: "req-1",
      promptVersion: "v2",
      latencyMs: 800,
      retryCount: 0,
    });

    await renderScreen();

    await waitFor(() => {
      expect(mockRequestInspiration).toHaveBeenCalledWith(
        { firstName: "Maya", age: null, becomingResponse: "I want to follow through more" },
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "inspiration-vision" });
    });
    expect(useAdaptiveCoachingStore.getState().thoughtPool).toHaveLength(1);
  });

  it("routes to safety-hand-off when the backend returns a hard-stop, without ever populating the thought pool", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "elevated", hardStop: true, message: "please reach out to someone" },
      requestId: "req-2",
    });

    await renderScreen();

    await waitFor(() => {
      expect(useAdaptiveCoachingStore.getState().phase).toEqual({
        status: "safety-hand-off",
        message: "please reach out to someone",
      });
    });
    expect(useAdaptiveCoachingStore.getState().thoughtPool).toHaveLength(0);
  });

  it("shows the inline Retry/Edit statement/Continue recovery UI when the request throws, never a dead end or a silent fallback", async () => {
    mockRequestInspiration.mockRejectedValue(new Error("network down"));

    const { findByLabelText, queryByLabelText } = await renderScreen();

    // FAILURE UX: stays on this screen (never the separate global "failed"
    // phase/screen) and offers all three recovery actions.
    await findByLabelText("Retry generating thoughts");
    expect(await findByLabelText("Edit your statement")).toBeTruthy();
    expect(await findByLabelText("Continue with suggested thoughts instead")).toBeTruthy();
    expect(useAdaptiveCoachingStore.getState().phase.status).toBe("generating-inspiration");
    // No thoughts silently shown as if they were AI output.
    expect(useAdaptiveCoachingStore.getState().thoughtPool).toHaveLength(0);
    expect(queryByLabelText(/Select thought/)).toBeNull();
  });

  it("'Continue with suggestions' after a failure shows fallback-sourced bubbles, never presented as AI thoughts", async () => {
    mockRequestInspiration.mockRejectedValue(new Error("network down"));
    const { findByLabelText, findAllByLabelText } = await renderScreen();

    await fireEvent.press(await findByLabelText("Continue with suggested thoughts instead"));

    const fallbackChips = await findAllByLabelText(/\(suggested, not AI-generated\)/);
    expect(fallbackChips.length).toBeGreaterThan(0);
  });

  it("fallback thoughts never touch rankedDimensions — selecting one leaves it exactly as it was before the failure (empty)", async () => {
    mockRequestInspiration.mockRejectedValue(new Error("network down"));
    const { findByLabelText, findAllByLabelText } = await renderScreen();
    await fireEvent.press(await findByLabelText("Continue with suggested thoughts instead"));

    const fallbackChips = await findAllByLabelText(/\(suggested, not AI-generated\)/);
    await fireEvent.press(fallbackChips[0]);

    // Never AI-derived: rankedDimensions stays empty (no successful AI call
    // ever happened in this test), and the added fragment is tagged source
    // "fallback", not "ai" — a downstream onboarding_beat call reading
    // rankedDimensions gets nothing invented from fallback content.
    expect(useAdaptiveCoachingStore.getState().rankedDimensions).toEqual([]);
    const fragment = useAdaptiveCoachingStore.getState().visionCanvas[0];
    expect(fragment.source).toBe("fallback");
  });

  it("Retry re-fetches and clears the recovery UI on success, without duplicating thoughts", async () => {
    mockRequestInspiration
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        safety: { tier: "none", hardStop: false },
        rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
        thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" }],
        requestId: "req-retry",
        promptVersion: "v2",
        latencyMs: 500,
        retryCount: 0,
      });

    const { findByLabelText, queryByLabelText } = await renderScreen();
    await fireEvent.press(await findByLabelText("Retry generating thoughts"));

    await waitFor(() => {
      expect(useAdaptiveCoachingStore.getState().thoughtPool).toHaveLength(1);
    });
    expect(mockRequestInspiration).toHaveBeenCalledTimes(2);
    expect(queryByLabelText("Retry generating thoughts")).toBeNull();
  });

  it("tapping a thought toggles selection: select, then deselect, then re-select — never a duplicate fragment", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" }],
      requestId: "req-dup",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    const { findByLabelText } = await renderScreen();
    const chip = await findByLabelText(/Select thought: Someone who follows through/);

    await fireEvent.press(chip); // select
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(1);

    const selectedChip = await findByLabelText(/Deselect thought: Someone who follows through/);
    await fireEvent.press(selectedChip); // deselect — bubble remains, fragment is gone
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(0);
    expect(await findByLabelText(/Select thought: Someone who follows through/)).toBeTruthy();

    await fireEvent.press(await findByLabelText(/Select thought: Someone who follows through/)); // re-select
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(1);
  });

  it("two rapid taps on the same bubble, same tick, correctly net out to a toggle cycle (select then deselect), never a duplicate", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" }],
      requestId: "req-rapid",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    const { findByLabelText } = await renderScreen();
    const chip = await findByLabelText(/Select thought: Someone who follows through/);
    await act(async () => {
      fireEvent.press(chip);
      fireEvent.press(chip);
    });
    // Reads fresh store state on every tap (handleSelectThought's own
    // `useAdaptiveCoachingStore.getState()` read), so the second tap sees
    // the first tap's already-applied add and correctly toggles it back
    // off — net zero, and specifically never two fragments from one bubble.
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(0);
  });

  it("two rapid taps on the same dismiss X, same tick, are safely idempotent — never consumes a second reserve thought", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [
        { id: "t1", dimension: "Habits & Discipline", text: "first thought", source: "ai" },
        { id: "t2", dimension: "Habits & Discipline", text: "second thought", source: "ai" },
        { id: "t3", dimension: "Habits & Discipline", text: "third thought", source: "ai" },
        { id: "t4", dimension: "Habits & Discipline", text: "fourth thought", source: "ai" },
        { id: "t5", dimension: "Habits & Discipline", text: "fifth thought", source: "ai" },
        { id: "t6", dimension: "Habits & Discipline", text: "sixth thought", source: "ai" },
        { id: "t7", dimension: "Habits & Discipline", text: "seventh thought", source: "ai" },
        { id: "t8", dimension: "Habits & Discipline", text: "eighth thought", source: "ai" },
      ],
      requestId: "req-rapid-dismiss",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    const { findByLabelText, queryByLabelText } = await renderScreen();
    const dismissButton = await findByLabelText("Dismiss thought: first thought");
    await act(async () => {
      fireEvent.press(dismissButton);
      fireEvent.press(dismissButton);
    });

    expect(queryByLabelText(/Select thought: first thought/)).toBeNull();
    expect(await findByLabelText(/Select thought: seventh thought/)).toBeTruthy();
    // The second tap targets an id already removed from `visible` — it must
    // be a no-op, never pulling a second reserve thought in behind it.
    expect(queryByLabelText(/Select thought: eighth thought/)).toBeNull();
  });

  it("respects the maximum-selection limit: an unselected bubble cannot be added once Vision Canvas is full", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" }],
      requestId: "req-max",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    for (let i = 0; i < 5; i++) {
      useAdaptiveCoachingStore.getState().addVisionFragment({ text: `filler ${i}`, origin: "typed", edited: false, source: "user" });
    }
    const { findByLabelText } = await renderScreen();
    const chip = await findByLabelText(/Select thought: Someone who follows through/);
    await fireEvent.press(chip);
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(5);
    expect(useAdaptiveCoachingStore.getState().visionCanvas.some((f) => f.text === "Someone who follows through")).toBe(false);
  });

  it("dismissing a bubble (X) animates it out and instantly replaces it from the reserve — no extra network call", async () => {
    // 10 thoughts: 6 visible + a 4-deep reserve, so consuming exactly one
    // reserve slot on this single dismiss leaves 3 behind — comfortably
    // above the refill threshold, so this test isolates the instant-replace
    // path from the separate background-refill path (covered below).
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [
        { id: "t1", dimension: "Habits & Discipline", text: "first thought", source: "ai" },
        { id: "t2", dimension: "Habits & Discipline", text: "second thought", source: "ai" },
        { id: "t3", dimension: "Habits & Discipline", text: "third thought", source: "ai" },
        { id: "t4", dimension: "Habits & Discipline", text: "fourth thought", source: "ai" },
        { id: "t5", dimension: "Habits & Discipline", text: "fifth thought", source: "ai" },
        { id: "t6", dimension: "Habits & Discipline", text: "sixth thought", source: "ai" },
        { id: "t7", dimension: "Habits & Discipline", text: "seventh thought — a reserve thought", source: "ai" },
        { id: "t8", dimension: "Habits & Discipline", text: "eighth thought", source: "ai" },
        { id: "t9", dimension: "Habits & Discipline", text: "ninth thought", source: "ai" },
        { id: "t10", dimension: "Habits & Discipline", text: "tenth thought", source: "ai" },
      ],
      requestId: "req-reserve",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    const { findByLabelText, queryByLabelText } = await renderScreen();
    await findByLabelText(/Select thought: first thought/);
    expect(mockRequestInspiration).toHaveBeenCalledTimes(1); // just the initial fetch so far

    const dismissButton = await findByLabelText("Dismiss thought: first thought");
    await fireEvent.press(dismissButton);

    // Instantly replaced from the reserve — the 7th thought (previously held
    // back) now appears, "first thought" never reappears, and no second
    // network call was made just to answer this one dismissal.
    expect(await findByLabelText(/Select thought: seventh thought/)).toBeTruthy();
    expect(queryByLabelText(/Select thought: first thought/)).toBeNull();
    expect(mockRequestInspiration).toHaveBeenCalledTimes(1);
  });

  it("a dismissed thought never reappears even after the reserve is exhausted and refilled", async () => {
    mockRequestInspiration
      .mockResolvedValueOnce({
        safety: { tier: "none", hardStop: false },
        rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
        thoughts: [
          { id: "t1", dimension: "Habits & Discipline", text: "only thought", source: "ai" },
          { id: "t2", dimension: "Habits & Discipline", text: "filler thought", source: "ai" },
        ],
        requestId: "req-only",
        promptVersion: "v2",
        latencyMs: 500,
        retryCount: 0,
      })
      .mockResolvedValueOnce({
        safety: { tier: "none", hardStop: false },
        rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
        thoughts: [
          { id: "t3", dimension: "Habits & Discipline", text: "only thought", source: "ai" }, // exact duplicate of the dismissed one
          { id: "t4", dimension: "Habits & Discipline", text: "a genuinely new thought", source: "ai" },
        ],
        requestId: "req-refill",
        promptVersion: "v2",
        latencyMs: 500,
        retryCount: 0,
      });

    const { findByLabelText, queryByLabelText } = await renderScreen();
    // Dismissing "only thought" empties the reserve (there wasn't one to
    // begin with) and triggers the silent background refill.
    await fireEvent.press(await findByLabelText("Dismiss thought: only thought"));
    await waitFor(() => expect(mockRequestInspiration).toHaveBeenCalledTimes(2));

    // The refill only fills the reserve — it doesn't retroactively populate
    // an already-emptied visible slot. Dismissing the one remaining bubble
    // is what pulls from the now-refreshed reserve, proving the duplicate
    // was filtered out and the genuinely new thought made it through.
    await fireEvent.press(await findByLabelText("Dismiss thought: filler thought"));
    expect(await findByLabelText(/Select thought: a genuinely new thought/)).toBeTruthy();
    expect(queryByLabelText(/Select thought: only thought/)).toBeNull();
  });

  it("Vision Canvas synchronization: removing a fragment from the canvas deselects its bubble", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" }],
      requestId: "req-sync",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    const { findByLabelText } = await renderScreen();
    await fireEvent.press(await findByLabelText(/Select thought: Someone who follows through/));
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(1);

    const fragmentId = useAdaptiveCoachingStore.getState().visionCanvas[0].id;
    useAdaptiveCoachingStore.getState().removeVisionFragment(fragmentId);

    expect(await findByLabelText(/Select thought: Someone who follows through/)).toBeTruthy();
  });

  it("Continue is a synchronous transition to understanding-review, resolving dismissed thoughts, with no network call", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [
        { id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" },
        { id: "t2", dimension: "Habits & Discipline", text: "Someone who shows up daily", source: "ai" },
      ],
      requestId: "req-continue",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    const { findByLabelText } = await renderScreen();
    const keepChip = await findByLabelText(/Select thought: Someone who follows through/);
    await fireEvent.press(keepChip);
    const dismissChip = await findByLabelText(/Dismiss thought: Someone who shows up daily/);
    await fireEvent.press(dismissChip);

    const continueButton = await findByLabelText("Continue");
    await fireEvent.press(continueButton);

    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "understanding-review" });
    expect(useAdaptiveCoachingStore.getState().dismissedThoughts).toEqual([
      { text: "Someone who shows up daily", source: "ai" },
    ]);
  });
});
