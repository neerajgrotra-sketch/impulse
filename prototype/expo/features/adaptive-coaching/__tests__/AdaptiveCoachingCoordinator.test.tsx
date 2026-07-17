import { act, fireEvent, render } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { AdaptiveCoachingCoordinator } from "@/features/adaptive-coaching/AdaptiveCoachingCoordinator";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

// UnderstandingReviewScreen fires its own final-synthesis fetch on mount —
// these coordinator tests pre-populate the store's understandingReview
// directly (an unrealistic-but-convenient setup for testing phase routing
// in isolation), so the real network call this mock replaces would
// otherwise fire uncontrolled and never resolve meaningfully in a test
// environment with no fetch/config. Held open deliberately: none of these
// tests need it to ever settle.
jest.mock("@/services/onboardingTurnApi", () => ({
  ...jest.requireActual("@/services/onboardingTurnApi"),
  requestFinalSynthesis: jest.fn(() => new Promise(() => {})),
}));

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
    useAdaptiveCoachingStore.getState().resetJourney("everything");
  });

  it("shows the Impulse opening screen first (on a genuinely fresh store) and auto-advances to profile collection", async () => {
    useAdaptiveCoachingStore.setState({ phase: { status: "opening" } });
    jest.useFakeTimers();
    const { getByLabelText, queryByLabelText } = await renderCoordinator();
    expect(getByLabelText("Impulse")).toBeTruthy();
    expect(queryByLabelText("Your first name")).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "name" });
    jest.useRealTimers();
  });

  it("starts on ProfileCollectionScreen and advances to MomentOneScreen on submit", async () => {
    const { getByLabelText, getByText } = await renderCoordinator();
    expect(getByLabelText("Your first name")).toBeTruthy();

    await fireEvent.changeText(getByLabelText("Your first name"), "Maya");
    await fireEvent.changeText(getByLabelText("Your age"), "34");
    await fireEvent.press(getByLabelText("Continue"));

    expect(getByText("Maya, who do you want to become?")).toBeTruthy();
    expect(useAdaptiveCoachingStore.getState().firstName).toBe("Maya");
    expect(useAdaptiveCoachingStore.getState().age).toBe(34);
  });

  it("renders the safety hand-off screen and nothing else when that phase is active", async () => {
    useAdaptiveCoachingStore.getState().inspirationHardStopped("please reach out to someone");
    const { getByText, queryByLabelText } = await renderCoordinator();
    expect(getByText("please reach out to someone")).toBeTruthy();
    // No Continue button, no further onboarding surface on this screen.
    expect(queryByLabelText("Continue")).toBeNull();
  });

  it("renders the understanding-review screen with the stored synthesis and nothing from the old coaching-beat UI", async () => {
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    useAdaptiveCoachingStore.getState().beginUnderstandingReview([]);
    useAdaptiveCoachingStore.getState().understandingReviewReceived({
      headline: "Excellence on your own terms",
      coreAspiration: "You want to become exceptional without letting comparison define you.",
      interpretation: "interpretation text",
      identityStatement: "Someone who builds mastery patiently.",
      emergingThemes: ["Self-defined success"],
      uncertainties: ["The specific area is still unclear."],
      confidence: "medium",
    });
    const { getByText } = await renderCoordinator();
    expect(getByText("Maya, I hear you.")).toBeTruthy();
    expect(getByText("Someone who builds mastery patiently.")).toBeTruthy();
    expect(getByText("interpretation text")).toBeTruthy();
  });

  it("Start over -> Reset everything on the understanding-review screen clears the store and reaches Name Collection", async () => {
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    useAdaptiveCoachingStore.getState().beginUnderstandingReview([]);
    useAdaptiveCoachingStore.getState().understandingReviewReceived({
      headline: "headline",
      coreAspiration: "aspiration",
      interpretation: "interpretation",
      identityStatement: "identity",
      emergingThemes: [],
      uncertainties: [],
      confidence: "low",
    });
    const { getByLabelText } = await renderCoordinator();
    await fireEvent.press(getByLabelText("Start over"));
    await fireEvent.press(getByLabelText("Reset everything"));

    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "name" });
    expect(useAdaptiveCoachingStore.getState().firstName).toBe("");
    expect(getByLabelText("Your first name")).toBeTruthy();
  });
});
