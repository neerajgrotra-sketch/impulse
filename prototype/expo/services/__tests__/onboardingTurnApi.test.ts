import {
  isHardStopResponse,
  OnboardingTurnApiError,
  requestCoachingBeat,
  requestInspiration,
  toCalmUserMessage,
} from "@/services/onboardingTurnApi";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("onboardingTurnApi", () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it("requestInspiration parses a successful response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "none", hard_stop: false },
        ranked_dimensions: [{ dimension: "Health & Energy", relevance: 0.9 }],
        thoughts: [{ id: "t1", dimension: "Health & Energy", text: "Someone who feels stronger" }],
        prompt_version: "v1",
        latency_ms: 842,
      })
    );

    const result = await requestInspiration({ firstName: "Maya", becomingResponse: "text" });
    expect(isHardStopResponse(result)).toBe(false);
    if (!isHardStopResponse(result)) {
      expect(result.rankedDimensions).toHaveLength(1);
      expect(result.thoughts).toHaveLength(1);
      expect(result.latencyMs).toBe(842);
    }
  });

  it("requestInspiration parses a hard-stop response distinctly", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "crisis", hard_stop: true, message: "please reach out to someone" },
      })
    );

    const result = await requestInspiration({ firstName: "Maya", becomingResponse: "text" });
    expect(isHardStopResponse(result)).toBe(true);
    if (isHardStopResponse(result)) {
      expect(result.safety.tier).toBe("crisis");
      expect(result.safety.message).toBe("please reach out to someone");
    }
  });

  it("requestCoachingBeat parses a successful response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "none", hard_stop: false },
        psychological_state: { observed: ["wants healthier habits"], inferred: [], unknown: ["primary obstacle"] },
        chosen_beat: "Clarification",
        chosen_move: "Question",
        message: "What does that look like for you?",
        rationale_code: "high_ambiguity",
        confidence: 0.78,
        move_downgraded: false,
        prompt_version: "v1",
        latency_ms: 910,
      })
    );

    const result = await requestCoachingBeat({
      firstName: "Maya",
      becomingResponse: "text",
      rankedDimensions: [],
      visionCanvas: [{ id: "1", text: "fragment", origin: "typed", edited: false }],
    });
    expect(isHardStopResponse(result)).toBe(false);
    if (!isHardStopResponse(result)) {
      expect(result.chosenBeat).toBe("Clarification");
      expect(result.chosenMove).toBe("Question");
      expect(result.psychologicalState.observed).toEqual(["wants healthier habits"]);
    }
  });

  it("throws a config error when Supabase env vars are missing", async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    await expect(requestInspiration({ firstName: "Maya", becomingResponse: "text" })).rejects.toMatchObject({
      kind: "config",
    });
  });

  it("throws a server error with the backend's message on a non-ok response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse({ error: "safety_check_failed: please try again" }, 503));
    await expect(requestInspiration({ firstName: "Maya", becomingResponse: "text" })).rejects.toMatchObject({
      kind: "server",
      message: "safety_check_failed: please try again",
    });
  });

  it("throws invalid-response when the body is missing required fields", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse({ safety: { tier: "none", hard_stop: false } }));
    await expect(requestInspiration({ firstName: "Maya", becomingResponse: "text" })).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });

  it("throws a network error when fetch rejects", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("connection reset"));
    await expect(requestInspiration({ firstName: "Maya", becomingResponse: "text" })).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("toCalmUserMessage never leaks the raw error message", () => {
    const err = new OnboardingTurnApiError("server", "a Deno stack fragment nobody should see");
    const message = toCalmUserMessage(err);
    expect(message).not.toContain("Deno stack fragment");
    expect(message.length).toBeGreaterThan(0);
  });
});
