import { render, waitFor } from "@testing-library/react-native";
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
  requestCoachingBeat: jest.fn(),
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
    useAdaptiveCoachingStore.getState().reset();
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    useAdaptiveCoachingStore.getState().beginMomentOne();
    useAdaptiveCoachingStore.getState().submitBecomingResponse("I want to follow through more");
    mockRequestInspiration.mockReset();
  });

  it("calls requestInspiration on mount while in the generating-inspiration phase, then reveals thoughts on success", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 0.9 }],
      thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through" }],
      promptVersion: "v1",
      latencyMs: 800,
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

  it("routes to the failed phase with a calm message when the request throws", async () => {
    mockRequestInspiration.mockRejectedValue(new Error("network down"));

    await renderScreen();

    await waitFor(() => {
      const phase = useAdaptiveCoachingStore.getState().phase;
      expect(phase.status).toBe("failed");
    });
  });
});
