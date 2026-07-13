import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, GradientBackground, PrimaryButton } from "@/components";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { colors, spacing, typography } from "@/theme";

/**
 * `05 Onboarding.md` §3 Step 5 — the payoff of the whole sequence: the
 * Coach proves it listened, using a Reflect/Affirm move only, never advice.
 * This is deterministic and template-based, not an LLM call — PDR 0006's
 * rebuild sequencing keeps this pass client-side only, and a template that
 * only ever quotes the user's own words back can't accidentally cross into
 * advice the way a generated response could. A real Coach Engine call is
 * legitimate future work, but isn't required to satisfy "reflect, don't
 * advise" — quoting verbatim structurally can't advise.
 */
export function CoachingTouchScreen() {
  const identityStatement = useOnboardingStore((state) => state.identityStatement);
  const transcript = useOnboardingStore((state) => state.transcript);
  const advanceFromCoachingTouch = useOnboardingStore((state) => state.advanceFromCoachingTouch);
  const goBack = useOnboardingStore((state) => state.goBack);
  const insets = useSafeAreaInsets();

  const reflectionAnswer = transcript.find((turn) => turn.questionKey === "tiny_reflection")?.answerText;

  return (
    <View style={styles.container}>
      <GradientBackground />

      <View style={[styles.backSlot, { top: insets.top + spacing.sm }]}>
        <BackButton onPress={goBack} />
      </View>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={styles.copy}>
          <Text style={[typography.display, styles.line]}>You told me:</Text>
          <Text style={[typography.displayItalic, styles.quote]}>"{identityStatement}"</Text>

          {reflectionAnswer && (
            <>
              <Text style={[typography.display, styles.line]}>And you told me about this:</Text>
              <Text style={[typography.displayItalic, styles.quote]}>"{reflectionAnswer}"</Text>
            </>
          )}

          <Text style={[typography.body, styles.closing]}>
            {reflectionAnswer ? "That's worth noticing." : "I hear that. Let's go from here."}
          </Text>
        </View>

        <PrimaryButton label="Continue" onPress={advanceFromCoachingTouch} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  backSlot: {
    position: "absolute",
    left: spacing.lg,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  copy: {
    gap: spacing.md,
  },
  line: {
    fontSize: 22,
    lineHeight: 30,
  },
  quote: {
    color: colors.accent,
  },
  closing: {
    color: colors.inkSecondary,
    marginTop: spacing.sm,
  },
});
