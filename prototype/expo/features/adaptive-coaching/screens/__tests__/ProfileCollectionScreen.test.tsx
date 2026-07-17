import { fireEvent, render } from "@testing-library/react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { ProfileCollectionScreen } from "@/features/adaptive-coaching/screens/ProfileCollectionScreen";

function renderScreen(onSubmit: (name: string, age: number) => void, initialFirstName?: string, initialAge?: number | null) {
  return render(
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ProfileCollectionScreen onSubmit={onSubmit} initialFirstName={initialFirstName} initialAge={initialAge} />
    </SafeAreaProvider>
  );
}

describe("ProfileCollectionScreen", () => {
  it("shows the header and both fields", async () => {
    const { getByText, getByLabelText } = await renderScreen(jest.fn());
    expect(getByText("Let’s begin with you")).toBeTruthy();
    expect(getByLabelText("Your first name")).toBeTruthy();
    expect(getByLabelText("Your age")).toBeTruthy();
    expect(getByText(/won’t make assumptions from it/)).toBeTruthy();
  });

  it("disables Continue until both a valid name and a valid age are entered", async () => {
    const { getByLabelText } = await renderScreen(jest.fn());
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(getByLabelText("Your first name"), "Nick");
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(getByLabelText("Your age"), "48");
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(false);
  });

  it("submits the trimmed name and the parsed numeric age", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = await renderScreen(onSubmit);
    await fireEvent.changeText(getByLabelText("Your first name"), "  Nick  ");
    await fireEvent.changeText(getByLabelText("Your age"), "48");
    await fireEvent.press(getByLabelText("Continue"));
    expect(onSubmit).toHaveBeenCalledWith("Nick", 48);
  });

  it("strips non-digit characters from the age field as the user types", async () => {
    const { getByLabelText } = await renderScreen(jest.fn());
    await fireEvent.changeText(getByLabelText("Your age"), "4a8");
    expect(getByLabelText("Your age").props.value).toBe("48");
  });

  it("shows an inline validation message for an out-of-range age, and keeps Continue disabled", async () => {
    const { getByLabelText, findByText } = await renderScreen(jest.fn());
    await fireEvent.changeText(getByLabelText("Your first name"), "Nick");
    await fireEvent.changeText(getByLabelText("Your age"), "9");
    fireEvent(getByLabelText("Your age"), "blur");
    expect(await findByText(/between 13 and 119/)).toBeTruthy();
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(true);
  });

  it("preserves name and age passed in as initial values (e.g. a future back-navigation path)", async () => {
    const { getByLabelText } = await renderScreen(jest.fn(), "Nick", 48);
    expect(getByLabelText("Your first name").props.value).toBe("Nick");
    expect(getByLabelText("Your age").props.value).toBe("48");
    expect(getByLabelText("Continue").props.accessibilityState.disabled).toBe(false);
  });

  it("does not collect a full date of birth — only a numeric age field exists", async () => {
    const { queryByLabelText } = await renderScreen(jest.fn());
    expect(queryByLabelText(/date of birth/i)).toBeNull();
    expect(queryByLabelText(/birthday/i)).toBeNull();
  });
});
