import { useCallback, useEffect } from "react";
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, GradientBackground } from "@/components";
import { useLocationCheckInStore } from "@/stores/locationCheckInStore";
import { colors, spacing, typography } from "@/theme";

type SettingsScreenProps = {
  onBack: () => void;
};

/**
 * The app's first Settings screen (none existed before — `prototype/README.md`
 * lists "settings" as explicitly out of scope for the investor-demo journey
 * this repo otherwise builds). Scoped to exactly the location check-ins
 * control this feature requires; not a general preferences hub.
 */
export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { status, loading, lastError, refreshStatus, enable, disable } = useLocationCheckInStore();

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleToggle = useCallback(
    (next: boolean) => {
      if (next) {
        enable();
      } else {
        disable();
      }
    },
    [enable, disable]
  );

  const isOn = status?.enabled ?? false;
  const hasPermissionProblem = status?.hasPermissionProblem ?? false;

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}
      >
        <BackButton onPress={onBack} />
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.eyebrow}>LOCATION</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Location check-ins</Text>
            <Text style={styles.rowSupporting}>
              When enabled, Impulse can occasionally tell you where you appear to be. Timing and location accuracy
              may vary.
            </Text>
          </View>
          <Switch
            value={isOn}
            onValueChange={handleToggle}
            disabled={loading}
            trackColor={{ false: colors.overlay.hairline, true: colors.accent }}
            thumbColor={colors.ink}
            accessibilityLabel="Location check-ins"
            accessibilityHint="When on, Impulse occasionally sends a notification describing where you appear to be."
          />
        </View>

        <StatusLine
          isOn={isOn}
          loading={loading}
          hasPermissionProblem={hasPermissionProblem}
          lastError={lastError}
          lastLabel={status?.lastLabel ?? null}
          lastNotifiedAt={status?.lastNotifiedAt ?? null}
          onRetry={enable}
        />

        {isOn && (
          <Text style={styles.turnOffHint} accessibilityElementsHidden={false}>
            Turn the toggle off above at any time to stop check-ins immediately.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function StatusLine({
  isOn,
  loading,
  hasPermissionProblem,
  lastError,
  lastLabel,
  lastNotifiedAt,
  onRetry,
}: {
  isOn: boolean;
  loading: boolean;
  hasPermissionProblem: boolean;
  lastError: string | null;
  lastLabel: string | null;
  lastNotifiedAt: number | null;
  onRetry: () => void;
}) {
  if (loading) {
    return <Text style={styles.statusText}>Updating…</Text>;
  }

  if (hasPermissionProblem) {
    return (
      <View style={styles.statusBlock}>
        <Text style={[styles.statusText, styles.statusProblem]}>
          {lastError ?? "A permission Impulse needs was turned off. Check-ins are paused."}
        </Text>
        <Text style={styles.retryLink} onPress={onRetry} accessibilityRole="button">
          Try again
        </Text>
        <Text style={styles.retryLink} onPress={() => Linking.openSettings()} accessibilityRole="button">
          Open iOS Settings
        </Text>
      </View>
    );
  }

  if (lastError) {
    return (
      <View style={styles.statusBlock}>
        <Text style={[styles.statusText, styles.statusProblem]}>{lastError}</Text>
        <Text style={styles.retryLink} onPress={onRetry} accessibilityRole="button">
          Try again
        </Text>
      </View>
    );
  }

  if (isOn) {
    return (
      <Text style={styles.statusText}>
        {lastLabel && lastNotifiedAt
          ? `Active — last check-in: ${lastLabel} (${formatRelativeTime(lastNotifiedAt)})`
          : "Active — waiting for the first eligible check-in."}
      </Text>
    );
  }

  return <Text style={styles.statusText}>Off</Text>;
}

function formatRelativeTime(epochMs: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - epochMs) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours === 1 ? "" : "s"} ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.gradientStart,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.display,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowLabel: {
    ...typography.body,
  },
  rowSupporting: {
    ...typography.caption,
  },
  statusText: {
    ...typography.bodySecondary,
  },
  statusBlock: {
    gap: spacing.xxs,
  },
  statusProblem: {
    color: colors.state.danger,
  },
  retryLink: {
    ...typography.bodySecondary,
    color: colors.accent,
    textDecorationLine: "underline",
  },
  turnOffHint: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
});
