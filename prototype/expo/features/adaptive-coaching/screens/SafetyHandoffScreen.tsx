import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "@/components";
import { colors, spacing, typography } from "@/theme";

type SafetyHandoffScreenProps = {
  message: string;
};

/**
 * Rendered whenever the Safety Engine hard-stops the loop (elevated/crisis
 * tier — decisions/0006, adr/0008 §4, adr/0013). Plain and calm, per
 * `docs/15 Constitution.md` §3.3: no dead-end error styling, no fabricated
 * crisis-resource content beyond the one honest message the backend
 * returns. This screen renders exactly what the Safety Engine sent —
 * it never invents its own additional copy.
 */
export function SafetyHandoffScreen({ message }: SafetyHandoffScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={[typography.body, styles.message]} accessibilityRole="header">
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.gradientStart },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  message: { textAlign: "center", lineHeight: 26 },
});
