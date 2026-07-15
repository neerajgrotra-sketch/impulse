/**
 * Impulse — Demo Polish Mode palette, ported 1:1 from the Swift prototype's
 * `DesignSystem.swift`. Warm off-white ink and a single sparing accent on a
 * dark dusk gradient — never a stark system-dark-mode look, never a chip or
 * a card fill. See docs/investor-prototype.md §2 for why: "low-saturation
 * dusk tones, nothing clinical/white."
 */
export const colors = {
  background: {
    /** Gradient top-stop — rgb(0.05, 0.06, 0.10) in the Swift source. */
    gradientStart: "#0D0F1A",
    /** Gradient bottom-stop — rgb(0.12, 0.10, 0.16) in the Swift source. */
    gradientEnd: "#1F1A29",
  },

  ink: "#F7F5F0",
  inkSecondary: "rgba(255, 255, 255, 0.58)",
  /** 48% — chosen, not guessed: measures ~4.85–4.99:1 against both gradient
   *  stops (WCAG AA's 4.5:1), verified by computing relative luminance
   *  directly rather than eyeballing it. The original 34% measured only
   *  ~3.1:1, which fails AA at the sizes this color is actually used at
   *  (caption/eyebrow/footer/lead-in, all well under the 18pt "large text"
   *  threshold that a 3:1 pass would require instead. */
  inkTertiary: "rgba(255, 255, 255, 0.48)",

  /** Warm accent — the voice orb, the confirmation slider. Never on body text. */
  accent: "#D9AB7D",

  /** Primary call-to-action surface (the "Begin" capsule button). */
  onLight: "#000000",
  surfaceLight: "#FFFFFF",

  overlay: {
    hairline: "rgba(255, 255, 255, 0.12)",
    scrim: "rgba(5, 6, 10, 0.6)",
  },

  state: {
    danger: "#E2A0A0",
    /** Soft, desaturated green — same treatment as `danger`, used only as a
     *  brief connection-succeeded tint (never a persistent status chip). */
    success: "#A3D9B1",
  },
} as const;

export type Colors = typeof colors;
