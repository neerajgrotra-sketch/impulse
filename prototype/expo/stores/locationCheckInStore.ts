import { PermissionStatus } from "expo-modules-core";
import { create } from "zustand";
import {
  getLocationCheckInStatus,
  requestLocationPermissions,
  requestNotificationPermission,
  startLocationCheckIns,
  stopLocationCheckIns,
  type LocationCheckInStatus,
  type StartResult,
} from "@/services/locationCheckInService";

/**
 * Settings-screen-facing state for location check-ins. Deliberately thin —
 * this store holds only what the UI needs to render (mirrors
 * `adaptiveCoachingStore.ts`'s split: the store holds data, the screen owns
 * each request's lifecycle) and defers every real decision (permission
 * staging, task registration, reconciliation) to `locationCheckInService.ts`,
 * which is also what the background task itself calls — this store is a thin
 * reactive wrapper around that service, never a second source of truth.
 */

type LocationCheckInUiState = {
  status: LocationCheckInStatus | null;
  loading: boolean;
  /** Set when `enable()` fails partway through the staged permission flow — distinct from `status`, which only reflects settled native/permission state. */
  lastError: string | null;
};

type LocationCheckInStore = LocationCheckInUiState & {
  refreshStatus: () => Promise<void>;
  /** Runs the full staged flow (foreground → background → notification permission) and starts tracking only if every stage succeeds. */
  enable: () => Promise<void>;
  disable: () => Promise<void>;
};

type StartFailureReason = Extract<StartResult, { started: false }>["reason"];

function reasonToMessage(reason: StartFailureReason): string {
  switch (reason) {
    case "foreground-permission-denied":
      return "Impulse needs location access to enable check-ins.";
    case "background-permission-denied":
      return "Impulse needs “Always” location access to check in while the app is closed.";
    case "notification-permission-denied":
      return "Impulse needs notification permission to tell you about a check-in.";
    default:
      return "Location check-ins couldn't be turned on.";
  }
}

export const useLocationCheckInStore = create<LocationCheckInStore>((set, get) => ({
  status: null,
  loading: false,
  lastError: null,

  refreshStatus: async () => {
    const status = await getLocationCheckInStatus();
    set({ status });
  },

  enable: async () => {
    set({ loading: true, lastError: null });
    try {
      const staged = await requestLocationPermissions();
      if (staged.foreground !== PermissionStatus.GRANTED) {
        set({ loading: false, lastError: reasonToMessage("foreground-permission-denied") });
        await get().refreshStatus();
        return;
      }
      if (staged.background !== PermissionStatus.GRANTED) {
        set({ loading: false, lastError: reasonToMessage("background-permission-denied") });
        await get().refreshStatus();
        return;
      }

      const notifStatus = await requestNotificationPermission();
      if (notifStatus !== PermissionStatus.GRANTED) {
        set({ loading: false, lastError: reasonToMessage("notification-permission-denied") });
        await get().refreshStatus();
        return;
      }

      const result = await startLocationCheckIns();
      if (!result.started) {
        set({ loading: false, lastError: reasonToMessage(result.reason) });
        await get().refreshStatus();
        return;
      }

      set({ loading: false, lastError: null });
      await get().refreshStatus();
    } catch (err) {
      set({ loading: false, lastError: "Something went wrong turning on check-ins. Please try again." });
      console.error("[locationCheckInStore] enable() failed:", err instanceof Error ? err.message : err);
    }
  },

  disable: async () => {
    set({ loading: true, lastError: null });
    try {
      await stopLocationCheckIns();
    } finally {
      set({ loading: false });
      await get().refreshStatus();
    }
  },
}));
