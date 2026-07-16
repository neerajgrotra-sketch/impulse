import { fireEvent, render } from "@testing-library/react-native";
import { VisionCanvas } from "@/components/VisionCanvas";
import type { VisionFragment } from "@/types/adaptiveCoaching";

function fragment(id: string, text: string): VisionFragment {
  return { id, text, origin: "typed", edited: false, source: "user" };
}

describe("VisionCanvas", () => {
  it("renders one EditableVisionCard per fragment", async () => {
    const fragments = [fragment("1", "Someone who follows through"), fragment("2", "Someone who listens")];
    const { getByDisplayValue } = await render(
      <VisionCanvas
        fragments={fragments}
        maxFragments={5}
        onEditFragment={jest.fn()}
        onRemoveFragment={jest.fn()}
        onReorderFragment={jest.fn()}
      />
    );
    expect(getByDisplayValue("Someone who follows through")).toBeTruthy();
    expect(getByDisplayValue("Someone who listens")).toBeTruthy();
  });

  it("calls onEditFragment with the fragment id when its text changes", async () => {
    const onEditFragment = jest.fn();
    const fragments = [fragment("1", "original text")];
    const { getByDisplayValue } = await render(
      <VisionCanvas
        fragments={fragments}
        maxFragments={5}
        onEditFragment={onEditFragment}
        onRemoveFragment={jest.fn()}
        onReorderFragment={jest.fn()}
      />
    );
    await fireEvent.changeText(getByDisplayValue("original text"), "edited text");
    expect(onEditFragment).toHaveBeenCalledWith("1", "edited text");
  });

  it("calls onRemoveFragment with the correct id when Remove is pressed", async () => {
    const onRemoveFragment = jest.fn();
    const fragments = [fragment("1", "keep"), fragment("2", "remove me")];
    const { getAllByLabelText } = await render(
      <VisionCanvas
        fragments={fragments}
        maxFragments={5}
        onEditFragment={jest.fn()}
        onRemoveFragment={onRemoveFragment}
        onReorderFragment={jest.fn()}
      />
    );
    const removeButtons = getAllByLabelText("Remove this fragment");
    await fireEvent.press(removeButtons[1]);
    expect(onRemoveFragment).toHaveBeenCalledWith("2");
  });

  it("disables 'Move up' for the first fragment and 'Move down' for the last", async () => {
    const fragments = [fragment("1", "a"), fragment("2", "b"), fragment("3", "c")];
    const { getAllByLabelText } = await render(
      <VisionCanvas
        fragments={fragments}
        maxFragments={5}
        onEditFragment={jest.fn()}
        onRemoveFragment={jest.fn()}
        onReorderFragment={jest.fn()}
      />
    );
    const moveUps = getAllByLabelText("Move this fragment up");
    const moveDowns = getAllByLabelText("Move this fragment down");
    expect(moveUps[0].props.accessibilityState.disabled).toBe(true);
    expect(moveDowns[moveDowns.length - 1].props.accessibilityState.disabled).toBe(true);
  });

  it("calls onReorderFragment with (index, index-1) when 'Move up' is pressed", async () => {
    const onReorderFragment = jest.fn();
    const fragments = [fragment("1", "a"), fragment("2", "b")];
    const { getAllByLabelText } = await render(
      <VisionCanvas
        fragments={fragments}
        maxFragments={5}
        onEditFragment={jest.fn()}
        onRemoveFragment={jest.fn()}
        onReorderFragment={onReorderFragment}
      />
    );
    await fireEvent.press(getAllByLabelText("Move this fragment up")[1]);
    expect(onReorderFragment).toHaveBeenCalledWith(1, 0);
  });

  it("shows the limit note once maxFragments is reached", async () => {
    const fragments = [fragment("1", "a"), fragment("2", "b")];
    const { getByText } = await render(
      <VisionCanvas
        fragments={fragments}
        maxFragments={2}
        onEditFragment={jest.fn()}
        onRemoveFragment={jest.fn()}
        onReorderFragment={jest.fn()}
      />
    );
    expect(getByText(/You've reached 2/)).toBeTruthy();
  });
});
