import { render } from "@testing-library/react-native";
import { MomentSphere } from "@/components/MomentSphere";

describe("MomentSphere", () => {
  it("renders the current moment number as the dominant element, with a small 'Moment' caption", async () => {
    const { getByText } = await render(<MomentSphere currentMoment={2} totalMoments={3} state="idle" />);
    expect(getByText("2")).toBeTruthy();
    expect(getByText("Moment")).toBeTruthy();
  });

  it("never renders the total as 'X of Y' text — only in the accessibility label", async () => {
    const { queryByText } = await render(<MomentSphere currentMoment={2} totalMoments={3} state="idle" />);
    expect(queryByText("2 of 3")).toBeNull();
    expect(queryByText(/of 3/)).toBeNull();
  });

  it("exposes exactly one VoiceOver-facing accessibility label", async () => {
    const { getByLabelText } = await render(<MomentSphere currentMoment={2} totalMoments={3} state="idle" />);
    expect(getByLabelText("Moment 2 of 3")).toBeTruthy();
  });

  it("falls back to a totals-free accessibility label when totalMoments is omitted (an open-ended adaptive journey)", async () => {
    const { getByLabelText, getByText } = await render(<MomentSphere currentMoment={4} state="idle" />);
    expect(getByLabelText("Moment 4")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
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

  it("accepts an integer well beyond the current 3-Moment journey without throwing — the sphere must not assume a fixed total", async () => {
    const { getByText } = await render(<MomentSphere currentMoment={7} totalMoments={8} state="idle" />);
    expect(getByText("7")).toBeTruthy();
  });
});
