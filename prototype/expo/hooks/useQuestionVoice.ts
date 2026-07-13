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
 */
export function useQuestionVoice(): QuestionVoice {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);

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
