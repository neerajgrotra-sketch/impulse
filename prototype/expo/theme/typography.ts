import type { TextStyle } from "react-native";
import { fontFamily } from "./fonts";
import { colors } from "./colors";

type TypeStyle = Pick<
  TextStyle,
  "fontFamily" | "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing" | "color"
>;

/**
 * Serif is reserved for the handful of moments the Swift prototype treats as
 * "spoken aloud" or "editorial" (Welcome's line, Blueprint prose). Everything
 * else — labels, buttons, captions — stays on the system sans, same split
 * the Swift `DS` enum makes.
 */
export const typography = {
  display: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 28,
    lineHeight: 38,
    color: colors.ink,
  } satisfies TypeStyle,

  displayItalic: {
    fontFamily: fontFamily.serifMediumItalic,
    fontSize: 22,
    lineHeight: 32,
    color: colors.ink,
  } satisfies TypeStyle,

  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.onLight,
  } satisfies TypeStyle,

  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "400",
    color: colors.ink,
  } satisfies TypeStyle,

  bodySecondary: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "400",
    color: colors.inkSecondary,
  } satisfies TypeStyle,

  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    color: colors.inkTertiary,
  } satisfies TypeStyle,

  /** Small-caps-style section label — letter-spaced, never a chip. */
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 1.8,
    color: colors.inkTertiary,
  } satisfies TypeStyle,

  /**
   * The reflection letter's own type scale (Milestone 4's Reflection
   * screen). Deliberately not the `eyebrow` treatment above — that's an
   * uppercase, tracked, report-style label; this screen reads like
   * something a person wrote, not a UI. `letterLeadIn` stays sentence-case
   * and untracked on purpose.
   */
  letterTitle: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.ink,
  } satisfies TypeStyle,

  letterProse: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 18,
    lineHeight: 28,
    color: colors.ink,
  } satisfies TypeStyle,

  letterQuote: {
    fontFamily: fontFamily.serifMediumItalic,
    fontSize: 18,
    lineHeight: 28,
    color: colors.ink,
  } satisfies TypeStyle,

  letterLeadIn: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.inkTertiary,
  } satisfies TypeStyle,

  letterListHeadline: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 19,
    lineHeight: 26,
    color: colors.ink,
  } satisfies TypeStyle,

  letterListQuote: {
    fontFamily: fontFamily.serifMediumItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSecondary,
  } satisfies TypeStyle,

  letterClosing: {
    fontFamily: fontFamily.serifMediumItalic,
    fontSize: 19,
    lineHeight: 28,
    color: colors.ink,
  } satisfies TypeStyle,

  letterFooter: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: colors.inkTertiary,
  } satisfies TypeStyle,
} as const;

export type Typography = typeof typography;
