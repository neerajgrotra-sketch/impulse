import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmphasizedText, GradientBackground, PrimaryButton } from "@/components";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { colors, spacing, typography } from "@/theme";
import type { BlueprintResponse } from "@/types/onboarding";

/**
 * Screen 5 — the climax, and deliberately not called "the Blueprint"
 * anywhere a person can see it. That's an internal schema name
 * (`BlueprintResponse`, unchanged — see services/blueprintApi.ts); the
 * experience itself is designed to read like a letter from someone who
 * listened closely, not a psychological report. Ports the *content*
 * structure of BlueprintView.swift exactly (same six fields, same order,
 * same quote-grounding via EmphasizedText) but deliberately diverges on
 * presentation — natural-language section framing instead of report-style
 * eyebrow labels, a three-line reveal before any content appears, and a
 * closing line this milestone's mission specified directly. See
 * prototype/expo/README.md for the full list of what changed and why.
 */
const TRANSITION_LINES = [
  "Thank you.",
  "I've been listening carefully.",
  "Here's what I understand so far.",
] as const;

const TRANSITION_HOLD_MS = 1600;

export function ReflectionScreen() {
  const blueprint = useOnboardingStore((state) => state.blueprint);
  const advanceFromBlueprint = useOnboardingStore((state) => state.advanceFromBlueprint);
  const [revealed, setRevealed] = useState(false);

  // The coordinator only renders this screen once `blueprintSucceeded` has
  // set `blueprint`, so this is defensive, not a real code path — but a
  // screen that renders nothing rather than crashing on a null value it
  // shouldn't ever see is cheap insurance.
  if (!blueprint) return null;

  if (!revealed) {
    return <RevealTransition onComplete={() => setRevealed(true)} />;
  }

  return <Letter blueprint={blueprint} onContinue={advanceFromBlueprint} />;
}

function RevealTransition({ onComplete }: { onComplete: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const isLastLine = lineIndex === TRANSITION_LINES.length - 1;
    const timeout = setTimeout(
      () => (isLastLine ? onComplete() : setLineIndex((i) => i + 1)),
      TRANSITION_HOLD_MS
    );
    return () => clearTimeout(timeout);
  }, [lineIndex, onComplete]);

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={styles.transitionContent}>
        <Animated.Text
          key={lineIndex}
          entering={FadeIn.duration(700)}
          exiting={FadeOut.duration(400)}
          style={typography.displayItalic}
        >
          {TRANSITION_LINES[lineIndex]}
        </Animated.Text>
      </View>
    </View>
  );
}

type LetterProps = {
  blueprint: BlueprintResponse;
  onContinue: () => void;
};

/** Stagger between each movement's entrance — long enough to read as
 *  sequential, short enough not to feel like a wait. Reanimated's
 *  `entering`/`exiting` builders default to `ReduceMotion.System`, so this
 *  and every fade below already collapses to an instant appearance when the
 *  reader has Reduce Motion on — no manual branching needed. */
const STAGGER_MS = 220;

function Letter({ blueprint, onContinue }: LetterProps) {
  const insets = useSafeAreaInsets();
  let movement = 0;
  const next = () => FadeIn.delay(movement++ * STAGGER_MS).duration(700);

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <Animated.Text entering={next()} accessibilityRole="header" style={styles.title}>
          {blueprint.title}
        </Animated.Text>

        <Animated.View entering={next()}>
          <EmphasizedText
            content={blueprint.whoYouAre}
            style={styles.prose}
            quoteStyle={styles.quote}
          />
        </Animated.View>

        <Animated.View entering={next()}>
          <EmphasizedText
            content={blueprint.whatDrivesYou}
            style={styles.prose}
            quoteStyle={styles.quote}
          />
        </Animated.View>

        <Animated.View entering={next()}>
          <EmphasizedText content={blueprint.theGap} style={styles.prose} quoteStyle={styles.quote} />
        </Animated.View>

        <Animated.View entering={next()} style={styles.movement}>
          <Text accessibilityRole="header" style={typography.letterLeadIn}>
            What stood out
          </Text>
          <View style={styles.listItems}>
            {blueprint.strengths.map((item) => (
              <View key={item.strength} style={styles.listItem}>
                <Text style={typography.letterListHeadline}>{item.strength}</Text>
                <EmphasizedText
                  content={`*"${item.quote}"*`}
                  style={typography.letterListQuote}
                  quoteStyle={typography.letterListQuote}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={next()} style={styles.movement}>
          <Text accessibilityRole="header" style={typography.letterLeadIn}>
            Where it gets harder
          </Text>
          <View style={styles.listItems}>
            {blueprint.frictionPoints.map((item) => (
              <View key={item.condition} style={styles.listItem}>
                <Text style={typography.letterListHeadline}>{item.condition}</Text>
                <EmphasizedText
                  content={`*"${item.quote}"*`}
                  style={typography.letterListQuote}
                  quoteStyle={typography.letterListQuote}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={next()}>
          <EmphasizedText
            content={blueprint.howIllCoachYou}
            style={styles.prose}
            quoteStyle={styles.quote}
          />
        </Animated.View>

        <Animated.View entering={next()} style={styles.closing}>
          <Text style={typography.letterClosing}>
            This understanding will continue to evolve as I get to know you.
          </Text>
          <Text style={typography.letterFooter}>Built from what you told me, and nothing else.</Text>
        </Animated.View>

        <Animated.View entering={next()} style={styles.continueWrap}>
          <PrimaryButton label="Continue" onPress={onContinue} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  transitionContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxxl,
  },
  title: {
    ...typography.letterTitle,
  },
  prose: {
    ...typography.letterProse,
  },
  quote: {
    ...typography.letterQuote,
  },
  movement: {
    gap: spacing.lg,
  },
  listItems: {
    gap: spacing.lg,
  },
  listItem: {
    gap: spacing.xxs,
  },
  closing: {
    gap: spacing.sm,
  },
  continueWrap: {
    alignItems: "center",
    paddingTop: spacing.md,
  },
});
