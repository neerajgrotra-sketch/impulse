import { act, renderHook } from "@testing-library/react-native";
import { useSpeechRecognitionAdapter } from "@/hooks/useSpeechRecognitionAdapter";
import type { VoiceCapture } from "@/hooks/useVoiceCapture";

function buildVoiceCapture(overrides: Partial<VoiceCapture> = {}): VoiceCapture {
  return {
    isAvailable: true,
    isRecording: false,
    transcript: "",
    requestPermission: jest.fn().mockResolvedValue(true),
    start: jest.fn(),
    stop: jest.fn(),
    ...overrides,
  };
}

describe("useSpeechRecognitionAdapter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("cancel() discards the transcript and resets to idle without ever reaching completed", async () => {
    const voiceCapture = buildVoiceCapture({ isRecording: true, transcript: "something I didn't mean to say" });
    const { result } = await renderHook((vc: VoiceCapture) => useSpeechRecognitionAdapter(vc), {
      initialProps: voiceCapture,
    });

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("listening");

    await act(async () => {
      result.current.cancel();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.finalTranscript).toBe("");
    expect(result.current.error).toBeNull();
    expect(voiceCapture.stop).toHaveBeenCalled();

    // Cancelling must never let the in-flight recording surface as a
    // confirmed answer later — advancing time should not flip to completed.
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.finalTranscript).toBe("");
  });

  it("stop() finalizes the transcript captured at that moment", async () => {
    const voiceCapture = buildVoiceCapture({ isRecording: true, transcript: "someone who follows through" });
    const { result } = await renderHook((vc: VoiceCapture) => useSpeechRecognitionAdapter(vc), {
      initialProps: voiceCapture,
    });

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("listening");

    await act(async () => {
      result.current.stop();
    });
    expect(result.current.status).toBe("processing");

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.finalTranscript).toBe("someone who follows through");
  });
});
