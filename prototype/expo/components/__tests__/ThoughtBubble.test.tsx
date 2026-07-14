import { fireEvent, render } from "@testing-library/react-native";
import { ThoughtBubble } from "@/components/ThoughtBubble";
import type { Thought } from "@/constants/thoughtLibrary";

const thought: Thought = { id: "t1", theme: "presence", text: "I want to be more present." };

describe("ThoughtBubble", () => {
  it("reports the tapped thought", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(
      <ThoughtBubble thought={thought} phase="visible" reduceMotion={false} onPress={onPress} />
    );

    await fireEvent.press(getByLabelText(`Use this thought: ${thought.text}`));
    expect(onPress).toHaveBeenCalledWith(thought);
  });

  it("still renders its content when Reduce Motion swaps in the simplified transition", async () => {
    const { getByText } = await render(
      <ThoughtBubble thought={thought} phase="entering" reduceMotion onPress={jest.fn()} />
    );
    expect(getByText(thought.text)).toBeTruthy();
  });
});
