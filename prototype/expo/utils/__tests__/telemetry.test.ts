import { logTelemetryEvent } from "@/utils/telemetry";

describe("logTelemetryEvent", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs the event when __DEV__ is true", () => {
    logTelemetryEvent({ type: "time_to_first_interaction", ms: 1200 });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[AE-001 telemetry]",
      { type: "time_to_first_interaction", ms: 1200 }
    );
  });

  it("never logs raw text — every event shape is counts/enums/durations only", () => {
    logTelemetryEvent({ type: "coaching_beat_chosen", beat: "Clarification" });
    const loggedPayload = consoleSpy.mock.calls[0][1];
    const serialized = JSON.stringify(loggedPayload);
    // Mechanical proxy for "no raw text": every field value is either a
    // short enum-like string with no spaces, or a number.
    for (const value of Object.values(loggedPayload)) {
      if (typeof value === "string") {
        expect(value).not.toMatch(/\s/);
      }
    }
    expect(serialized.length).toBeLessThan(200);
  });

  it("does not log when __DEV__ is false", () => {
    const original = __DEV__;
    // @ts-expect-error — intentionally overriding the global test-only flag
    globalThis.__DEV__ = false;
    logTelemetryEvent({ type: "thoughts_selected", count: 3 });
    expect(consoleSpy).not.toHaveBeenCalled();
    // @ts-expect-error — restoring
    globalThis.__DEV__ = original;
  });
});
