import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, spacing, typography } from "@/theme";

type BackButtonProps = {
  onPress: () => void;
};

/**
 * Top-left "‹ Back" control, reused across the identity-capture,
 * identity-confirm, and coaching-touch screens — the ability to return to
 * a previously-answered question and redo it, requested after founder
 * testing found the linear "no going back" flow left no way to revise an
 * earlier answer.
 */
export function BackButton({ onPress }: BackButtonProps) {
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={styles.pressable}
    >
      <Text style={styles.label}>‹ Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  label: {
    ...typography.bodySecondary,
    color: colors.inkSecondary,
  },
});
