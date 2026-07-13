import { StyleSheet, Text, View } from "react-native";
import { GradientBackground } from "./GradientBackground";
import { colors, spacing, typography } from "@/theme";

type PlaceholderScreenProps = {
  eyebrow: string;
  message: string;
};

/** A holding screen for a phase whose real UI hasn't been built yet — keeps the funnel navigable end to end between milestones. */
export function PlaceholderScreen({ eyebrow, message }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={styles.content}>
        <Text style={typography.eyebrow}>{eyebrow}</Text>
        <Text style={[typography.body, styles.message]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  message: {
    textAlign: "center",
  },
});
