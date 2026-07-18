import { PermissionStatus } from "expo-modules-core";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";

/**
 * Location check-ins — opt-in background location awareness.
 *
 * DATA HANDLING (per `.rules/privacy.md`, rule 13 — new data fields in a
 * Sensitive-tier change must be justified here):
 * - Coordinates from `expo-location` are read in-process, used once to
 *   reverse-geocode and (if a provider is ever wired) look up a nearby
 *   venue, then discarded. They are never written to persistent storage.
 * - The only state persisted (via `expo-secure-store`, Keychain-backed on
 *   iOS) is: whether the feature is enabled, the epoch-ms timestamp of the
 *   last successfully sent notification, and the coarse label (a venue name
 *   or city string, never coordinates) from that last notification, shown
 *   in Settings so the user can see what was last surfaced to them.
 * - Nothing here is transmitted to Supabase, to any analytics event, or to
 *   the LLM. `resolveNearbyVenue` (below) is a stub — no network request
 *   happens for venue lookup until a real provider is wired behind a
 *   trusted backend.
 * - Precise latitude/longitude is never passed to `console.*` — every log
 *   line in this module logs an error message or a coarse label only.
 * - Disabling the feature (`stopLocationCheckIns`) deletes the persisted
 *   timestamp and label; only the `enabled: false` preference flag remains,
 *   which is what lets Settings render correctly without re-deriving state.
 *
 * ARCHITECTURE:
 * - `defineTask` and `setNotificationHandler` run at module scope (below),
 *   not inside a component — required so iOS can relaunch the JS runtime
 *   in the background and find the task already registered before any
 *   location update arrives. This module must be imported once, early,
 *   from the app's root (see `app/_layout.tsx`), purely for that
 *   side effect — no component may define this task itself.
 * - `processBackgroundLocationUpdate` is exported and unit-tested directly;
 *   it is also the function `defineTask`'s callback delegates to, so the
 *   real background path and the tested path are the same code.
 */

export const LOCATION_CHECKIN_TASK = "impulse-location-checkin";

/** Never send more than one notification within this window (§ product goal: "approximately every 30 minutes, minimum, not guaranteed"). */
export const MIN_NOTIFICATION_INTERVAL_MS = 30 * 60 * 1000;

/** A fix older than this is treated as stale and ignored — iOS can deliver a cached/deferred fix well after it was captured. */
export const MAX_LOCATION_AGE_MS = 10 * 60 * 1000;

/** A fix with worse (larger) accuracy than this, in meters, is treated as too imprecise to name a street/venue from. */
export const MAX_ACCEPTABLE_ACCURACY_METERS = 150;

/** Movement-based trigger distance — avoids polling on a timer; only a real ~200m move (or iOS's own deferred/significant-change delivery) produces an update at all. */
const MIN_MOVEMENT_METERS = 200;

/** Batches updates so the OS wakes the JS runtime less often than "every eligible fix" — battery-conscious, and irrelevant to notification timing since eligibility is still gated by `MIN_NOTIFICATION_INTERVAL_MS` independently. */
const DEFERRED_UPDATE_INTERVAL_MS = 15 * 60 * 1000;

const STORAGE_KEYS = {
  enabled: "locationCheckIns.enabled",
  lastNotifiedAt: "locationCheckIns.lastNotifiedAt",
  lastLabel: "locationCheckIns.lastLabel",
} as const;

const NOTIFICATION_DATA_TYPE = "location-checkin";

// ---------------------------------------------------------------------------
// Persistence — small values only (a flag, a timestamp, a coarse label),
// never coordinates. expo-secure-store is already a repo dependency
// (unused elsewhere so far) and is Keychain-backed on iOS, which survives
// app relaunch and is a reasonable home for even this low-sensitivity data.
// ---------------------------------------------------------------------------

