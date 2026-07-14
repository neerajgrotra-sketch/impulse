import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
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
};

/**
 * Purely presentational — the scheduler (`useThoughtScheduler`) decides
 * *when* a thought enters/exits; this drives *how*, via shared values keyed
 * off `phase`, never a per-frame React state update. Mounts fresh (shared
 * values reset to their entering start values) each time the parent keys it
 * by `thought.id`.
 */
export function ThoughtBubble({ thought, phase, reduceMotion, onPress, style }: ThoughtBubbleProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = 0;
      scale.value = 1;
      opacity.value = withTiming(phase === "exiting" ? 0 : 1, { duration: 200 });
      return;
    }

    if (phase === "entering") {
      opacity.value = withTiming(1, {
        duration: THOUGHT_ENTER_DURATION_MS,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withSpring(0, { damping: 16, stiffness: 140 });
      scale.value = withSpring(1, { damping: 16, stiffness: 140 });
    } else if (phase === "exiting") {
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
    // "visible" needs no transition of its own — entering's spring already
    // settles at the resting values and holds there.
  }, [phase, reduceMotion, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.bubble, style, animatedStyle]}>
      <Pressable
        onPress={() => onPress(thought)}
        hitSlop={8}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`Use this thought: ${thought.text}`}
      >
        <Text style={[typography.body, styles.text]} numberOfLines={3}>
          {thought.text}
        </Text>
      </Pressable>
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
