import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground, PrimaryButton } from "@/components";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { colors, spacing, typography } from "@/theme";

type ErrorRetryScreenProps = {
  message: string;
};

/**
 * Ported from ErrorRetryView.swift, with one deliberate deviation: Swift
 * shows `error.localizedDescription` directly, which can include backend-
 * originated text (a Supabase/Deno error string). This milestone's mission
 * explicitly requires investor-safe copy with no raw technical detail in
 * the UI, which is a stricter bar than the design spec — `message` here is
 * always the calm, generic string from `services/blueprintApi.ts`'s
 * `toInvestorSafeMessage`, never a raw error. "Try again" reuses the
 * existing transcript (it's untouched in the store) rather than restarting
 * onboarding — see `retryBlueprintGeneration` in the store.
 */
export function ErrorRetryScreen({ message }: ErrorRetryScreenProps) {
  const retryBlueprintGeneration = useOnboardingStore((state) => state.retryBlueprintGeneration);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={[typography.body, styles.message]}>{message}</Text>
        <PrimaryButton label="Try again" onPress={retryBlueprintGeneration} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  message: {
    textAlign: "center",
    color: colors.inkSecondary,
  },
});