async function getPersisted(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`[locationCheckInService] failed to read ${key}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function setPersisted(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn(`[locationCheckInService] failed to persist ${key}:`, err instanceof Error ? err.message : err);
  }
}

async function deletePersisted(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // best-effort — nothing meaningful to do if a delete fails
  }
}

// ---------------------------------------------------------------------------
// Pure, deterministic logic — unit-tested directly, no I/O.
// ---------------------------------------------------------------------------

/** 30-minute (or custom) eligibility gate. `lastNotifiedAtMs === null` means no check-in has ever succeeded — always eligible. */
export function isEligibleForCheckIn(
  lastNotifiedAtMs: number | null,
  nowMs: number,
  minIntervalMs: number = MIN_NOTIFICATION_INTERVAL_MS
): boolean {
  if (lastNotifiedAtMs === null) return true;
  if (!Number.isFinite(lastNotifiedAtMs) || !Number.isFinite(nowMs)) return false;
  return nowMs - lastNotifiedAtMs >= minIntervalMs;
}

export type UsableLocationInput = {
  coords: { accuracy: number | null | undefined };
  timestamp: number;
};

/** Rejects a fix with no/poor accuracy, a stale timestamp, or a timestamp in the future (clock skew / bad mock data). */
export function isUsableLocation(
  location: UsableLocationInput | null | undefined,
  nowMs: number,
  opts: { maxAgeMs?: number; maxAccuracyMeters?: number } = {}
): boolean {
  if (!location || !location.coords) return false;
  const maxAgeMs = opts.maxAgeMs ?? MAX_LOCATION_AGE_MS;
  const maxAccuracyMeters = opts.maxAccuracyMeters ?? MAX_ACCEPTABLE_ACCURACY_METERS;

  const { accuracy } = location.coords;
  if (accuracy === null || accuracy === undefined || accuracy <= 0) return false;
  if (accuracy > maxAccuracyMeters) return false;

  if (!Number.isFinite(location.timestamp)) return false;
  const ageMs = nowMs - location.timestamp;
  if (ageMs < 0 || ageMs > maxAgeMs) return false;

  return true;
}

export type ResolvedAddress = {
  street: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

export type VenueMatch = { name: string; distanceMeters: number } | null;

export type NotificationContent = { title: string; body: string } | null;

/**
 * The exact copy rules from the product spec: a venue match is always
 * phrased as "near"/"may be near" (never "you are at"/"you are in"); the
 * address-only fallback uses street+city→city+region→city-only in that
 * order, never inventing text when nothing meaningful resolved.
 */
export function formatCheckInNotification(address: ResolvedAddress, venue: VenueMatch): NotificationContent {
  if (venue && venue.name) {
    const body = [address.street, address.city].filter(Boolean).join(", ");
    if (body) {
      return { title: `You may be near ${venue.name}`, body };
    }
    // A venue name with no usable address to pair it with isn't meaningful
    // enough to show alone — fall through to the address-only phrasing.
  }
  return fallbackFromAddress(address);
}

function fallbackFromAddress(address: ResolvedAddress): NotificationContent {
  if (address.street && address.city) {
    return {
      title: `You're near ${address.street}`,
      body: [address.city, address.region].filter(Boolean).join(", "),
    };
  }
  if (address.city) {
    return {
      title: `You're currently in ${address.city}`,
      body: "Location check-in from Impulse",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Venue lookup — clean interface, not implemented for this version.
// ---------------------------------------------------------------------------

/**
 * No Places/venue provider is configured anywhere in this repository (no
 * secure backend proxy, no key of any kind — confirmed by inspection before
 * this feature was built). Per the product spec's own constraint, a private
 * provider key must never be placed in the mobile bundle and no credential
 * may be invented, so this always resolves `null` until a real provider is
 * wired behind a trusted backend (e.g. a Supabase Edge Function that holds
 * the key server-side and returns only a name + distance). Every caller in
 * this module already treats a `null` venue as "address-only" — wiring a
 * real provider later requires no change anywhere else in this file.
 */
export async function resolveNearbyVenue(_coords: {
  latitude: number;
  longitude: number;
  accuracy: number | null | undefined;
}): Promise<VenueMatch> {
  return null;
}

/** Reverse-geocodes on-device (no key required) and attempts a venue lookup. Never throws — a geocoding failure yields an empty address, letting the caller decide not to notify rather than crash the background task. */
export async function resolveLocationLabel(coords: {
  latitude: number;
  longitude: number;
  accuracy: number | null | undefined;
}): Promise<{ address: ResolvedAddress; venue: VenueMatch }> {
  let address: ResolvedAddress = { street: null, city: null, region: null, country: null };
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
    const first = results[0];
    if (first) {
      address = {
        street: first.street ?? first.name ?? null,
        city: first.city ?? null,
        region: first.region ?? null,
        country: first.country ?? null,
      };
    }
  } catch (err) {
    console.warn("[locationCheckInService] reverse geocoding failed:", err instanceof Error ? err.message : err);
  }

  let venue: VenueMatch = null;
  try {
    venue = await resolveNearbyVenue(coords);
  } catch (err) {
    console.warn("[locationCheckInService] venue lookup failed:", err instanceof Error ? err.message : err);
  }

  return { address, venue };
}

/** Sends the notification if, and only if, formatting produced something meaningful. Never sends a vague/placeholder notification. */
export async function sendLocationNotification(address: ResolvedAddress, venue: VenueMatch): Promise<boolean> {
  const content = formatCheckInNotification(address, venue);
  if (!content) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: { type: NOTIFICATION_DATA_TYPE },
    },
    trigger: null,
  });
  return true;
}

