import {
  isHardStopResponse,
  OnboardingTurnApiError,
  requestCoachingBeat,
  requestFinalSynthesis,
  requestInspiration,
  requestNextQuestion,
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
        thoughts: [{ id: "t1", dimension: "Health & Energy", text: "Someone who feels stronger", source: "ai" }],
        request_id: "req-123",
        prompt_version: "v2",
        latency_ms: 842,
        retry_count: 0,
      })
    );

    const result = await requestInspiration({ firstName: "Maya", becomingResponse: "text" });
    expect(isHardStopResponse(result)).toBe(false);
    if (!isHardStopResponse(result)) {
      expect(result.rankedDimensions).toHaveLength(1);
      expect(result.thoughts).toHaveLength(1);
      expect(result.latencyMs).toBe(842);
      expect(result.requestId).toBe("req-123");
      expect(result.retryCount).toBe(0);
    }
  });

  it("requestInspiration maps a 504 (server-side generation timeout) to kind 'timeout'", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ error: "inspiration generation failed: exceeded the 8000ms total budget", request_id: "req-504" }, 504)
    );
    await expect(requestInspiration({ firstName: "Maya", becomingResponse: "text" })).rejects.toMatchObject({
      kind: "timeout",
    });
  });

  it("requestInspiration parses a hard-stop response distinctly", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "crisis", hard_stop: true, message: "please reach out to someone" },
        request_id: "req-crisis",
      })
    );

    const result = await requestInspiration({ firstName: "Maya", becomingResponse: "text" });
    expect(isHardStopResponse(result)).toBe(true);
    if (isHardStopResponse(result)) {
      expect(result.safety.tier).toBe("crisis");
      expect(result.safety.message).toBe("please reach out to someone");
      expect(result.requestId).toBe("req-crisis");
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
      visionCanvas: [{ id: "1", text: "fragment", origin: "typed", edited: false, source: "user" }],
    });
    expect(isHardStopResponse(result)).toBe(false);
    if (!isHardStopResponse(result)) {
      expect(result.chosenBeat).toBe("Clarification");
      expect(result.chosenMove).toBe("Question");
      expect(result.psychologicalState.observed).toEqual(["wants healthier habits"]);
    }
  });

  it("requestFinalSynthesis parses a successful structured understanding review", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "none", hard_stop: false },
        understanding: {
          headline: "Excellence on your own terms",
          core_aspiration: "You want to become exceptional without letting comparison define you.",
          interpretation: "You appear to value mastery and disciplined daily progress.",
          identity_statement: "Someone who builds mastery patiently.",
          emerging_themes: ["Self-defined success", "Disciplined mastery"],
          uncertainties: ["The specific area of life where you want to become exceptional is still unclear."],
          confidence: "medium",
        },
        request_id: "req-synth",
        prompt_version: "final-synthesis-v1",
        latency_ms: 1200,
      })
    );

    const result = await requestFinalSynthesis({
      firstName: "Maya",
      becomingResponse: "I wanna be very best",
      visionCanvas: [{ id: "1", text: "Someone chasing the edge of their own potential", origin: "thought_tap", edited: false, source: "ai" }],
    });
    expect(isHardStopResponse(result)).toBe(false);
    if (!isHardStopResponse(result)) {
      expect(result.understanding.headline).toBe("Excellence on your own terms");
      expect(result.understanding.confidence).toBe("medium");
      expect(result.understanding.emergingThemes).toHaveLength(2);
      expect(result.requestId).toBe("req-synth");
    }
  });

  it("requestFinalSynthesis throws invalid-response rather than surfacing a malformed/partial review", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "none", hard_stop: false },
        understanding: {
          headline: "Excellence on your own terms",
          // interpretation missing — a malformed response, never silently rendered
          identity_statement: "Someone who builds mastery patiently.",
          emerging_themes: [],
          uncertainties: [],
          confidence: "medium",
        },
        request_id: "req-bad",
        prompt_version: "final-synthesis-v1",
        latency_ms: 900,
      })
    );

    await expect(
      requestFinalSynthesis({
        firstName: "Maya",
        becomingResponse: "text",
        visionCanvas: [{ id: "1", text: "fragment", origin: "typed", edited: false, source: "user" }],
      })
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("requestFinalSynthesis parses a hard-stop response distinctly", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "crisis", hard_stop: true, message: "please reach out to someone" },
        request_id: "req-crisis",
      })
    );

    const result = await requestFinalSynthesis({
      firstName: "Maya",
      becomingResponse: "text",
      visionCanvas: [{ id: "1", text: "fragment", origin: "typed", edited: false, source: "user" }],
    });
    expect(isHardStopResponse(result)).toBe(true);
    if (isHardStopResponse(result)) {
      expect(result.safety.tier).toBe("crisis");
    }
  });

  it("requestNextQuestion parses a successful next-question response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "none", hard_stop: false },
        psychological_state: { observed: ["wants to be healthier"], inferred: [], unknown: ["what success feels like"] },
        question: "When you imagine succeeding, what excites you the most?",
        options: ["Feeling confident again", "Having more energy", "Being there for my family"],
        allow_free_text: true,
        done: false,
        done_reason: "",
        request_id: "req-adaptive-1",
        prompt_version: "adaptive-question-v1",
        latency_ms: 640,
      })
    );

    const result = await requestNextQuestion({
      firstName: "Maya",
      becomingResponse: "I want to lose weight and be healthy",
      history: [],
    });
    expect(isHardStopResponse(result)).toBe(false);
    if (!isHardStopResponse(result)) {
      expect(result.question).toBe("When you imagine succeeding, what excites you the most?");
      expect(result.options).toHaveLength(3);
      expect(result.done).toBe(false);
      expect(result.psychologicalState.unknown).toEqual(["what success feels like"]);
    }
  });

  it("requestNextQuestion parses a done:true response with no further question", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "none", hard_stop: false },
        psychological_state: { observed: [], inferred: [], unknown: [] },
        question: "",
        options: [],
        allow_free_text: false,
        done: true,
        done_reason: "reached the turn ceiling",
        request_id: "req-adaptive-2",
        prompt_version: "adaptive-question-v1",
        latency_ms: 0,
      })
    );

    const result = await requestNextQuestion({ firstName: "Maya", becomingResponse: "text", history: [] });
    expect(isHardStopResponse(result)).toBe(false);
    if (!isHardStopResponse(result)) {
      expect(result.done).toBe(true);
      expect(result.doneReason).toBe("reached the turn ceiling");
    }
  });

  it("requestNextQuestion parses a hard-stop response distinctly", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        safety: { tier: "crisis", hard_stop: true, message: "please reach out to someone" },
        request_id: "req-crisis",
      })
    );

    const result = await requestNextQuestion({ firstName: "Maya", becomingResponse: "text", history: [] });
    expect(isHardStopResponse(result)).toBe(true);
    if (isHardStopResponse(result)) {
      expect(result.safety.tier).toBe("crisis");
    }
  });

  it("requestNextQuestion maps an overloaded error_category to kind 'overloaded', distinct from a generic server error", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ error: "adaptive-question generation failed: 529 Overloaded", request_id: "req-ovl", error_category: "overloaded" }, 502)
    );
    await expect(requestNextQuestion({ firstName: "Maya", becomingResponse: "text", history: [] })).rejects.toMatchObject({
      kind: "overloaded",
    });
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
