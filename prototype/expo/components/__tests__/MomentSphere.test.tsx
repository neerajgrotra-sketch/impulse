import { render } from "@testing-library/react-native";
import { MomentSphere } from "@/components/MomentSphere";

describe("MomentSphere", () => {
  it("renders only the bare step number — no 'Moment' word anywhere", async () => {
    const { getByText, queryByText } = await render(<MomentSphere currentMoment={2} state="idle" />);
    expect(getByText("2")).toBeTruthy();
    expect(queryByText("Moment")).toBeNull();
    expect(queryByText(/Moment/)).toBeNull();
  });

  it("never renders a total or 'X of Y' text anywhere, visually or otherwise", async () => {
    const { queryByText } = await render(<MomentSphere currentMoment={2} state="idle" />);
    expect(queryByText("2 of 3")).toBeNull();
    expect(queryByText(/of \d/)).toBeNull();
  });

  it("exposes a 'Journey step N' accessibility label, with no total in it", async () => {
    const { getByLabelText } = await render(<MomentSphere currentMoment={2} state="idle" />);
    expect(getByLabelText("Journey step 2")).toBeTruthy();
  });

  it("accepts any positive integer, including one well beyond the current 3-step journey, without throwing", async () => {
    const { getByText, getByLabelText } = await render(<MomentSphere currentMoment={7} state="idle" />);
    expect(getByText("7")).toBeTruthy();
    expect(getByLabelText("Journey step 7")).toBeTruthy();
  });

  it("renders the complete and thinking states without throwing", async () => {
    const complete = await render(<MomentSphere currentMoment={3} state="complete" />);
    expect(complete.getByLabelText("Journey step 3")).toBeTruthy();
    const thinking = await render(<MomentSphere currentMoment={2} state="thinking" />);
    expect(thinking.getByLabelText("Journey step 2")).toBeTruthy();
  });

  it("scales the numeral within the 48-64pt range depending on sphere size, never smaller or larger", async () => {
    const small = await render(<MomentSphere currentMoment={3} state="idle" size={88} />);
    const smallText = small.getByText("3");
    const flatSmall = [smallText.props.style].flat();
    const smallFontSize = flatSmall.find((s) => s && typeof s.fontSize === "number")?.fontSize;
    expect(smallFontSize).toBeGreaterThanOrEqual(48);
    expect(smallFontSize).toBeLessThanOrEqual(64);

    const large = await render(<MomentSphere currentMoment={1} state="idle" size={140} />);
    const largeText = large.getByText("1");
    const flatLarge = [largeText.props.style].flat();
    const largeFontSize = flatLarge.find((s) => s && typeof s.fontSize === "number")?.fontSize;
    expect(largeFontSize).toBeGreaterThanOrEqual(48);
    expect(largeFontSize).toBeLessThanOrEqual(64);
  });
});