// ---------------------------------------------------------------------------
// Permissions — explicit, staged, opt-in only. Nothing here runs on launch;
// every function is called from a user-initiated Settings action.
// ---------------------------------------------------------------------------

export type StagedPermissionResult = {
  foreground: PermissionStatus;
  /** `null` means background was never requested because foreground wasn't granted — staging is enforced, not just documented. */
  background: PermissionStatus | null;
};

export async function requestLocationPermissions(): Promise<StagedPermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== PermissionStatus.GRANTED) {
    return { foreground: foreground.status, background: null };
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  return { foreground: foreground.status, background: background.status };
}

export async function requestNotificationPermission(): Promise<PermissionStatus> {
  const result = await Notifications.requestPermissionsAsync();
  return result.status;
}

// ---------------------------------------------------------------------------
// Start / stop / status
// ---------------------------------------------------------------------------

export type StartResult =
  | { started: true }
  | { started: false; reason: "foreground-permission-denied" | "background-permission-denied" | "notification-permission-denied" };

export async function startLocationCheckIns(): Promise<StartResult> {
  const [foregroundPerm, backgroundPerm, notifPerm] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
  ]);

  if (foregroundPerm.status !== PermissionStatus.GRANTED) {
    return { started: false, reason: "foreground-permission-denied" };
  }
  if (backgroundPerm.status !== PermissionStatus.GRANTED) {
    return { started: false, reason: "background-permission-denied" };
  }
  if (notifPerm.status !== PermissionStatus.GRANTED) {
    return { started: false, reason: "notification-permission-denied" };
  }

  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_CHECKIN_TASK);
  if (!alreadyRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_CHECKIN_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: MIN_MOVEMENT_METERS,
      deferredUpdatesInterval: DEFERRED_UPDATE_INTERVAL_MS,
      pausesUpdatesAutomatically: true,
      activityType: Location.ActivityType.Other,
      showsBackgroundLocationIndicator: true,
    });
  }

  await setPersisted(STORAGE_KEYS.enabled, "true");
  return { started: true };
}

export async function stopLocationCheckIns(): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(LOCATION_CHECKIN_TASK);
  if (registered) {
    await Location.stopLocationUpdatesAsync(LOCATION_CHECKIN_TASK);
  }
  await setPersisted(STORAGE_KEYS.enabled, "false");
  // Location-derived state is cleared on disable; only the enabled=false
  // preference remains, per .rules/privacy.md's data-minimization rule.
  await deletePersisted(STORAGE_KEYS.lastNotifiedAt);
  await deletePersisted(STORAGE_KEYS.lastLabel);
}

export type LocationCheckInStatus = {
  /** True only if the user's preference is "on" AND the native task is actually registered AND all three permissions still hold — never trusted from the preference flag alone. */
  enabled: boolean;
  taskRegistered: boolean;
  foregroundPermission: PermissionStatus;
  backgroundPermission: PermissionStatus;
  notificationPermission: PermissionStatus;
  /** True when the user's preference is "on" but something (a revoked permission, most commonly) is preventing it from actually running — the case Settings should surface as "permission problem," not silently show as on or off. */
  hasPermissionProblem: boolean;
  lastNotifiedAt: number | null;
  lastLabel: string | null;
};

