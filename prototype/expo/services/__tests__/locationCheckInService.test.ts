import { PermissionStatus } from "expo-modules-core";

// Every jest.fn() is created *inside* each factory (never a reference to an
// outer const) — `locationCheckInService.ts` calls `TaskManager.defineTask`
// and `Notifications.setNotificationHandler` at module scope by design (the
// real background task must be registered on import, not inside a
// component), which means those calls fire the instant this test file's own
// `import` of the service resolves. Closing over an outer `const mockFn =
// jest.fn()` declared later in the file races that side effect and the
// outer const loses (ES import evaluation runs before sibling `const`
// statements) — grabbing the mock reference from the already-mocked module
// namespace *after* importing, below, sidesteps the race entirely.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  ActivityType: { Other: 1 },
  reverseGeocodeAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
}));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));
jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(),
}));

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import {
  formatCheckInNotification,
  getLocationCheckInStatus,
  isEligibleForCheckIn,
  isUsableLocation,
  MIN_NOTIFICATION_INTERVAL_MS,
  processBackgroundLocationUpdate,
  type ResolvedAddress,
} from "@/services/locationCheckInService";

const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;
const mockReverseGeocodeAsync = Location.reverseGeocodeAsync as jest.Mock;
const mockGetForegroundPermissionsAsync = Location.getForegroundPermissionsAsync as jest.Mock;
const mockGetBackgroundPermissionsAsync = Location.getBackgroundPermissionsAsync as jest.Mock;
const mockScheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const mockGetPermissionsAsync = Notifications.getPermissionsAsync as jest.Mock;
const mockIsTaskRegisteredAsync = TaskManager.isTaskRegisteredAsync as jest.Mock;

const ADDRESS: ResolvedAddress = { street: "St. Catherine Street", city: "Montreal", region: "Quebec", country: "Canada" };

describe("isEligibleForCheckIn (30-minute eligibility)", () => {
  it("is eligible when no check-in has ever succeeded", () => {
    expect(isEligibleForCheckIn(null, Date.now())).toBe(true);
  });

  it("is not eligible before 30 minutes have elapsed", () => {
    const now = Date.now();
    expect(isEligibleForCheckIn(now - (MIN_NOTIFICATION_INTERVAL_MS - 1000), now)).toBe(false);
  });

  it("is eligible once exactly 30 minutes have elapsed", () => {
    const now = Date.now();
    expect(isEligibleForCheckIn(now - MIN_NOTIFICATION_INTERVAL_MS, now)).toBe(true);
  });

  it("is eligible well after 30 minutes have elapsed", () => {
    const now = Date.now();
    expect(isEligibleForCheckIn(now - MIN_NOTIFICATION_INTERVAL_MS * 3, now)).toBe(true);
  });

  it("rejects non-finite timestamps rather than throwing", () => {
    expect(isEligibleForCheckIn(Number.NaN, Date.now())).toBe(false);
  });
});

describe("isUsableLocation (stale / inaccurate coordinate rejection)", () => {
  const now = Date.now();

  it("rejects a missing location", () => {
    expect(isUsableLocation(null, now)).toBe(false);
    expect(isUsableLocation(undefined, now)).toBe(false);
  });

  it("rejects a null accuracy fix", () => {
    expect(isUsableLocation({ coords: { accuracy: null }, timestamp: now }, now)).toBe(false);
  });

  it("rejects a zero or negative accuracy fix", () => {
    expect(isUsableLocation({ coords: { accuracy: 0 }, timestamp: now }, now)).toBe(false);
    expect(isUsableLocation({ coords: { accuracy: -5 }, timestamp: now }, now)).toBe(false);
  });

  it("rejects a fix worse than the accuracy threshold", () => {
    expect(isUsableLocation({ coords: { accuracy: 500 }, timestamp: now }, now, { maxAccuracyMeters: 150 })).toBe(false);
  });

  it("accepts a fix within the accuracy threshold and age window", () => {
    expect(isUsableLocation({ coords: { accuracy: 30 }, timestamp: now }, now)).toBe(true);
  });

  it("rejects a stale fix older than the max age", () => {
    expect(isUsableLocation({ coords: { accuracy: 30 }, timestamp: now - 20 * 60 * 1000 }, now, { maxAgeMs: 10 * 60 * 1000 })).toBe(
      false
    );
  });

  it("rejects a fix timestamped in the future (clock skew)", () => {
    expect(isUsableLocation({ coords: { accuracy: 30 }, timestamp: now + 60_000 }, now)).toBe(false);
  });
});

