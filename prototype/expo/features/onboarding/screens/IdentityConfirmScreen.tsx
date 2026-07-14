import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, GradientBackground, PrimaryButton } from "@/components";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { colors, spacing, typography } from "@/theme";
import { deriveIdentityStatement } from "@/utils/identityStatement";

/**
 * `05 Onboarding.md` §3 Step 2's confirmation moment: "we propose; they
 * own." Never auto-advances on its own — the user must actively confirm or
 * edit, which is itself the first small commitment the spec calls for.
 */
export function IdentityConfirmScreen() {
  const transcript = useOnboardingStore((state) => state.transcript);
  const identityStatement = useOnboardingStore((state) => state.identityStatement);
  const confirmIdentityStatement = useOnboardingStore((state) => state.confirmIdentityStatement);
  const goBack = useOnboardingStore((state) => state.goBack);
  const insets = useSafeAreaInsets();

  const rawAnswer = transcript.find((turn) => turn.questionKey === "identity")?.answerText ?? "";
  // If they've already confirmed/edited a statement once and came back here
  // via "Back" from the coaching touch, start from what they already
  // settled on rather than re-deriving from scratch.
  const [statement, setStatement] = useState(
    () => identityStatement ?? deriveIdentityStatement(rawAnswer)
  );

  const canConfirm = statement.trim().length > 0;

  return (
    <View style={styles.container}>
      <GradientBackground />

      <View style={[styles.backSlot, { top: insets.top + spacing.sm }]}>
        <BackButton onPress={goBack} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <Text style={[typography.eyebrow, styles.eyebrow]}>HERE'S WHAT I HEARD</Text>

          <TextInput
            style={[typography.display, styles.input]}
            value={statement}
            onChangeText={setStatement}
            multiline
            textAlignVertical="top"
            placeholder="I am someone who…"
            placeholderTextColor={colors.inkTertiary}
          />

          <Text style={[typography.caption, styles.hint]}>
            Edit it until it actually sounds like you — this is yours, not mine.
          </Text>

          <PrimaryButton label="That's me" onPress={() => confirmIdentityStatement(statement)} fullWidth disabled={!canConfirm} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  flex: {
    flex: 1,
  },
  backSlot: {
    position: "absolute",
    left: spacing.lg,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    textAlign: "center",
  },
  input: {
    color: colors.ink,
    minHeight: 120,
  },
  hint: {
    color: colors.inkTertiary,
    textAlign: "center",
  },
});
