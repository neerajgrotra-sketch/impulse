import { act, fireEvent, render } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { MomentOneScreen } from "@/features/adaptive-coaching/screens/MomentOneScreen";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";

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

function renderScreen(
  onSubmit: (text: string) => void,
  voiceCapture: VoiceCapture = buildVoiceCapture(),
  initialText?: string,
  firstName = "Maya"
) {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <MomentOneScreen voiceCapture={voiceCapture} onSubmit={onSubmit} initialText={initialText} firstName={firstName} />
    </SafeAreaProvider>
  );
}

describe("MomentOneScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("personalizes the title with the person's name and shows no thought stream (nothing is generated yet at this point)", async () => {
    const { getByText, queryAllByLabelText } = await renderScreen(jest.fn());
    expect(getByText("Maya, who do you want to become?")).toBeTruthy();
    expect(queryAllByLabelText(/^Use this thought:/)).toHaveLength(0);
  });

  it("falls back to an unaddressed title when firstName is empty", async () => {
    const { getByText } = await renderScreen(jest.fn(), buildVoiceCapture(), undefined, "");
    expect(getByText("Who do you want to become?")).toBeTruthy();
  });

  it("reveals an editable card when Type is pressed, and Continue is disabled until text exists", async () => {
    const { getByLabelText, getByText } = await renderScreen(jest.fn());
    await act(async () => {
      await fireEvent.press(getByText("Type"));
    });
    const input = getByLabelText("Your vision");
    expect(input).toBeTruthy();
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(input, "I want to be more present");
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(false);
  });

  it("submits the typed text verbatim on Continue", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = await renderScreen(onSubmit);
    await act(async () => {
      await fireEvent.press(getByText("Type"));
    });
    await fireEvent.changeText(getByLabelText("Your vision"), "I want to follow through more");
    await fireEvent.press(getByLabelText("Continue"));
    expect(onSubmit).toHaveBeenCalledWith("I want to follow through more");
  });

  it("restores the exact prior statement when revisited with initialText (FAILURE UX: preserve all user input)", async () => {
    const { getByLabelText, queryByText } = await renderScreen(
      jest.fn(),
      buildVoiceCapture(),
      "I want to be the very best"
    );
    // Card is already revealed with the exact prior text — no "Type" prompt,
    // no blank card, nothing lost.
    expect(queryByText("Type")).toBeNull();
    expect(getByLabelText("Your vision").props.value).toBe("I want to be the very best");
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(false);
  });

  it("shows the voice capture button when voice is available, alongside Type (equal-weight parity)", async () => {
    const voiceCapture = buildVoiceCapture({ isAvailable: true });
    const { getByText, queryByLabelText } = await renderScreen(jest.fn(), voiceCapture);
    expect(getByText("Type")).toBeTruthy();
    // VoiceCaptureButton renders null entirely when unavailable — when
    // available, some real control must render (exact label depends on
    // VoiceCaptureButton's own implementation, already covered by its own tests).
    expect(queryByLabelText("Type your answer instead")).toBeTruthy();
  });
});