/** Reconciles the persisted "enabled" preference against real native/permission state — never assumes the preference flag alone reflects reality (covers OS-revoked permissions, a task the OS deregistered, or reinstall). */
export async function getLocationCheckInStatus(): Promise<LocationCheckInStatus> {
  const [enabledRaw, taskRegistered, foregroundPerm, backgroundPerm, notifPerm, lastNotifiedAtRaw, lastLabel] = await Promise.all([
    getPersisted(STORAGE_KEYS.enabled),
    TaskManager.isTaskRegisteredAsync(LOCATION_CHECKIN_TASK),
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
    getPersisted(STORAGE_KEYS.lastNotifiedAt),
    getPersisted(STORAGE_KEYS.lastLabel),
  ]);

  const persistedEnabled = enabledRaw === "true";
  const permissionsOk =
    foregroundPerm.status === PermissionStatus.GRANTED &&
    backgroundPerm.status === PermissionStatus.GRANTED &&
    notifPerm.status === PermissionStatus.GRANTED;

  return {
    enabled: persistedEnabled && taskRegistered && permissionsOk,
    taskRegistered,
    foregroundPermission: foregroundPerm.status,
    backgroundPermission: backgroundPerm.status,
    notificationPermission: notifPerm.status,
    hasPermissionProblem: persistedEnabled && !permissionsOk,
    lastNotifiedAt: lastNotifiedAtRaw ? Number(lastNotifiedAtRaw) : null,
    lastLabel: lastLabel ?? null,
  };
}

// ---------------------------------------------------------------------------
// The background task body — exported and unit-tested directly; defineTask
// below delegates to this exact function, so there is only one code path.
// ---------------------------------------------------------------------------

// Module-scope, not component-state: guards against two overlapping
// invocations of this same JS context (the realistic overlap risk — see
// header). The 30-minute business rule itself is enforced independently by
// the persisted timestamp, which also protects across app relaunches.
let isProcessingUpdate = false;

/**
 * A minimal, structural shape — deliberately not `Location.LocationObject`
 * itself. `processBackgroundLocationUpdate` only ever reads
 * latitude/longitude/accuracy/timestamp; requiring the SDK's full shape
 * (altitude, heading, speed, ...) here would make every unit test construct
 * irrelevant fields just to satisfy the type, for no real safety benefit —
 * a real `LocationObject` still satisfies this type structurally.
 */
export type BackgroundLocationUpdate = {
  coords: { latitude: number; longitude: number; accuracy: number | null | undefined };
  timestamp: number;
};

export type BackgroundLocationTaskData = { locations?: BackgroundLocationUpdate[] } | undefined;

export async function processBackgroundLocationUpdate(
  data: BackgroundLocationTaskData,
  error: { message: string } | null
): Promise<void> {
  if (error) {
    console.warn("[locationCheckInService] background task error:", error.message);
    return;
  }
  if (isProcessingUpdate) return;

  const locations = data?.locations;
  if (!locations || locations.length === 0) return;

  isProcessingUpdate = true;
  try {
    const latest = locations[locations.length - 1];
    const now = Date.now();
    if (!isUsableLocation(latest, now)) return;

    const lastNotifiedAtRaw = await getPersisted(STORAGE_KEYS.lastNotifiedAt);
    const lastNotifiedAt = lastNotifiedAtRaw ? Number(lastNotifiedAtRaw) : null;
    if (!isEligibleForCheckIn(lastNotifiedAt, now)) return;

    const { address, venue } = await resolveLocationLabel({
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
      accuracy: latest.coords.accuracy,
    });

    const sent = await sendLocationNotification(address, venue);
    if (sent) {
      await setPersisted(STORAGE_KEYS.lastNotifiedAt, String(now));
      const label = venue?.name ?? address.city ?? address.street ?? null;
      if (label) await setPersisted(STORAGE_KEYS.lastLabel, label);
    }
  } catch (err) {
    console.warn(
      "[locationCheckInService] failed to process background location update:",
      err instanceof Error ? err.message : err
    );
  } finally {
    isProcessingUpdate = false;
  }
}

// ---------------------------------------------------------------------------
// Module-scope registration — MUST run on import, before any component
// mounts, so the task is registered whenever iOS relaunches the JS runtime
// in the background. Do not move this inside a component or hook.
// ---------------------------------------------------------------------------

TaskManager.defineTask(LOCATION_CHECKIN_TASK, ({ data, error }) => {
  return processBackgroundLocationUpdate(data as BackgroundLocationTaskData, error);
});

// Foreground notification behavior — also module-scope, so a check-in that
// arrives while the app is open still surfaces a banner instead of being
// silently swallowed (expo-notifications' default with no handler set).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export { NOTIFICATION_DATA_TYPE };
