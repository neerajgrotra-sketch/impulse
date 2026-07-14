import { fireEvent, render } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { AdaptiveCoachingCoordinator } from "@/features/adaptive-coaching/AdaptiveCoachingCoordinator";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

// useVoiceCapture's real implementation dynamically imports a native module
// in a `useEffect` (guarded only by an Expo-Go check, which is false in the
// Jest environment) — that async import floats past this component's
// lifecycle in tests and corrupts later tests in this same file. Every
// other screen in this codebase takes `voiceCapture` as an injected prop for
// exactly this reason (see IdentityInspirationScreen's own tests); the
// coordinator is the one place that owns the real hook, matching
// OnboardingCoordinator's existing (and itself untested at this level)
// pattern. Mocking it here is the narrow, deliberate exception.
jest.mock("@/hooks/useVoiceCapture", () => ({
  useVoiceCapture: () => ({
    isAvailable: false,
    isRecording: false,
    transcript: "",
    requestPermission: jest.fn().mockResolvedValue(false),
    start: jest.fn(),
    stop: jest.fn(),
  }),
}));

// The coordinator's own FadeIn/FadeOut crossfade (mirroring OnboardingCoordinator's
// existing, itself-untested pattern) interacts badly with this project's async
// `render()` in a test environment — forcing Reduce Motion true removes the
// animated transition entirely, so phase changes are synchronous and
// queryable immediately, which is what this suite actually needs to verify
// (phase routing), not animation timing.
jest.mock("@/hooks/useReduceMotion", () => ({
  useReduceMotion: () => true,
}));

function renderCoordinator() {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AdaptiveCoachingCoordinator />
    </SafeAreaProvider>
  );
}

describe("AdaptiveCoachingCoordinator", () => {
  beforeEach(() => {
    // Deliberately NOT wrapped in `act()` — nothing is mounted yet at this
    // point, and wrapping a store update in `act()` with no subscriber
    // leaves this project's async `render()` in a state where the
    // subsequent render silently produces an empty tree. `act()` is for
    // flushing updates against an already-mounted tree; pre-render setup
    // is a plain call.
    useAdaptiveCoachingStore.getState().reset();
  });

  it("starts on NameCollectionScreen and advances to MomentOneScreen on submit", async () => {
    const { getByLabelText, getByText } = await renderCoordinator();
    expect(getByLabelText("Your first name")).toBeTruthy();

    await fireEvent.changeText(getByLabelText("Your first name"), "Maya");
    await fireEvent.press(getByLabelText("Continue"));

    expect(getByText("Who are you becoming?")).toBeTruthy();
    expect(useAdaptiveCoachingStore.getState().firstName).toBe("Maya");
  });

  it("renders the safety hand-off screen and nothing else when that phase is active", async () => {
    useAdaptiveCoachingStore.getState().inspirationHardStopped("please reach out to someone");
    const { getByText, queryByLabelText } = await renderCoordinator();
    expect(getByText("please reach out to someone")).toBeTruthy();
    // No Continue button, no further onboarding surface on this screen.
    expect(queryByLabelText("Continue")).toBeNull();
  });

  it("renders the coaching beat screen with the stored beat/move/message and nothing else", async () => {
    useAdaptiveCoachingStore.getState().beatReceived(
      {
        beat: "Reflection",
        move: "Reflect",
        message: "It sounds like presence matters a lot to you.",
        psychologicalState: { observed: [], inferred: [], unknown: [] },
      },
      { lastSafetyTier: "none", lastLatencyMs: 500, lastRawPayload: {} }
    );
    const { getByText, queryByLabelText } = await renderCoordinator();
    expect(getByText("It sounds like presence matters a lot to you.")).toBeTruthy();
    expect(queryByLabelText("Continue")).toBeNull();
  });

  it("the failed phase offers a 'Start over' control that resets the store", async () => {
    useAdaptiveCoachingStore.getState().inspirationFailed("I'm having a little trouble right now.");
    const { getByLabelText } = await renderCoordinator();
    await fireEvent.press(getByLabelText("Start over"));
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "name" });
  });
});
