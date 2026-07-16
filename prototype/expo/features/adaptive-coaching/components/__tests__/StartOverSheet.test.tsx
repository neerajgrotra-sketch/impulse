import { fireEvent, render } from "@testing-library/react-native";
import { StartOverSheet } from "@/features/adaptive-coaching/components/StartOverSheet";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

describe("StartOverSheet", () => {
  beforeEach(() => {
    useAdaptiveCoachingStore.getState().resetJourney("everything");
  });

  it("'Restart this reflection' preserves the name and calls onClose", async () => {
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    const onClose = jest.fn();
    const { getByLabelText } = await render(<StartOverSheet visible onClose={onClose} />);
    fireEvent.press(getByLabelText("Restart this reflection"));

    expect(useAdaptiveCoachingStore.getState().firstName).toBe("Maya");
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "moment-one" });
    expect(onClose).toHaveBeenCalled();
  });

  it("'Reset everything' clears the name and calls onClose", async () => {
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    const onClose = jest.fn();
    const { getByLabelText } = await render(<StartOverSheet visible onClose={onClose} />);
    fireEvent.press(getByLabelText("Reset everything"));

    expect(useAdaptiveCoachingStore.getState().firstName).toBe("");
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "name" });
    expect(onClose).toHaveBeenCalled();
  });

  it("'Cancel' closes without resetting anything", async () => {
    useAdaptiveCoachingStore.getState().setFirstName("Maya");
    useAdaptiveCoachingStore.getState().beginMomentOne();
    const onClose = jest.fn();
    const { getByLabelText } = await render(<StartOverSheet visible onClose={onClose} />);
    fireEvent.press(getByLabelText("Cancel"));

    expect(useAdaptiveCoachingStore.getState().firstName).toBe("Maya");
    expect(useAdaptiveCoachingStore.getState().phase).toEqual({ status: "moment-one" });
    expect(onClose).toHaveBeenCalled();
  });
});
