import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { VisionCanvasScreen } from "@/features/adaptive-coaching/screens/VisionCanvasScreen";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";

// Split out from VisionCanvasScreen.test.tsx deliberately: these three
// tests each hold a mocked request's promise open (to simulate a
// still-in-flight request) and resolve it late, sometimes after unmount.
// Co-locating them with the other ~7 mount/interaction tests in the same
// file was found, empirically, to leave react-test-renderer's scheduler in
// a state where the 9th/10th `render()` call in that file stopped flushing
// its initial mount effects — a cross-test pollution artifact tied to
// running many `render()`s in one file, not something these tests'
// production code causes (each of these three passes reliably click here
// in isolation, and the guards they exercise — `isSubmitting` read via
// `getState()`, `regeneratingRef`, `isMountedRef` — were independently
// read and verified correct in VisionCanvasScreen.tsx). Isolating them in
// their own file/worker sidesteps the accumulation instead of masking it.
jest.mock("@/services/onboardingTurnApi", () => ({
  ...jest.requireActual("@/services/onboardingTurnApi"),
  requestInspiration: jest.fn(),
  requestCoachingBeat: jest.fn(),
}));
import { requestCoachingBeat, requestInspiration } from "@/services/onboardingTurnApi";

const mockRequestInspiration = requestInspiration as jest.MockedFunction<typeof requestInspiration>;
const mockRequestCoachingBeat = requestCoachingBeat as jest.MockedFunction<typeof requestCoachingBeat>;

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

describe("VisionCanvasScreen — request lifecycle edge cases", () => {
  beforeEach(() => {
    useAdaptiveCoachingStore.getState().reset();
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    useAdaptiveCoachingStore.getState().beginMomentOne();
    useAdaptiveCoachingStore.getState().submitBecomingResponse("I want to follow through more");
    mockRequestInspiration.mockReset();
    mockRequestCoachingBeat.mockReset();
  });

  it("duplicate submission: two rapid taps on Continue fire requestCoachingBeat once, not twice", async () => {
    mockRequestInspiration.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
      thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "Someone who follows through", source: "ai" }],
      requestId: "req-1",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    // A normal, immediately-resolving mock — no manually-held-open promise.
    // The reentrancy guard (VisionCanvasScreen.tsx's `getState().isSubmitting`
    // check) runs synchronously inside the SECOND tap's event handler,
    // before either tap's own async work has a chance to resolve, so the
    // assertion below doesn't need to race anything.
    mockRequestCoachingBeat.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      psychologicalState: { observed: [], inferred: [], unknown: [] },
      chosenBeat: "Reflection",
      chosenMove: "Reflect",
      message: "message",
      rationaleCode: "x",
      confidence: 0.5,
      moveDowngraded: false,
      promptVersion: "v1",
      latencyMs: 100,
    });

    const { findByLabelText } = await renderScreen();
    const thoughtChip = await findByLabelText(/Select thought: Someone who follows through/);
    await fireEvent.press(thoughtChip);
    const continueButton = await findByLabelText("Continue");

    // Both taps dispatched before either resolves — this is exactly the
    // race a render-timing-dependent `disabled` prop alone can't close.
    // Wrapped in ONE async `act()`, not two independent `fireEvent.press`
    // calls: `handleContinue` is an async handler, and two back-to-back
    // `fireEvent.press` calls each open their own act() scope around a
    // callback that returns a promise neither one awaits — "overlapping
    // act() calls" that were found, empirically, to corrupt React's global
    // act-environment tracking for the rest of the test *process* (every
    // later test's initial mount effects silently stopped flushing). A
    // single async act() spanning both presses closes cleanly instead.
    await act(async () => {
      fireEvent.press(continueButton);
      fireEvent.press(continueButton);
    });

    expect(mockRequestCoachingBeat).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(useAdaptiveCoachingStore.getState().phase.status).toBe("coaching-beat");
    });
  });

  it("duplicate submission: two rapid taps on 'More like this' fire requestInspiration once for the regeneration", async () => {
    mockRequestInspiration
      .mockResolvedValueOnce({
        safety: { tier: "none", hardStop: false },
        rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
        thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "original thought", source: "ai" }],
        requestId: "req-orig",
        promptVersion: "v2",
        latencyMs: 500,
        retryCount: 0,
      })
      .mockResolvedValueOnce({
        safety: { tier: "none", hardStop: false },
        rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
        thoughts: [{ id: "t2", dimension: "Habits & Discipline", text: "a fresh thought", source: "ai" }],
        requestId: "req-more",
        promptVersion: "v2",
        latencyMs: 500,
        retryCount: 0,
      });

    const { findByLabelText } = await renderScreen();
    const moreButton = await findByLabelText("Generate more thoughts like these");
    // Single async act() spanning both taps — see the matching comment on
    // the Continue duplicate-tap test above.
    await act(async () => {
      fireEvent.press(moreButton);
      fireEvent.press(moreButton);
    });

    expect(mockRequestInspiration).toHaveBeenCalledTimes(2); // 1 initial mount + 1 regeneration, not 2 regenerations
    await waitFor(() => {
      expect(useAdaptiveCoachingStore.getState().thoughtPool.some((t) => t.text === "a fresh thought")).toBe(true);
    });
  });

  it("stale-response handling: a slow 'more like this' response arriving after the screen unmounts never overwrites the store", async () => {
    let resolveMoreLikeThis!: (v: Awaited<ReturnType<typeof mockRequestInspiration>>) => void;
    mockRequestInspiration
      .mockResolvedValueOnce({
        safety: { tier: "none", hardStop: false },
        rankedDimensions: [{ dimension: "Habits & Discipline", relevance: 1 }],
        thoughts: [{ id: "t1", dimension: "Habits & Discipline", text: "original thought", source: "ai" }],
        requestId: "req-orig",
        promptVersion: "v2",
        latencyMs: 500,
        retryCount: 0,
      })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveMoreLikeThis = resolve;
        })
      );

    const { findByLabelText, unmount } = await renderScreen();
    const btn = await findByLabelText("Generate more thoughts like these");
    // Not awaited: handleMoreLikeThis's promise is deliberately held open
    // by this test (that's the whole point — simulating a slow response),
    // and `await fireEvent.press` would deadlock waiting for React's act()
    // to drain a promise chain this test controls the resolution of.
    fireEvent.press(btn);
    await Promise.resolve();
    unmount();

    resolveMoreLikeThis({
      safety: { tier: "none", hardStop: false },
      rankedDimensions: [{ dimension: "Relationships", relevance: 1 }],
      thoughts: [{ id: "t2", dimension: "Relationships", text: "a stale later thought", source: "ai" }],
      requestId: "req-stale",
      promptVersion: "v2",
      latencyMs: 500,
      retryCount: 0,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The stale response must never have landed — the store still holds
    // the original batch, not the one that resolved after unmount.
    expect(useAdaptiveCoachingStore.getState().thoughtPool).toEqual([
      { id: "t1", dimension: "Habits & Discipline", text: "original thought", source: "ai" },
    ]);
  });
});
