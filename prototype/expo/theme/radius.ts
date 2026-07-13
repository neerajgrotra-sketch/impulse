export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  /** Pill/capsule shape — used for the primary button, matching SwiftUI's `Capsule()`. */
  full: 999,
} as const;

export type Radius = typeof radius;
