import { act, fireEvent, render } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { IdentityInspirationScreen } from "@/features/onboarding/screens/IdentityInspirationScreen";
import { THOUGHT_ENTER_DURATION_MS, THOUGHT_INITIAL_DELAY_MS } from "@/hooks/useThoughtScheduler";
import type { QuestionVoice } from "@/hooks/useQuestionVoice";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";
import type { OnboardingQuestion } from "@/types/onboarding";

const question: OnboardingQuestion = {
  id: "identity",
  kind: "identity",
  text: "Who do you want to become?",
};

function buildVoiceCapture(overrides: Partial<VoiceCapture> = {}): VoiceCapture {
  return {
    isAvailable: false,
    isRecording: false,
    transcript: "",
    requestPermission: jest.fn().mockResolvedValue(false),
    start: jest.fn(),
    stop: jest.fn(),
    ...overrides,
  };
}

function buildQuestionVoice(overrides: Partial<QuestionVoice> = {}): QuestionVoice {
  return {
    isSpeaking: false,
    speak: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    ...overrides,
  };
}

function renderScreen(onSubmit: (statement: string) => void, voiceCapture: VoiceCapture = buildVoiceCapture()) {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <IdentityInspirationScreen
        question={question}
        voiceCapture={voiceCapture}
        questionVoice={buildQuestionVoice()}
        onSubmit={onSubmit}
      />
    </SafeAreaProvider>
  );
}

describe("IdentityInspirationScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("populates the vision card when a thought is tapped without auto-focusing, and never lets a later thought tap overwrite an edit", async () => {
    const onSubmit = jest.fn();
    const { getAllByLabelText, getByLabelText, getByDisplayValue } = await renderScreen(onSubmit);

    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS + THOUGHT_ENTER_DURATION_MS);
    });

    const [thoughtButton] = getAllByLabelText(/^Use this thought:/);
    await fireEvent.press(thoughtButton);

    const input = getByLabelText("Your vision");
    // Every normalized thought reads as a first-person statement.
    expect(input.props.value.startsWith("I")).toBe(true);

    await fireEvent.changeText(input, "I am someone who follows through, edited by hand.");
    expect(getByDisplayValue("I am someone who follows through, edited by hand.")).toBeTruthy();

    // The stream stays ambient (ThoughtStream itself only pauses for the
    // keyboard/voice/backgrounding — ​not for a revealed card, PDR 0008), but
    // once the card is revealed, tapping a bubble must never clobber content
    // the user already committed to.
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    const laterThoughtButtons = getAllByLabelText(/^Use this thought:/);
    if (laterThoughtButtons.length > 0) {
      await fireEvent.press(laterThoughtButtons[0]);
    }
    expect(getByDisplayValue("I am someone who follows through, edited by hand.")).toBeTruthy();
  });

  it("shows no vision card in Reflection Mode, and reveals it only once Type is pressed", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, queryByLabelText } = await renderScreen(onSubmit);

    expect(queryByLabelText("Your vision")).toBeNull();

    await fireEvent.press(getByLabelText("Type your vision instead"));

    expect(getByLabelText("Your vision")).toBeTruthy();
  });

  it("keeps Continue disabled until there is meaningful content, then submits the edited text", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getAllByLabelText } = await renderScreen(onSubmit);

    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(THOUGHT_INITIAL_DELAY_MS + THOUGHT_ENTER_DURATION_MS);
    });
    const [thoughtButton] = getAllByLabelText(/^Use this thought:/);
    await fireEvent.press(thoughtButton);

    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(false);

    const input = getByLabelText("Your vision");
    await fireEvent.changeText(input, "   ");
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(input, "I am someone who follows through.");
    await fireEvent.press(getByLabelText("Continue"));
    expect(onSubmit).toHaveBeenCalledWith("I am someone who follows through.");
  });

  it("shows a live partial transcript while listening, and Cancel discards it without revealing the card", async () => {
    const onSubmit = jest.fn();
    const voiceCapture = buildVoiceCapture({ isAvailable: true, requestPermission: jest.fn().mockResolvedValue(true) });
    const { getByLabelText, queryByText, rerender } = await renderScreen(onSubmit, voiceCapture);

    await fireEvent.press(getByLabelText("Record your vision by voice"));
    // Flush the requestPermission() microtask so status settles to "listening".
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getByLabelText("Stop recording your vision")).toBeTruthy();

    // Simulate the native recognizer reporting live (partial) speech.
    await rerender(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <IdentityInspirationScreen
          question={question}
          voiceCapture={{ ...voiceCapture, isRecording: true, transcript: "someone who follows through" }}
          questionVoice={buildQuestionVoice()}
          onSubmit={onSubmit}
        />
      </SafeAreaProvider>
    );

    expect(queryByText("someone who follows through")).toBeTruthy();

    await fireEvent.press(getByLabelText("Cancel recording and discard what you said"));

    expect(queryByText("someone who follows through")).toBeNull();
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(true);
  });
});
