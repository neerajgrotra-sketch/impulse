import { useCallback, useEffect, useRef, useState } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type { ExpoSpeechRecognitionResultEvent } from "expo-speech-recognition";

/**
 * On-device speech-to-text, mirroring SpeechRecognizer.swift's SFSpeechRecognizer
 * approach — but via `expo-speech-recognition`, a custom native module that is
 * NOT present in the Expo Go binary. Its module import calls
 * `requireNativeModule()` at the top of the file, which throws synchronously
 * if the native module isn't linked — so it is never statically imported
 * anywhere in this app. It is only ever reached through the dynamic
 * `import()` below, guarded by an Expo-Go check, with a `catch` as a second
 * safety net for a Development Build that hasn't rebuilt after this package
 * was added. Either branch leaves `isAvailable: false`, and the caller
 * (ConversationScreen) falls back to typed input — the flow never crashes,
 * per the mission's "the demo must always remain runnable."
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type SpeechModule = typeof import("expo-speech-recognition");

export type VoiceCapture = {
  /** Whether on-device recognition can plausibly be attempted on this build/device. */
  isAvailable: boolean;
  isRecording: boolean;
  transcript: string;
  /** Requests mic + speech-recognition permission — call once, from Consent. */
  requestPermission: () => Promise<boolean>;
  start: () => void;
  stop: () => void;
};

export function useVoiceCapture(): VoiceCapture {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const moduleRef = useRef<SpeechModule | null>(null);
  const subscriptionsRef = useRef<{ remove: () => void }[]>([]);

  useEffect(() => {
    if (isExpoGo) return;

    let cancelled = false;
    import("expo-speech-recognition")
      .then((mod) => {
        if (cancelled) return;
        if (mod.ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
          moduleRef.current = mod;
          setIsAvailable(true);
        }
      })
      .catch(() => {
        // Native module isn't linked in this build — typed fallback takes over.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const teardownListeners = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => sub.remove());
    subscriptionsRef.current = [];
  }, []);

  const stop = useCallback(() => {
    moduleRef.current?.ExpoSpeechRecognitionModule.stop();
    teardownListeners();
    setIsRecording(false);
    // Clearing here (not just in `start`) matters: without it, a question's
    // final transcript lingers in state after `stop()` until the next
    // `start()` runs — which happens only after the next question's TTS
    // finishes. In that window "Done" would wrongly reappear (canFinish
    // reads transcript length) and, if tapped, resubmit the *previous*
    // answer as the new question's answer.
    setTranscript("");
  }, [teardownListeners]);

  const requestPermission = useCallback(async () => {
    const mod = moduleRef.current;
    if (!mod) return false;
    const result = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  }, []);

  const start = useCallback(() => {
    const mod = moduleRef.current;
    if (!mod) return;

    teardownListeners();
    setTranscript("");

    subscriptionsRef.current = [
      mod.ExpoSpeechRecognitionModule.addListener(
        "result",
        (event: ExpoSpeechRecognitionResultEvent) => {
          const text = event.results[0]?.transcript;
          if (text) setTranscript(text);
        }
      ),
      mod.ExpoSpeechRecognitionModule.addListener("end", () => setIsRecording(false)),
      mod.ExpoSpeechRecognitionModule.addListener("error", () => setIsRecording(false)),
    ];

    try {
      mod.ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
      setIsRecording(true);
    } catch {
      // Unverified on-device (see the file header) — if the native call
      // throws synchronously rather than emitting an `error` event, fail
      // into the same "not recording" state instead of crashing the screen.
      teardownListeners();
      setIsRecording(false);
    }
  }, [teardownListeners]);

  useEffect(() => () => stop(), [stop]);

  return { isAvailable, isRecording, transcript, requestPermission, start, stop };
}
