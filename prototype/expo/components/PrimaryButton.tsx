import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing, typography } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  /** Stretches to fill its container — the Consent screen's "Agree & begin". */
  fullWidth?: boolean;
  /** Shows a spinner in place of the label and blocks further presses — Consent's permission request. */
  loading?: boolean;
  disabled?: boolean;
};

/**
 * The white capsule button — the one recurring call-to-action shape across
 * the Swift prototype's screens (Begin, Agree & begin, Done, ...).
 */
export function PrimaryButton({ label, onPress, fullWidth, loading, disabled }: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = Boolean(disabled || loading);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        if (!isDisabled) scale.value = withTiming(0.96, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={[styles.button, fullWidth && styles.fullWidth, isDisabled && styles.disabled, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <View style={styles.content}>
        {loading && <ActivityIndicator color={colors.onLight} size="small" />}
        <Text style={styles.label}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  label: {
    ...typography.headline,
    color: colors.onLight,
  },
});
