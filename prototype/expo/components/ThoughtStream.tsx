import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Dimensions, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import type { Thought } from "@/constants/thoughtLibrary";
import { THOUGHT_EXIT_DURATION_MS, useThoughtScheduler, type ThoughtBubblePhase } from "@/hooks/useThoughtScheduler";
import { ThoughtBubble } from "./ThoughtBubble";

const MIN_WIDTH = 160;
const MIN_WIDTH_RATIO = 0.55;
const MAX_WIDTH_RATIO = 0.82;
// How often a thought is allowed to still be fading out while the next one
// begins fading in — probabilistic and deliberately not scheduled, so the
// overlap itself never becomes its own predictable pattern.
const OVERLAP_PROBABILITY = 0.3;

function randomLayout(containerWidth: number) {
  const maxWidth = Math.max(MIN_WIDTH, containerWidth * MAX_WIDTH_RATIO);
  const minWidth = Math.min(maxWidth, containerWidth * MIN_WIDTH_RATIO);
  const width = minWidth + Math.random() * (maxWidth - minWidth);
  const marginLeft = Math.random() * Math.max(0, containerWidth - width);
  return { width, marginLeft };
}

type PositionedThoughtBubbleProps = {
  thought: Thought;
  phase: ThoughtBubblePhase;
  reduceMotion: boolean;
  containerWidth: number;
  onPress: (thought: Thought) => void;
  /** False for the brief "ghost" echo of a just-replaced thought during an
   *  occasional overlap — a visual memory, not a live control. */
  interactive?: boolean;
};

/**
 * Rolls its random width/position exactly once per mount, via a `useState`
 * lazy initializer — the one place React's purity rules allow an impure
 * call (`Math.random`), since it only ever runs once for this component
 * instance. Remounting this (via the `key` the parent uses) is what gives
 * every new thought — and every ghost echo — a fresh roll.
 */
function PositionedThoughtBubble({
  thought,
  phase,
  reduceMotion,
  containerWidth,
  onPress,
  interactive = true,
}: PositionedThoughtBubbleProps) {
  const [layout] = useState(() => randomLayout(containerWidth));

  return (
    <ThoughtBubble
      thought={thought}
      phase={phase}
      reduceMotion={reduceMotion}
      onPress={onPress}
      interactive={interactive}
      style={[styles.positioned, { width: layout.width, left: layout.marginLeft }]}
    />
  );
}

type ThoughtStreamProps = {
  /** True while the stream must sit idle — recording, processing, editing
   *  the vision card, unfocused, or a thought already picked. */
  paused: boolean;
  reduceMotion: boolean;
  /** A separate signal from `reduceMotion` — see `useThoughtScheduler`. */
  screenReaderEnabled?: boolean;
  onSelectThought: (thought: Thought) => void;
  /** Fired once each time a new thought begins entering — lets the parent
   *  give the orb a tiny synced pulse without this component knowing
   *  anything about the orb. Never fired for the non-interactive "ghost"
   *  echo used for the occasional overlap effect. */
  onThoughtAppear?: () => void;
  /** Fixed-height band the stream occupies — kept clear of the title, orb,
   *  mic, and card by the parent screen's layout, never by this component
   *  reaching outside it. */
  height?: number;
  /** Overrides the default curated thought library — passed straight through
   *  to `useThoughtScheduler`. AE-001's `VisionCanvasScreen` passes a source
   *  built from the backend's AI-generated thought pool instead. */
  thoughtSource?: () => Thought[];
};

/**
 * One primary animated thought bubble at a time (plus, occasionally, a
 * brief non-interactive "ghost" of the one it just replaced — see
 * `OVERLAP_PROBABILITY`), randomized in width and horizontal position
 * within this component's own measured bounds so neither ever spills past
 * the screen edge. Owns the scheduler; the parent only supplies `paused`
 * and receives taps via `onSelectThought`.
 */
export function ThoughtStream({
  paused,
  reduceMotion,
  screenReaderEnabled = false,
  onSelectThought,
  onThoughtAppear,
  height = 96,
  thoughtSource,
}: ThoughtStreamProps) {
  // `thoughtSource` is `undefined` when the caller doesn't override it, and
  // `useThoughtScheduler`'s own default parameter (`= createThoughtSequence`)
  // applies to an explicit `undefined` just as it would to an omitted key.
  const { thought, phase } = useThoughtScheduler({ paused, reduceMotion, screenReaderEnabled, thoughtSource });
  // Seeded from the window width so the first thought doesn't wait on a
  // real `onLayout` measurement (which never fires in some test/renderer
  // environments); refined the moment this view actually measures itself.
  const [containerWidth, setContainerWidth] = useState(() => Dimensions.get("window").width);
  const [ghost, setGhost] = useState<Thought | null>(null);

  const prevThoughtRef = useRef<Thought | null>(null);
  const announcedIdRef = useRef<string | null>(null);
  const ghostTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Occasional overlap: when the scheduler moves on to a new thought, let
  // the one it just replaced keep fading out on top of the new one's
  // fade-in — two thoughts breathing past each other, rather than a strict
  // exit-then-enter carousel slot. Never under Reduce Motion. Paused states
  // (recording, editing, backgrounded) simply aren't rendered below, so a
  // ghost timer that outlives a pause just resolves to nothing visible.
  useEffect(() => {
    const previous = prevThoughtRef.current;
    if (thought && previous && previous.id !== thought.id && phase === "entering") {
      if (!reduceMotion && Math.random() < OVERLAP_PROBABILITY) {
        setGhost(previous);
        if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
        ghostTimeoutRef.current = setTimeout(() => setGhost(null), THOUGHT_EXIT_DURATION_MS);
      }
      if (!reduceMotion && announcedIdRef.current !== thought.id) {
        announcedIdRef.current = thought.id;
        onThoughtAppear?.();
      }
    } else if (thought && !previous && phase === "entering" && !reduceMotion) {
      announcedIdRef.current = thought.id;
      onThoughtAppear?.();
    }
    prevThoughtRef.current = thought;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thought, phase, reduceMotion]);

  useEffect(
    () => () => {
      if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
    },
    []
  );

  function handlePress(selected: Thought) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectThought(selected);
  }

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {ghost && !paused && (
        <PositionedThoughtBubble
          key={`ghost-${ghost.id}`}
          thought={ghost}
          phase="exiting"
          reduceMotion={reduceMotion}
          containerWidth={containerWidth}
          onPress={() => {}}
          interactive={false}
        />
      )}

      {thought && (phase === "entering" || phase === "visible" || phase === "exiting") && (
        <PositionedThoughtBubble
          key={thought.id}
          thought={thought}
          phase={phase}
          reduceMotion={reduceMotion}
          containerWidth={containerWidth}
          onPress={handlePress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  positioned: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
