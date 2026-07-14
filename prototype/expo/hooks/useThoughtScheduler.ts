import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { createThoughtSequence, type Thought } from "@/constants/thoughtLibrary";

export type ThoughtBubblePhase = "idle" | "entering" | "visible" | "exiting" | "pause";

/** Matches ThoughtBubble's own enter/exit animation durations. */
export const THOUGHT_ENTER_DURATION_MS = 450;
export const THOUGHT_EXIT_DURATION_MS = 350;
export const THOUGHT_INITIAL_DELAY_MS = 900;
export const THOUGHT_MIN_VISIBLE_MS = 2500;
export const THOUGHT_MAX_VISIBLE_MS = 4000;
export const THOUGHT_MIN_PAUSE_MS = 300;
export const THOUGHT_MAX_PAUSE_MS = 700;

// Local aliases so the implementation below reads cleanly.
const INITIAL_DELAY_MS = THOUGHT_INITIAL_DELAY_MS;
const MIN_VISIBLE_MS = THOUGHT_MIN_VISIBLE_MS;
const MAX_VISIBLE_MS = THOUGHT_MAX_VISIBLE_MS;
const MIN_PAUSE_MS = THOUGHT_MIN_PAUSE_MS;
const MAX_PAUSE_MS = THOUGHT_MAX_PAUSE_MS;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type UseThoughtSchedulerOptions = {
  /** True while the stream must not advance or show anything — recording,
   *  transcription processing, editing the vision card, the screen losing
   *  focus, or a thought already having been picked. */
  paused: boolean;
  /** When true, the first thought still appears (via ThoughtBubble's own
   *  simplified fade-only transition) but automatic rotation to the next
   *  thought is suspended — reconciles "pause while Reduce Motion is
   *  enabled, where appropriate" with still needing to surface a
   *  suggestion at all for a Reduce Motion user. */
  reduceMotion?: boolean;
  /** A separate accessibility need from Reduce Motion: a bubble that
   *  auto-exits after a few seconds isn't reliably reachable by
   *  VoiceOver/TalkBack swipe navigation. When true, holds the first
   *  thought indefinitely (same mechanism as `reduceMotion`, independent
   *  trigger) and announces it once via `AccessibilityInfo`. */
  screenReaderEnabled?: boolean;
  /** Backward-compatible injection point (adr/0013 Part 2 / decisions/0012):
   *  defaults to the existing curated `createThoughtSequence` so every
   *  current caller is byte-for-byte unchanged. AE-001 passes a source built
   *  from the backend's AI-generated thought pool instead — same shuffle/
   *  no-repeat contract, different content. Called each time the queue is
   *  empty, exactly like `createThoughtSequence()` was before. */
  thoughtSource?: () => Thought[];
};

type UseThoughtSchedulerResult = {
  thought: Thought | null;
  phase: ThoughtBubblePhase;
};

/**
 * Drives *when* a thought appears/changes via a timer chain — never a
 * per-frame state update. The actual opacity/translateY/scale animation
 * lives in `ThoughtBubble`, driven by shared values keyed off `phase`.
 */
export function useThoughtScheduler({
  paused,
  reduceMotion = false,
  screenReaderEnabled = false,
  thoughtSource = createThoughtSequence,
}: UseThoughtSchedulerOptions): UseThoughtSchedulerResult {
  const [thought, setThought] = useState<Thought | null>(null);
  const [phase, setPhase] = useState<ThoughtBubblePhase>("idle");

  const queueRef = useRef<Thought[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped every time the run loop is torn down (pause or unmount) so a
  // timer scheduled by a previous run can never fire into a new one.
  const generationRef = useRef(0);

  const clearPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (paused) {
      generationRef.current += 1;
      clearPending();
      setPhase("idle");
      return;
    }

    const generation = generationRef.current;
    const isStale = () => generationRef.current !== generation;

    function drawNextThought(): Thought | null {
      if (queueRef.current.length === 0) {
        queueRef.current = thoughtSource();
      }
      return queueRef.current.pop() ?? null;
    }

    function enter() {
      const next = drawNextThought();
      if (!next) return; // library exhausted this session — stream stops, no repeats
      setThought(next);
      setPhase("entering");
      if (screenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility(`New thought: ${next.text}`);
      }
      timeoutRef.current = setTimeout(() => {
        if (isStale()) return;
        setPhase("visible");
        holdVisible();
      }, THOUGHT_ENTER_DURATION_MS);
    }

    function holdVisible() {
      // Reduce Motion, or an active screen reader that needs time to reach
      // this element: hold the current thought indefinitely rather than
      // auto-rotating — the user can still tap it, speak, or type.
      if (reduceMotion || screenReaderEnabled) return;
      const visibleFor = randomBetween(MIN_VISIBLE_MS, MAX_VISIBLE_MS);
      timeoutRef.current = setTimeout(() => {
        if (isStale()) return;
        exit();
      }, visibleFor);
    }

    function exit() {
      setPhase("exiting");
      timeoutRef.current = setTimeout(() => {
        if (isStale()) return;
        pauseBeforeNext();
      }, THOUGHT_EXIT_DURATION_MS);
    }

    function pauseBeforeNext() {
      setPhase("pause");
      const pauseFor = randomBetween(MIN_PAUSE_MS, MAX_PAUSE_MS);
      timeoutRef.current = setTimeout(() => {
        if (isStale()) return;
        enter();
      }, pauseFor);
    }

    timeoutRef.current = setTimeout(() => {
      if (isStale()) return;
      enter();
    }, INITIAL_DELAY_MS);

    return () => {
      generationRef.current += 1;
      clearPending();
    };
  }, [paused, reduceMotion, screenReaderEnabled, thoughtSource, clearPending]);

  return { thought, phase };
}
