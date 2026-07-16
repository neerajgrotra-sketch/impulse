import { render } from "@testing-library/react-native";
import { MomentSphere } from "@/components/MomentSphere";

describe("MomentSphere", () => {
  it("renders MOMENT and the current/total numbers", async () => {
    const { getByText } = await render(<MomentSphere currentMoment={2} totalMoments={3} state="idle" />);
    expect(getByText("MOMENT")).toBeTruthy();
    expect(getByText("2 of 3")).toBeTruthy();
  });

  it("exposes exactly one VoiceOver-facing accessibility label", async () => {
    const { getByLabelText } = await render(<MomentSphere currentMoment={2} totalMoments={3} state="idle" />);
    expect(getByLabelText("Moment 2 of 3")).toBeTruthy();
  });

  it("renders the first moment", async () => {
    const { getByLabelText } = await render(<MomentSphere currentMoment={1} totalMoments={3} state="idle" />);
    expect(getByLabelText("Moment 1 of 3")).toBeTruthy();
  });

  it("renders the final moment in the complete state without throwing", async () => {
    const { getByLabelText } = await render(<MomentSphere currentMoment={3} totalMoments={3} state="complete" />);
    expect(getByLabelText("Moment 3 of 3")).toBeTruthy();
  });

  it("renders the thinking state without throwing", async () => {
    const { getByLabelText } = await render(<MomentSphere currentMoment={2} totalMoments={3} state="thinking" />);
    expect(getByLabelText("Moment 2 of 3")).toBeTruthy();
  });
});
