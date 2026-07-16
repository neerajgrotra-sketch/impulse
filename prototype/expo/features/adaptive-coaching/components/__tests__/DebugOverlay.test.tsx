import { fireEvent, render } from "@testing-library/react-native";
import { DebugOverlay } from "@/features/adaptive-coaching/components/DebugOverlay";
import { useAdaptiveCoachingStore } from "@/stores/adaptiveCoachingStore";

describe("DebugOverlay", () => {
  const originalEnv = process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY;
  const originalDev = __DEV__;

  afterEach(() => {
    process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY = originalEnv;
    // @ts-expect-error — restoring the global test-only flag
    globalThis.__DEV__ = originalDev;
    useAdaptiveCoachingStore.getState().reset();
  });

  it("renders null when __DEV__ is false, regardless of the env flag", async () => {
    // @ts-expect-error test-only override
    globalThis.__DEV__ = false;
    process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY = "true";
    const { toJSON } = await render(<DebugOverlay />);
    expect(toJSON()).toBeNull();
  });

  it("renders null when the env flag is not exactly 'true', even if __DEV__ is true", async () => {
    // @ts-expect-error test-only override
    globalThis.__DEV__ = true;
    process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY = "false";
    const { toJSON } = await render(<DebugOverlay />);
    expect(toJSON()).toBeNull();
  });

  it("renders the collapsed tab when both gates are open", async () => {
    // @ts-expect-error test-only override
    globalThis.__DEV__ = true;
    process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY = "true";
    const { getByLabelText } = await render(<DebugOverlay />);
    expect(getByLabelText("Expand debug overlay")).toBeTruthy();
  });

  it("expands to show the store's current fields when tapped", async () => {
    // @ts-expect-error test-only override
    globalThis.__DEV__ = true;
    process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY = "true";
    useAdaptiveCoachingStore.getState().inspirationReceived(
      {
        rankedDimensions: [
          { dimension: "Health & Energy", relevance: 0.91 },
          { dimension: "Relationships", relevance: 0.83 },
        ],
        thoughts: [],
      },
      { lastSafetyTier: "none", lastLatencyMs: 842, lastRawPayload: { ok: true }, lastRequestId: "req-abc" }
    );

    const { getByLabelText, getByText } = await render(<DebugOverlay />);
    await fireEvent.press(getByLabelText("Expand debug overlay"));

    expect(getByText(/Health & Energy \(0.91\)/)).toBeTruthy();
    expect(getByText(/LLM: 842ms/)).toBeTruthy();
    expect(getByText("req-abc")).toBeTruthy();
    expect(getByText(/Tier: none/)).toBeTruthy();
  });
});
