import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { UnderstandingReviewScreen } from "@/features/adaptive-coaching/screens/UnderstandingReviewScreen";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

jest.mock("@/hooks/useReduceMotion", () => ({
  useReduceMotion: () => true,
}));

jest.mock("@/services/onboardingTurnApi", () => ({
  ...jest.requireActual("@/services/onboardingTurnApi"),
  requestFinalSynthesis: jest.fn(),
}));
import { requestFinalSynthesis } from "@/services/onboardingTurnApi";

const mockRequestFinalSynthesis = requestFinalSynthesis as jest.MockedFunction<typeof requestFinalSynthesis>;

const GOOD_REVIEW = {
  headline: "Excellence on your own terms",
  coreAspiration: "You want to become exceptional without letting comparison define you.",
  interpretation: "You appear to value mastery, disciplined daily progress, and personal growth.",
  identityStatement: "Someone who builds mastery patiently, measures growth against themselves, and enjoys the climb.",
  emergingThemes: ["Self-defined success", "Disciplined mastery", "Process over outcome"],
  uncertainties: ["The specific area of life where you want to become exceptional is still unclear."],
  confidence: "medium" as const,
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <UnderstandingReviewScreen />
    </SafeAreaProvider>
  );
}

describe("UnderstandingReviewScreen", () => {
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

  it("shows a loading state, then renders every card once the review arrives", async () => {
    mockRequestFinalSynthesis.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      understanding: GOOD_REVIEW,
      requestId: "req-1",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });

    const { getByText } = await renderScreen();

    await waitFor(() => expect(getByText("Maya, I hear you.")).toBeTruthy());
    // headline/coreAspiration remain in the response schema (a backend
    // concern left untouched) but are no longer rendered on this
    // redesigned screen — the hero card leads with identityStatement.
    expect(getByText(GOOD_REVIEW.interpretation)).toBeTruthy();
    expect(getByText(GOOD_REVIEW.identityStatement)).toBeTruthy();
    expect(getByText("THE PERSON YOU ARE BECOMING")).toBeTruthy();
    expect(getByText("WHAT SEEMS TO MATTER UNDERNEATH")).toBeTruthy();
    expect(getByText("SOMETHING I STILL DON’T KNOW")).toBeTruthy();
    expect(getByText("Self-defined success")).toBeTruthy();
    expect(getByText(GOOD_REVIEW.uncertainties[0])).toBeTruthy();
  });

  it("never renders fragment-looking concatenated text on a malformed response — shows the retry panel instead", async () => {
    mockRequestFinalSynthesis.mockRejectedValue(new Error("Understanding review is missing required fields."));

    const { getByLabelText, queryByText } = await renderScreen();
    await waitFor(() => expect(getByLabelText("Retry building your understanding review")).toBeTruthy());
    expect(queryByText("Maya, I hear you.")).toBeNull();
  });

  it("Retry re-fires the request after a failure", async () => {
    mockRequestFinalSynthesis.mockRejectedValueOnce(new Error("network blip"));
    mockRequestFinalSynthesis.mockResolvedValueOnce({
      safety: { tier: "none", hardStop: false },
      understanding: GOOD_REVIEW,
      requestId: "req-2",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });

    const { getByLabelText, getByText } = await renderScreen();
    await waitFor(() => expect(getByLabelText("Retry building your understanding review")).toBeTruthy());
    await fireEvent.press(getByLabelText("Retry building your understanding review"));

    await waitFor(() => expect(getByText(GOOD_REVIEW.identityStatement)).toBeTruthy());
    expect(mockRequestFinalSynthesis).toHaveBeenCalledTimes(2);
  });

  it("'This feels right' shows a confirmation and never triggers another request", async () => {
    mockRequestFinalSynthesis.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      understanding: GOOD_REVIEW,
      requestId: "req-1",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });
    const { getByLabelText, getByText } = await renderScreen();
    await waitFor(() => expect(getByLabelText("This feels right")).toBeTruthy());
    await fireEvent.press(getByLabelText("This feels right"));
    expect(getByText("Thanks — noted.")).toBeTruthy();
    expect(mockRequestFinalSynthesis).toHaveBeenCalledTimes(1);
  });

  it("'Adjust my understanding' regenerates with a correction note and replaces the displayed review", async () => {
    mockRequestFinalSynthesis.mockResolvedValueOnce({
      safety: { tier: "none", hardStop: false },
      understanding: GOOD_REVIEW,
      requestId: "req-1",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });
    const revised = { ...GOOD_REVIEW, identityStatement: "Someone who redefined the goal around fitness, not career." };
    mockRequestFinalSynthesis.mockResolvedValueOnce({
      safety: { tier: "none", hardStop: false },
      understanding: revised,
      requestId: "req-2",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });

    const { getByLabelText, getByText } = await renderScreen();
    await waitFor(() => expect(getByText(GOOD_REVIEW.identityStatement)).toBeTruthy());

    await fireEvent.press(getByLabelText("Adjust my understanding"));
    await fireEvent.changeText(getByLabelText("What did I misunderstand?"), "this is about fitness, not career");
    await act(async () => {
      fireEvent.press(getByLabelText("Update my understanding"));
    });

    await waitFor(() => expect(getByText(revised.identityStatement)).toBeTruthy());
    expect(mockRequestFinalSynthesis).toHaveBeenCalledTimes(2);
    expect(mockRequestFinalSynthesis.mock.calls[1][0]).toMatchObject({ correctionNote: "this is about fitness, not career" });
  });

  it("'Start over' opens the confirmation sheet", async () => {
    mockRequestFinalSynthesis.mockResolvedValue({
      safety: { tier: "none", hardStop: false },
      understanding: GOOD_REVIEW,
      requestId: "req-1",
      promptVersion: "final-synthesis-v1",
      latencyMs: 1000,
    });
    const { getByLabelText } = await renderScreen();
    await waitFor(() => expect(getByLabelText("Start over")).toBeTruthy());
    await fireEvent.press(getByLabelText("Start over"));
    expect(getByLabelText("Restart this reflection")).toBeTruthy();
    expect(getByLabelText("Reset everything")).toBeTruthy();
  });
});
