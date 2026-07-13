import { Platform } from "react-native";

/**
 * Soft, restrained elevation only — this product's visual language (Apple /
 * Linear / Notion, never dashboard-like) avoids heavy drop shadows. These
 * exist for the rare surface that needs to lift off the gradient (e.g. a
 * floating button), not for card-based UI.
 */
function shadow(opacity: number, radius: number, elevation: number) {
  return Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: radius / 2 },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  });
}

export const elevation = {
  none: {},
  low: shadow(0.18, 8, 3),
  medium: shadow(0.24, 16, 6),
  high: shadow(0.32, 28, 10),
} as const;

export type Elevation = typeof elevation;
