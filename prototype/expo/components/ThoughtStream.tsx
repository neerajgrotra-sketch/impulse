import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Dimensions, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import type { Thought } from "@/constants/thoughtLibrary";
import { useThoughtScheduler, type ThoughtBubblePhase } from "@/hooks/useThoughtScheduler";
import { ThoughtBubble } from "./ThoughtBubble";

const MIN_WIDTH = 160;
const MIN_WIDTH_RATIO = 0.55;
const MAX_WIDTH_RATIO = 0.82;

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
};

/**
 * Rolls its random width/position exactly once per mount, via a `useState`
 * lazy initializer — the one place React's purity rules allow an impure
 * call (`Math.random`), since it only ever runs once for this component
 * instance. Remounting this (via the `key={thought.id}` the parent uses)
 * is what gives every new thought a fresh roll.
 */
function PositionedThoughtBubble({
  thought,
  phase,
  reduceMotion,
  containerWidth,
  onPress,
}: PositionedThoughtBubbleProps) {
  const [layout] = useState(() => randomLayout(containerWidth));

  return (
    <ThoughtBubble
      thought={thought}
      phase={phase}
      reduceMotion={reduceMotion}
      onPress={onPress}
      style={{ width: layout.width, marginLeft: layout.marginLeft }}
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
  /** Fixed-height band the stream occupies — kept clear of the title, orb,
   *  mic, and card by the parent screen's layout, never by this component
   *  reaching outside it. */
  height?: number;
};

/**
 * One animated thought bubble at a time, randomized in width and horizontal
 * position within this component's own measured bounds so it never spills
 * past the screen edge. Owns the scheduler; the parent only supplies
 * `paused` and receives taps via `onSelectThought`.
 */
export function ThoughtStream({
  paused,
  reduceMotion,
  screenReaderEnabled = false,
  onSelectThought,
  height = 96,
}: ThoughtStreamProps) {
  const { thought, phase } = useThoughtScheduler({ paused, reduceMotion, screenReaderEnabled });
  // Seeded from the window width so the first thought doesn't wait on a
  // real `onLayout` measurement (which never fires in some test/renderer
  // environments); refined the moment this view actually measures itself.
  const [containerWidth, setContainerWidth] = useState(() => Dimensions.get("window").width);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  function handlePress(selected: Thought) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectThought(selected);
  }

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
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
    justifyContent: "center",
  },
});
