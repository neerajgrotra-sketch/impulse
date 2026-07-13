import { Component, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GradientBackground } from "./GradientBackground";
import { PrimaryButton } from "./PrimaryButton";
import { colors, spacing, typography } from "@/theme";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * A render error anywhere in the onboarding funnel would otherwise show
 * React Native's raw red-screen (dev) or a blank crash (prod) — neither is
 * recoverable in front of an investor. This catches it and offers a
 * same-tone "try again" screen instead. Resetting re-mounts the tree fresh;
 * it won't save a deterministic crash, but it recovers from anything
 * transient (a bad value from a native event, a one-off race) without
 * force-quitting the app mid-demo.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Onboarding crashed:", error);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <GradientBackground />
          <View style={styles.content}>
            <Text style={typography.eyebrow}>Something went wrong</Text>
            <Text style={[typography.body, styles.message]}>
              That wasn't supposed to happen. Your answers so far are safe — you can try again.
            </Text>
            <PrimaryButton label="Try again" onPress={this.reset} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
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
  },
});
