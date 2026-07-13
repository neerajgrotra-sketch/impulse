import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { colors } from "@/theme";

/**
 * Shared dark, calm background used across every screen in the onboarding
 * journey — ports SwiftUI's `BackgroundGradient` 1:1 (top-to-bottom, full
 * bleed under the status bar and home indicator).
 */
export function GradientBackground() {
  return (
    <LinearGradient
      colors={[colors.background.gradientStart, colors.background.gradientEnd]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
