import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceCapture } from "./useVoiceCapture";

export type SpeechRecognitionStatus =
  | "idle"
  | "requestingPermission"
  | "listening"
  | "processing"
  | "completed"
  | "error";

export type SpeechRecognitionAdapter = {
  isAvailable: boolean;
  status: SpeechRecognitionStatus;
  partialTranscript: string;
  finalTranscript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
};

const PROCESSING_SETTLE_MS = 400;

/**
 * Adapts the app's existing on-device recognizer (`useVoiceCapture`, backed
 * by `expo-speech-recognition`) to the richer status/partial/final contract
 * the thought-stream screen's mic UI needs (Phase 6). Takes the single
 * `voiceCapture` instance `OnboardingCoordinator` already owns and passes
 * down, rather than creating a second native session — this only adds a
 * status/partial/final layer on top, it never touches the underlying hook
 * `ConsentScreen` and `ConversationScreen`'s reflection step also share. A
 * future server-side transcription backend only needs a new implementation
 * of this same `SpeechRecognitionAdapter` shape.
 */
export function useSpeechRecognitionAdapter(voiceCapture: VoiceCapture): SpeechRecognitionAdapter {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const permissionGrantedRef = useRef(false);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearProcessingTimeout = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!voiceCapture.isAvailable) {
      setError("Voice capture isn't available on this build.");
      setStatus("error");
      return;
    }

    clearProcessingTimeout();
    setError(null);
    setFinalTranscript("");

    if (!permissionGrantedRef.current) {
      setStatus("requestingPermission");
      const granted = await voiceCapture.requestPermission();
      if (!granted) {
        setError("Microphone or speech-recognition permission was denied.");
        setStatus("error");
        return;
      }
      permissionGrantedRef.current = true;
    }

    setStatus("listening");
    voiceCapture.start();
  }, [voiceCapture, clearProcessingTimeout]);

  const stop = useCallback(() => {
    if (status !== "listening") return;
    const captured = voiceCapture.transcript.trim();
    setStatus("processing");
    voiceCapture.stop();
    // No real server-side transcription pass exists yet — the on-device
    // recognizer already produced final text — but "processing" stays a
    // real, brief, observable state rather than an instant no-op, since the
    // thought scheduler and UI both key off it.
    processingTimeoutRef.current = setTimeout(() => {
      processingTimeoutRef.current = null;
      setFinalTranscript(captured);
      setStatus("completed");
    }, PROCESSING_SETTLE_MS);
  }, [status, voiceCapture]);

  const cancel = useCallback(() => {
    clearProcessingTimeout();
    voiceCapture.stop();
    setFinalTranscript("");
    setError(null);
    setStatus("idle");
  }, [voiceCapture, clearProcessingTimeout]);

  useEffect(() => clearProcessingTimeout, [clearProcessingTimeout]);

  return {
    isAvailable: voiceCapture.isAvailable,
    status,
    partialTranscript: voiceCapture.isRecording ? voiceCapture.transcript : "",
    finalTranscript,
    error,
    start,
    stop,
    cancel,
  };
}
