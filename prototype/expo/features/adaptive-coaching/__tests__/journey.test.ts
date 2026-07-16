import { AE001_TOTAL_MOMENTS, momentForPhaseStatus } from "@/features/adaptive-coaching/journey";

describe("AE-001 journey", () => {
  it("has exactly 3 total moments — the real journey, not an invented 8", () => {
    expect(AE001_TOTAL_MOMENTS).toBe(3);
  });

  it("resolves the first moment for moment-one", () => {
    expect(momentForPhaseStatus("moment-one")).toBe(1);
  });

  it("resolves the middle moment for every Vision Canvas sub-phase", () => {
    expect(momentForPhaseStatus("generating-inspiration")).toBe(2);
    expect(momentForPhaseStatus("inspiration-vision")).toBe(2);
    expect(momentForPhaseStatus("reviewing")).toBe(2);
  });

  it("resolves the final moment for understanding-review", () => {
    expect(momentForPhaseStatus("understanding-review")).toBe(3);
  });

  it("restores moment 1 after back navigation to moment-one", () => {
    // Simulates goBackToMomentOne: whatever the prior phase was, the phase
    // status alone determines the moment number — no separate counter to
    // fall out of sync.
    expect(momentForPhaseStatus("reviewing")).toBe(2);
    expect(momentForPhaseStatus("moment-one")).toBe(1);
  });

  it("has no moment number for name (Step 0) or safety-hand-off", () => {
    expect(momentForPhaseStatus("name")).toBeNull();
    expect(momentForPhaseStatus("safety-hand-off")).toBeNull();
  });
});
