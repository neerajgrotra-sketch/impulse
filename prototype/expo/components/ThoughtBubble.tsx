import { useEffect, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Thought } from "@/constants/thoughtLibrary";
import {
  THOUGHT_ENTER_DURATION_MS,
  THOUGHT_EXIT_DURATION_MS,
  type ThoughtBubblePhase,
} from "@/hooks/useThoughtScheduler";
import { colors, radius, spacing, typography } from "@/theme";

type ThoughtBubbleProps = {
  thought: Thought;
  phase: ThoughtBubblePhase;
  reduceMotion: boolean;
  onPress: (thought: Thought) => void;
  style?: StyleProp<ViewStyle>;
  /** False for the brief "ghost" echo of a just-replaced thought during an
   *  occasional overlap (see `ThoughtStream`) — a visual memory, not a live
   *  control, so it skips the Pressable/accessibility wiring entirely. */
  interactive?: boolean;
};

function randomJitter(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Purely presentational — the scheduler (`useThoughtScheduler`) decides
 * *when* a thought enters/exits; this drives *how*, via shared values keyed
 * off `phase`, never a per-frame React state update. Mounts fresh (shared
 * values reset to their entering start values) each time the parent keys it
 * by `thought.id`.
 *
 * "Memories surfacing," not a carousel slot: each bubble's fade-in jitters
 * slightly (never a metronomic fixed duration) and drifts slowly and
 * continuously for its entire visible lifetime — a small, slow, per-bubble
 * randomized wander, not a static hold.
 */
export function ThoughtBubble({
  thought,
  phase,
  reduceMotion,
  onPress,
  style,
  interactive = true,
}: ThoughtBubbleProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(0.96);
  const driftX = useSharedValue(0);
  const driftY = useSharedValue(0);
  const [enterDurationMs] = useState(() => Math.round(randomJitter(THOUGHT_ENTER_DURATION_MS - 30, THOUGHT_ENTER_DURATION_MS + 110)));

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = 0;
      scale.value = 1;
      opacity.value = withTiming(phase === "exiting" ? 0 : 1, { duration: 200 });
      cancelAnimation(driftX);
      cancelAnimation(driftY);
      return;
    }

    if (phase === "entering") {
      opacity.value = withTiming(1, {
        duration: enterDurationMs,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withSpring(0, { damping: 16, stiffness: 140 });
      scale.value = withSpring(1, { damping: 16, stiffness: 140 });
    } else if (phase === "visible") {
      // A slow, continuous, independently-randomized wander for as long as
      // the thought is held — this is what separates "a memory surfacing"
      // from "a slide in a carousel."
      const dx = randomJitter(6, 14) * (Math.random() < 0.5 ? -1 : 1);
      const dy = randomJitter(6, 14) * (Math.random() < 0.5 ? -1 : 1);
      driftX.value = withRepeat(
        withTiming(dx, { duration: randomJitter(3000, 5000), easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      driftY.value = withRepeat(
        withTiming(dy, { duration: randomJitter(3400, 5400), easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (phase === "exiting") {
      cancelAnimation(driftX);
      cancelAnimation(driftY);
      opacity.value = withTiming(0, {
        duration: THOUGHT_EXIT_DURATION_MS,
        easing: Easing.in(Easing.ease),
      });
      translateY.value = withTiming(-14, {
        duration: THOUGHT_EXIT_DURATION_MS,
        easing: Easing.in(Easing.ease),
      });
      scale.value = withTiming(0.98, {
        duration: THOUGHT_EXIT_DURATION_MS,
        easing: Easing.in(Easing.ease),
      });
    }

    return () => {
      cancelAnimation(driftX);
      cancelAnimation(driftY);
    };
  }, [phase, reduceMotion, opacity, translateY, scale, driftX, driftY, enterDurationMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: driftX.value },
      { translateY: translateY.value + driftY.value },
      { scale: scale.value },
    ],
  }));

  const content = (
    <Text style={[typography.body, styles.text]} numberOfLines={3}>
      {thought.text}
    </Text>
  );

  return (
    <Animated.View style={[styles.bubble, style, animatedStyle]} pointerEvents={interactive ? "auto" : "none"}>
      {interactive ? (
        <Pressable
          onPress={() => onPress(thought)}
          hitSlop={8}
          style={styles.pressable}
          accessibilityRole="button"
          accessibilityLabel={`Use this thought: ${thought.text}`}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.pressable}>{content}</View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
    borderColor: colors.overlay.hairline,
    borderRadius: radius.lg,
    backgroundColor: colors.overlay.scrim,
  },
  pressable: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    textAlign: "center",
    color: colors.ink,
  },
});
