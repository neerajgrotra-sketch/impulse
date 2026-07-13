import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";

export type QuestionVoice = {
  isSpeaking: boolean;
  /** Resolves once the utterance finishes, is stopped, or errors — mirrors
   *  QuestionVoicePlayer.speak's `await`-until-done contract. */
  speak: (text: string) => Promise<void>;
  stop: () => void;
};

/**
 * Speaks the coach's questions with the system voice — a direct port of
 * QuestionVoicePlayer.swift's AVSpeechSynthesizer approach via `expo-speech`
 * (Expo Go compatible, zero EAS requirement). Same documented Milestone-1
 * simplification as the Swift source: docs/investor-prototype.md §6 calls
 * for pre-generated premium neural TTS ("ChatGPT Voice" quality bar) as a
 * fast-follow, not a blocker — swapping this hook for one that plays
 * pre-rendered audio files is a contained change, and nothing else in the
 * app depends on which one is used.
 *
 * Short of that fast-follow, `Speech.speak` defaults to the OS's lowest
 * "compact" quality voice if no `voice` identifier is given — noticeably
 * more mechanical than iOS's own "Enhanced" quality voices, when the device
 * has one downloaded. We look one up once and prefer it; devices without an
 * Enhanced voice downloaded silently keep the previous default behavior.
 */
export function useQuestionVoice(): QuestionVoice {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);
  const voiceIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        if (cancelled) return;
        const enhanced = voices.find(
          (voice) => voice.language.startsWith("en") && voice.quality === Speech.VoiceQuality.Enhanced
        );
        voiceIdRef.current = enhanced?.identifier;
      })
      .catch(() => {
        // Voice listing isn't available on every platform — fall back to
        // the OS default, same as before this lookup existed.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(() => {
    setIsSpeaking(false);
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      Speech.stop();
      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        setIsSpeaking(true);
        Speech.speak(text, {
          language: "en-US",
          voice: voiceIdRef.current,
          pitch: 0.97,
          rate: 0.95,
          onDone: finish,
          onStopped: finish,
          onError: finish,
        });
      });
    },
    [finish]
  );

  const stop = useCallback(() => {
    Speech.stop();
    finish();
  }, [finish]);

  useEffect(
    () => () => {
      Speech.stop();
    },
    []
  );

  return { isSpeaking, speak, stop };
}
