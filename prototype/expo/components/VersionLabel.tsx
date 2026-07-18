import Constants from "expo-constants";
import { StyleSheet, Text } from "react-native";
import { colors, spacing, typography } from "@/theme";

/**
 * Reads the version straight from `app.json` via `expo-constants` — never a
 * hardcoded string that could drift from the real configured version. This
 * app has no light mode (`app.json`'s `userInterfaceStyle: "dark"`; see
 * `app/_layout.tsx`'s own comment) — `colors.inkTertiary` is the token
 * already chosen and contrast-verified (≈4.85–4.99:1, WCAG AA) against both
 * gradient stops that make up the app's one background, so it stays
 * readable without a separate light-mode treatment that doesn't apply here.
 */
export function VersionLabel() {
  const version = Constants.expoConfig?.version;
  if (!version) return null;

  return <Text style={styles.text}>Version {version}</Text>;
}

const styles = StyleSheet.create({
  text: {
    ...typography.caption,
    color: colors.inkTertiary,
    marginTop: spacing.xs,
  },
});
