import { act, render } from "@testing-library/react-native";
import { ImpulseOpeningScreen } from "@/features/adaptive-coaching/screens/ImpulseOpeningScreen";

let mockReduceMotionEnabled = false;
jest.mock("@/hooks/useReduceMotion", () => ({
  useReduceMotion: () => mockReduceMotionEnabled,
}));

describe("ImpulseOpeningScreen", () => {
  beforeEach(() => {
    mockReduceMotionEnabled = false;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("shows the IMPULSE wordmark under one accessible 'Impulse' label", async () => {
    const { getByLabelText } = await render(<ImpulseOpeningScreen onComplete={jest.fn()} />);
    expect(getByLabelText("Impulse")).toBeTruthy();
  });

  it("auto-advances without any tap, within the 1.2-1.8s window", async () => {
    const onComplete = jest.fn();
    await render(<ImpulseOpeningScreen onComplete={onComplete} />);

    await act(async () => {
      jest.advanceTimersByTime(1199);
    });
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(700); // past the 1.8s ceiling
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("Reduce Motion: skips the letter-by-letter pulse for a short crossfade, and still auto-advances", async () => {
    mockReduceMotionEnabled = true;
    const onComplete = jest.fn();
    const { getByText } = await render(<ImpulseOpeningScreen onComplete={onComplete} />);
    expect(getByText("IMPULSE")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("never calls onComplete more than once even if the timer somehow fires again", async () => {
    const onComplete = jest.fn();
    await render(<ImpulseOpeningScreen onComplete={onComplete} />);
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
