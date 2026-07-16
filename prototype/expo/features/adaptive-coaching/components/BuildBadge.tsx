import { Text, StyleSheet } from "react-native";
import * as Updates from "expo-updates";
import { colors, spacing } from "@/theme";

/**
 * Minimal always-on-screen build identifier for physical-device AE-001
 * testing — lets a tester confirm which EAS Update actually landed without
 * guessing from response timing. Gated on EXPO_PUBLIC_AE001_DEBUG_OVERLAY
 * alone, unlike DebugOverlay's `__DEV__` + env var pair: `__DEV__` is always
 * false inside a JS bundle published via `eas update` (a release-mode
 * export), so requiring it here would make this permanently invisible on
 * exactly the OTA-updated builds it exists to help verify.
 */
export function BuildBadge() {
  if (process.env.EXPO_PUBLIC_AE001_DEBUG_OVERLAY !== "true") return null;

  const label = Updates.isEmbeddedLaunch
    ? "embedded build (no OTA update applied)"
    : `${Updates.updateId?.slice(0, 8) ?? "?"} · ${Updates.channel ?? "no channel"}`;

  return <Text style={styles.text}>{label}</Text>;
}

const styles = StyleSheet.create({
  text: {
    position: "absolute",
    top: 48,
    left: spacing.sm,
    color: colors.inkSecondary,
    fontSize: 10,
    zIndex: 999,
  },
});
