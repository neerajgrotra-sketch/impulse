import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";

/**
 * The serif display face — this app's stand-in for SwiftUI's
 * `.system(style, design: .serif)` (San Francisco Serif / New York), which
 * has no cross-platform equivalent in React Native. Fraunces was chosen for
 * the same "premium editorial" register the Swift `DesignSystem.swift`
 * comment calls for. Body/label text intentionally uses the OS default
 * (San Francisco / Roboto) rather than a bundled sans — same choice the
 * Swift prototype makes by only overriding `.serif` for display text.
 */
export const fontsToLoad = {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
};

export const fontFamily = {
  serifRegular: "Fraunces_400Regular",
  serifMedium: "Fraunces_500Medium",
  serifMediumItalic: "Fraunces_500Medium_Italic",
  serifSemiBold: "Fraunces_600SemiBold",
} as const;
