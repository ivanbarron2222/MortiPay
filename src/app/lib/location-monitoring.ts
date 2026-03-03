import type { DemoLocationPermissionState } from "./demo-users";

export type HeartbeatPayload = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  permissionState: DemoLocationPermissionState;
  capturedAt: string;
};

export type LocationOffPayload = {
  reason: string;
  permissionState: DemoLocationPermissionState;
  capturedAt: string;
};

type StartLocationHeartbeatParams = {
  intervalMs?: number;
  onHeartbeat: (payload: HeartbeatPayload) => Promise<void> | void;
  onLocationOff: (payload: LocationOffPayload) => Promise<void> | void;
};

type EnsureLocationResult =
  | { ok: true; heartbeat: HeartbeatPayload }
  | { ok: false; off: LocationOffPayload };

function mapPermissionState(value?: PermissionState): DemoLocationPermissionState {
  if (value === "granted" || value === "denied" || value === "prompt") return value;
  return "unknown";
}

async function getPermissionState(): Promise<DemoLocationPermissionState> {
  if (typeof navigator === "undefined") return "unknown";
  if (!("permissions" in navigator)) return "unknown";
  try {
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return mapPermissionState(status.state);
  } catch {
    return "unknown";
  }
}

function readPosition(timeoutMs: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 0,
    });
  });
}

function normalizeGeoError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return "Location permission denied.";
  if (error.code === error.POSITION_UNAVAILABLE) return "Location signal unavailable.";
  if (error.code === error.TIMEOUT) return "Location request timed out.";
  return "Unable to read location.";
}

function isGeolocationError(value: unknown): value is GeolocationPositionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code: unknown }).code === "number"
  );
}

export async function ensureLocationAccess(): Promise<EnsureLocationResult> {
  const capturedAt = new Date().toISOString();
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return {
      ok: false,
      off: {
        reason: "Geolocation is not supported on this device.",
        permissionState: "unknown",
        capturedAt,
      },
    };
  }

  const permissionState = await getPermissionState();
  if (permissionState === "denied") {
    return {
      ok: false,
      off: {
        reason: "Location permission denied. Please enable GPS permission.",
        permissionState,
        capturedAt,
      },
    };
  }

  try {
    const position = await readPosition(10000);
    return {
      ok: true,
      heartbeat: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : null,
        permissionState: await getPermissionState(),
        capturedAt,
      },
    };
  } catch (error) {
    const reason = isGeolocationError(error)
      ? normalizeGeoError(error)
      : "Unable to read location.";
    return {
      ok: false,
      off: {
        reason,
        permissionState: await getPermissionState(),
        capturedAt,
      },
    };
  }
}

export function startLocationHeartbeat({
  intervalMs = 60000,
  onHeartbeat,
  onLocationOff,
}: StartLocationHeartbeatParams) {
  let stopped = false;

  const run = async () => {
    const result = await ensureLocationAccess();
    if (stopped) return;
    if (result.ok) {
      await onHeartbeat(result.heartbeat);
      return;
    }
    await onLocationOff(result.off);
  };

  void run();
  const timer = window.setInterval(() => {
    void run();
  }, intervalMs);

  const onVisible = () => {
    if (!document.hidden) void run();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
