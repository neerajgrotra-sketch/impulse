import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BreathingOrb, GradientBackground } from "@/components";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { colors, fontFamily, spacing, typography } from "@/theme";
import type { CoachingBeat, CoachingMove } from "@/types/adaptiveCoaching";

type CoachingBeatScreenProps = {
  beat: CoachingBeat;
  move: CoachingMove;
  message: string;
};

/**
 * The final screen in AE-001's slice — renders the one adaptive Coaching
 * Beat and stops. No Continue button, no further onboarding: this is the
 * whole point of the vertical slice (docs/experiments/AE-001-...md), and
 * the experiment question is answered by watching whether this moment
 * feels earned, not by what happens after it.
 */
export function CoachingBeatScreen({ message }: CoachingBeatScreenProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <BreathingOrb state="finished" listening={false} reduceMotion={reduceMotion} />
        <Text style={[typography.display, styles.message]} accessibilityRole="header">
          {message}
        </Text>
        <Text style={[typography.caption, styles.footer]}>That's it for now — thank you for trying this.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.gradientStart },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg, gap: spacing.xl },
  message: {
    fontFamily: fontFamily.serifRegular,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  footer: { textAlign: "center", color: colors.inkTertiary },
});
