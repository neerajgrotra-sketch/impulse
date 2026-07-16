import { fireEvent, render, waitFor } from "@testing-library/react-native";
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
        { firstName: "Maya", becomingResponse: "I want to follow through more" },
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

  it("selecting the same thought twice never creates a duplicate Vision Canvas fragment", async () => {
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
    await fireEvent.press(chip);
    await fireEvent.press(chip);
    expect(useAdaptiveCoachingStore.getState().visionCanvas).toHaveLength(1);
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