describe("formatCheckInNotification (address formatting + venue uncertainty wording)", () => {
  it("formats a street + city fallback exactly per spec", () => {
    expect(formatCheckInNotification(ADDRESS, null)).toEqual({
      title: "You're near St. Catherine Street",
      body: "Montreal, Quebec",
    });
  });

  it("formats a city-only fallback exactly per spec", () => {
    expect(formatCheckInNotification({ street: null, city: "Montreal", region: null, country: null }, null)).toEqual({
      title: "You're currently in Montreal",
      body: "Location check-in from Impulse",
    });
  });

  it("returns null when nothing meaningful resolved — never a vague notification", () => {
    expect(formatCheckInNotification({ street: null, city: null, region: null, country: null }, null)).toBeNull();
  });

  it("uses 'may be near' hedged wording for a venue match, never a claim of certainty", () => {
    const result = formatCheckInNotification(ADDRESS, { name: "Starbucks", distanceMeters: 40 });
    expect(result).toEqual({
      title: "You may be near Starbucks",
      body: "St. Catherine Street, Montreal",
    });
    expect(result?.title).not.toMatch(/you are (in|at)/i);
    expect(result?.title).not.toContain("You're at");
  });

  it("falls back to address-only when a venue is named but no street/city exists to pair it with", () => {
    const result = formatCheckInNotification(
      { street: null, city: null, region: null, country: null },
      { name: "Starbucks", distanceMeters: 40 }
    );
    expect(result).toBeNull();
  });
});

