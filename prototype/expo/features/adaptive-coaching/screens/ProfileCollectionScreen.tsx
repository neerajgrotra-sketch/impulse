import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground, PrimaryButton } from "@/components";
import { colors, fontFamily, spacing, typography } from "@/theme";

const MIN_AGE = 13;
const MAX_AGE = 119;

type ProfileCollectionScreenProps = {
  /** Seeded from the store so a remount (e.g. a future back-navigation
   *  path) never loses what was already entered — FAILURE UX's "preserve
   *  all user input," same convention MomentOneScreen's `initialText` uses. */
  initialFirstName?: string;
  initialAge?: number | null;
  onSubmit: (firstName: string, age: number) => void;
};

function parseAge(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MIN_AGE || value > MAX_AGE) return null;
  return value;
}

/**
 * Step 0 of AE-001 — a compact profile screen collecting a first name and
 * age together. Age is intentionally NOT a full date of birth: it is
 * collected as one weak contextual signal (see promptBuilder.ts's
 * age-aware reasoning rule), not a demographic profile to build out.
 *
 * This supersedes the prior name-only design (decisions/0013 Part 7),
 * which excluded age deliberately at the time — that exclusion is
 * overridden here per an explicit product decision to add age as limited,
 * non-stereotyping context (see the AE-001 physical-device review this
 * screen responds to).
 */
export function ProfileCollectionScreen({ initialFirstName = "", initialAge = null, onSubmit }: ProfileCollectionScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialFirstName);
  const [ageText, setAgeText] = useState(initialAge != null ? String(initialAge) : "");
  const [ageTouched, setAgeTouched] = useState(false);
  const ageInputRef = useRef<TextInput>(null);

  const parsedAge = parseAge(ageText.trim());
  const ageHasInvalidEntry = ageTouched && ageText.trim().length > 0 && parsedAge === null;
  const canContinue = name.trim().length > 0 && parsedAge !== null;

  function handleSubmit() {
    if (!canContinue || parsedAge === null) return;
    onSubmit(name.trim(), parsedAge);
  }

  return (
    <View style={styles.container}>
      <GradientBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header} accessibilityRole="header">
            Let&rsquo;s begin with you
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>What should I call you?</Text>
            <TextInput
              style={[typography.display, styles.nameInput]}
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              placeholderTextColor={colors.inkTertiary}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => ageInputRef.current?.focus()}
              accessibilityLabel="Your first name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>How old are you?</Text>
            <TextInput
              ref={ageInputRef}
              style={[typography.display, styles.ageInput]}
              value={ageText}
              onChangeText={(text) => {
                setAgeText(text.replace(/[^\d]/g, "").slice(0, 3));
              }}
              onBlur={() => setAgeTouched(true)}
              placeholder="Your age"
              placeholderTextColor={colors.inkTertiary}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={3}
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Your age"
            />
            <Text style={[typography.caption, styles.supportingCopy]}>
              This helps me understand the stage of life you may be navigating. I won&rsquo;t make assumptions from it.
            </Text>
            {ageHasInvalidEntry && (
              <Text style={[typography.caption, styles.errorText]}>
                Please enter an age between {MIN_AGE} and {MAX_AGE}.
              </Text>
            )}
          </View>

          <PrimaryButton label="Continue" onPress={handleSubmit} fullWidth disabled={!canContinue} />
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 24,
    lineHeight: 31,
    color: colors.ink,
    textAlign: "center",
  },
  field: {
    gap: spacing.sm,
    alignItems: "center",
  },
  label: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
    textAlign: "center",
  },
  nameInput: {
    width: "100%",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.overlay.hairline,
    paddingBottom: spacing.sm,
  },
  ageInput: {
    width: "100%",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.overlay.hairline,
    paddingBottom: spacing.sm,
  },
  supportingCopy: {
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  errorText: {
    textAlign: "center",
    color: colors.state.danger,
  },
});
