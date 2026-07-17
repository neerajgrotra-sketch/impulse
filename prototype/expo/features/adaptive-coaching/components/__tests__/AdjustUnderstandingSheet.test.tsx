import { fireEvent, render } from "@testing-library/react-native";
import { AdjustUnderstandingSheet } from "@/features/adaptive-coaching/components/AdjustUnderstandingSheet";

describe("AdjustUnderstandingSheet", () => {
  it("renders the new copy: title, supporting line, and primary action", async () => {
    const { getByText, getByLabelText } = await render(
      <AdjustUnderstandingSheet visible onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    expect(getByText("What did I misunderstand?")).toBeTruthy();
    expect(getByText("Tell me what feels inaccurate or incomplete.")).toBeTruthy();
    expect(getByLabelText("Update my understanding")).toBeTruthy();
  });

  it("Update my understanding is disabled until text is entered, then submits the trimmed note and clears it", async () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = await render(<AdjustUnderstandingSheet visible onClose={jest.fn()} onSubmit={onSubmit} />);

    expect(getByLabelText("Update my understanding").props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(getByLabelText("What did I misunderstand?"), "  it's about fitness, not career  ");
    expect(getByLabelText("Update my understanding").props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(getByLabelText("Update my understanding"));
    expect(onSubmit).toHaveBeenCalledWith("it's about fitness, not career");

    // Cleared after a successful submit — a reopen should start fresh.
    expect(getByLabelText("What did I misunderstand?").props.value).toBe("");
  });

  it("preserves the typed correction across a close/reopen — onClose never clears the note", async () => {
    const onClose = jest.fn();
    const { getByLabelText, rerender } = await render(
      <AdjustUnderstandingSheet visible onClose={onClose} onSubmit={jest.fn()} />
    );
    await fireEvent.changeText(getByLabelText("What did I misunderstand?"), "the scale isn't the whole story");

    await fireEvent.press(getByLabelText("Cancel"));
    expect(onClose).toHaveBeenCalled();

    // Same component instance (visible toggled off then back on) — the
    // sheet is controlled by `visible`, never unmounted between opens, so
    // local `note` state survives exactly as a real close/reopen would.
    rerender(<AdjustUnderstandingSheet visible={false} onClose={onClose} onSubmit={jest.fn()} />);
    rerender(<AdjustUnderstandingSheet visible onClose={onClose} onSubmit={jest.fn()} />);

    expect(getByLabelText("What did I misunderstand?").props.value).toBe("the scale isn't the whole story");
  });
});