describe("processBackgroundLocationUpdate (duplicate prevention, safe error handling)", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new Map<string, string>();
    mockGetItemAsync.mockImplementation(async (key: string) => store.get(key) ?? null);
    mockSetItemAsync.mockImplementation(async (key: string, value: string) => {
      store.set(key, value);
    });
    mockDeleteItemAsync.mockImplementation(async (key: string) => {
      store.delete(key);
    });
    mockReverseGeocodeAsync.mockResolvedValue([
      { street: "St. Catherine Street", city: "Montreal", region: "Quebec", country: "Canada" },
    ]);
    mockScheduleNotificationAsync.mockResolvedValue("notif-id");
  });

  function usableLocation(opts: { accuracy?: number; timestamp?: number } = {}) {
    return {
      coords: { latitude: 45.5, longitude: -73.6, accuracy: opts.accuracy ?? 20 },
      timestamp: opts.timestamp ?? Date.now(),
    };
  }

  it("does not notify when the task reports an error", async () => {
    await processBackgroundLocationUpdate({ locations: [usableLocation()] }, { message: "native error" });
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not notify when there are no locations in the update", async () => {
    await processBackgroundLocationUpdate({ locations: [] }, null);
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not notify for an inaccurate fix", async () => {
    await processBackgroundLocationUpdate({ locations: [usableLocation({ accuracy: 800 })] }, null);
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not notify for a stale fix", async () => {
    await processBackgroundLocationUpdate({ locations: [usableLocation({ timestamp: Date.now() - 20 * 60 * 1000 })] }, null);
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("sends exactly one notification for a fresh, usable, first-ever fix", async () => {
    await processBackgroundLocationUpdate({ locations: [usableLocation()] }, null);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(store.get("locationCheckIns.lastNotifiedAt")).toBeDefined();
  });

  it("prevents a duplicate notification from a second update inside the 30-minute window", async () => {
    await processBackgroundLocationUpdate({ locations: [usableLocation()] }, null);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);

    await processBackgroundLocationUpdate({ locations: [usableLocation()] }, null);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it("allows a new notification once the 30-minute window has elapsed", async () => {
    const realDateNow = Date.now;
    let now = realDateNow();
    jest.spyOn(Date, "now").mockImplementation(() => now);

    try {
      await processBackgroundLocationUpdate({ locations: [usableLocation({ timestamp: now })] }, null);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);

      now += MIN_NOTIFICATION_INTERVAL_MS + 1000;
      await processBackgroundLocationUpdate({ locations: [usableLocation({ timestamp: now })] }, null);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(2);
    } finally {
      (Date.now as jest.Mock).mockRestore();
    }
  });

  it("does not notify when reverse geocoding resolves nothing meaningful", async () => {
    mockReverseGeocodeAsync.mockResolvedValueOnce([]);
    await processBackgroundLocationUpdate({ locations: [usableLocation()] }, null);
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("handles a geocoding failure safely without throwing or notifying", async () => {
    mockReverseGeocodeAsync.mockRejectedValueOnce(new Error("network down"));
    await expect(processBackgroundLocationUpdate({ locations: [usableLocation()] }, null)).resolves.not.toThrow();
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe("getLocationCheckInStatus (enable/disable state reconciliation)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const granted = { status: PermissionStatus.GRANTED };
  const denied = { status: PermissionStatus.DENIED };

  function enabledPreference(isEnabled: boolean) {
    mockGetItemAsync.mockImplementation(async (key: string) =>
      key === "locationCheckIns.enabled" ? String(isEnabled) : null
    );
  }

  it("reports enabled=true only when the preference, task registration, and every permission all agree", async () => {
    enabledPreference(true);
    mockIsTaskRegisteredAsync.mockResolvedValue(true);
    mockGetForegroundPermissionsAsync.mockResolvedValue(granted);
    mockGetBackgroundPermissionsAsync.mockResolvedValue(granted);
    mockGetPermissionsAsync.mockResolvedValue(granted);

    const status = await getLocationCheckInStatus();
    expect(status.enabled).toBe(true);
    expect(status.hasPermissionProblem).toBe(false);
  });

  it("flags a permission problem when the preference is on but a permission was revoked from iOS Settings", async () => {
    enabledPreference(true);
    mockIsTaskRegisteredAsync.mockResolvedValue(true);
    mockGetForegroundPermissionsAsync.mockResolvedValue(granted);
    mockGetBackgroundPermissionsAsync.mockResolvedValue(denied);
    mockGetPermissionsAsync.mockResolvedValue(granted);

    const status = await getLocationCheckInStatus();
    expect(status.enabled).toBe(false);
    expect(status.hasPermissionProblem).toBe(true);
  });

  it("never trusts the persisted preference alone — reports enabled=false if the native task isn't actually registered", async () => {
    enabledPreference(true);
    mockIsTaskRegisteredAsync.mockResolvedValue(false);
    mockGetForegroundPermissionsAsync.mockResolvedValue(granted);
    mockGetBackgroundPermissionsAsync.mockResolvedValue(granted);
    mockGetPermissionsAsync.mockResolvedValue(granted);

    const status = await getLocationCheckInStatus();
    expect(status.enabled).toBe(false);
  });

  it("reports enabled=false with no permission problem when the user's preference is simply off", async () => {
    enabledPreference(false);
    mockIsTaskRegisteredAsync.mockResolvedValue(false);
    mockGetForegroundPermissionsAsync.mockResolvedValue(denied);
    mockGetBackgroundPermissionsAsync.mockResolvedValue(denied);
    mockGetPermissionsAsync.mockResolvedValue(denied);

    const status = await getLocationCheckInStatus();
    expect(status.enabled).toBe(false);
    expect(status.hasPermissionProblem).toBe(false);
  });
});
