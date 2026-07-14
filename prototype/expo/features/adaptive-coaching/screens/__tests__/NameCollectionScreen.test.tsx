import { fireEvent, render } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { NameCollectionScreen } from "@/features/adaptive-coaching/screens/NameCollectionScreen";

function renderScreen(onSubmit: (name: string) => void) {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NameCollectionScreen onSubmit={onSubmit} />
    </SafeAreaProvider>
  );
}

describe("NameCollectionScreen", () => {
  it("disables Continue until a name is entered", async () => {
    const { getByLabelText } = await renderScreen(jest.fn());
    const continueButton = getByLabelText("Continue");
    expect(continueButton.props.accessibilityState.disabled).toBe(true);
  });

  it("enables Continue once a name is entered and submits the trimmed value", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = await renderScreen(onSubmit);

    await fireEvent.changeText(getByLabelText("Your first name"), "  Maya  ");
    const continueButton = getByLabelText("Continue");
    expect(continueButton.props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(continueButton);
    expect(onSubmit).toHaveBeenCalledWith("Maya");
  });

  it("does not ask for anything beyond a first name — no other input fields render", async () => {
    const { queryByLabelText } = await renderScreen(jest.fn());
    expect(queryByLabelText(/age/i)).toBeNull();
    expect(queryByLabelText(/life stage/i)).toBeNull();
  });
});
