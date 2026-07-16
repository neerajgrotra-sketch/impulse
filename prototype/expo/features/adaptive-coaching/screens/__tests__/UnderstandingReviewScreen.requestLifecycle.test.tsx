import { render } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { UnderstandingReviewScreen } from "@/features/adaptive-coaching/screens/UnderstandingReviewScreen";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

// Split out from UnderstandingReviewScreen.test.tsx deliberately — same
// reasoning as VisionCanvasScreen.requestLifecycle.test.tsx: this test holds
// a mocked request's promise open and resolves it after unmount, which is
// the exact "stale response after Start Over" scenario Part 3 requires
// protection against.
jest.mock("@/hooks/useReduceMotion", () => ({
  useReduceMotion: () => true,
}));

jest.mock("@/services/onboardingTurnApi", () => ({
  ...jest.requireActual("@/services/onboardingTurnApi"),
  requestFinalSynthesis: jest.fn(),
}));
import { requestFinalSynthesis } from "@/services/onboardingTurnApi";

const mockRequestFinalSynthesis = requestFinalSynthesis as jest.MockedFunction<typeof requestFinalSynthesis>;

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <UnderstandingReviewScreen />
    </SafeAreaProvider>
  );
}

describe("UnderstandingReviewScreen — request lifecycle edge cases", () => {
  beforeEach(() => {
    useAdaptiveCoachingStore.getState().resetJourney("everything");
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    useAdaptiveCoachingStore.getState().beginMomentOne();
    useAdaptiveCoachingStore.getState().submitBecomingResponse("I wanna be very best");
    useAdaptiveCoachingStore.getState().addVisionFragment({
      text: "Someone chasing the edge of their own potential",
      origin: "thought_tap",
      edited: false,
      source: "ai",
    });
    useAdaptiveCoachingStore.getState().beginUnderstandingReview([]);
    mockRequestFinalSynthesis.mockReset();
  });

  it("stale-response handling: a slow synthesis response arriving after the screen unmounts never overwrites the store", async () => {
    let resolveSynthesis!: (v: Awaited<ReturnType<typeof mockRequestFinalSynthesis>>) => void;
    mockRequestFinalSynthesis.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSynthesis = resolve;
      })
    );

    const { unmount } = await renderScreen();
    // Not awaited: the request is deliberately held open by this test.
    await Promise.resolve();
    // This RNTL version's `unmount` is itself async (wraps `act()`
    // internally) — it must be awaited so the effect cleanup (aborting the
    // in-flight request) actually completes before the held-open mock
    // promise resolves below, or the two race.
    await unmount();

    resolveSynthesis({
      safety: { tier: "none", hardStop: false },
      understanding: {
        headline: "a stale headline that arrived too late",
        coreAspiration: "aspiration",
        interpretation: "interpretation",
        identityStatement: "identity",
        emergingThemes: [],
        uncertainties: [],
        confidence: "low",
      },
      requestId: "req-stale",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The stale response must never have landed — the store still holds no
    // understanding review, not the one that resolved after unmount.
    expect(useAdaptiveCoachingStore.getState().understandingReview).toBeNull();
  });

  it("stale-response handling: a slow synthesis response arriving after Start Over resets the store never repopulates it", async () => {
    let resolveSynthesis!: (v: Awaited<ReturnType<typeof mockRequestFinalSynthesis>>) => void;
    mockRequestFinalSynthesis.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSynthesis = resolve;
      })
    );

    const { unmount } = await renderScreen();
    await Promise.resolve();
    // Start Over unmounts this screen the same way a real coordinator phase
    // change would (this test drives the store directly rather than going
    // through the sheet UI, since the unmount-triggering mechanism — a
    // phase change — is what actually matters here).
    useAdaptiveCoachingStore.getState().resetJourney("everything");
    await unmount();

    resolveSynthesis({
      safety: { tier: "none", hardStop: false },
      understanding: {
        headline: "a stale headline",
        coreAspiration: "aspiration",
        interpretation: "interpretation",
        identityStatement: "identity",
        emergingThemes: [],
        uncertainties: [],
        confidence: "low",
      },
      requestId: "req-stale-2",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(useAdaptiveCoachingStore.getState().understandingReview).toBeNull();
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "name" });
  });
});
