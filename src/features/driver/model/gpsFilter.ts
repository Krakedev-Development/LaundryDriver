export interface GpsCandidate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface AcceptedGpsFix {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface PendingRecalibration {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface GpsFixDecision {
  accept: boolean;
  nextPending: PendingRecalibration | null;
}

export const MAX_ACCEPTABLE_ACCURACY_METERS = 25;
export const MAX_ACCURACY_WHEN_STALE_METERS = 80;
export const MAX_STALE_WITHOUT_ACCEPT_MS = 15_000;
export const MAX_PLAUSIBLE_SPEED_MPS = 55;
export const RECALIBRATION_CONSENSUS_RADIUS_METERS = 40;
export const RECALIBRATION_MAX_CONFIRM_GAP_MS = 5_000;

const EARTH_RADIUS_M = 6_371_000;
const DEG_TO_RAD = Math.PI / 180;

export function distanceInMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = (b.latitude - a.latitude) * DEG_TO_RAD;
  const dLng = (b.longitude - a.longitude) * DEG_TO_RAD;
  const lat1 = a.latitude * DEG_TO_RAD;
  const lat2 = b.latitude * DEG_TO_RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Filtra lecturas GPS ruidosas o teletransportaciones antes de enviarlas al servidor
 * (portado del filtro probado de AnubisRide).
 */
export function evaluateDriverGpsFix(
  candidate: GpsCandidate,
  lastAccepted: AcceptedGpsFix | null,
  acceptedFixCount: number,
  pending: PendingRecalibration | null,
): GpsFixDecision {
  if (
    !Number.isFinite(candidate.latitude) ||
    !Number.isFinite(candidate.longitude) ||
    (candidate.latitude === 0 && candidate.longitude === 0)
  ) {
    return { accept: false, nextPending: pending };
  }

  const { accuracy } = candidate;

  if (!lastAccepted) {
    const accept =
      accuracy == null || accuracy <= MAX_ACCURACY_WHEN_STALE_METERS;
    return { accept, nextPending: null };
  }

  const elapsedMs = candidate.timestamp - lastAccepted.timestamp;
  const stale = elapsedMs > MAX_STALE_WITHOUT_ACCEPT_MS;
  const accuracyCeiling = stale
    ? MAX_ACCURACY_WHEN_STALE_METERS
    : MAX_ACCEPTABLE_ACCURACY_METERS;
  const accuracyIsAcceptable = accuracy == null || accuracy <= accuracyCeiling;
  if (!accuracyIsAcceptable) {
    return { accept: false, nextPending: pending };
  }

  const movedMeters = distanceInMeters(lastAccepted, candidate);
  const elapsedSeconds = Math.max(elapsedMs / 1000, 1);
  const impliedSpeedMps = movedMeters / elapsedSeconds;
  if (impliedSpeedMps <= MAX_PLAUSIBLE_SPEED_MPS) {
    return { accept: true, nextPending: null };
  }

  const inRecalibrationWindow =
    acceptedFixCount === 1 &&
    accuracy != null &&
    accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS;
  if (!inRecalibrationWindow) {
    return { accept: false, nextPending: null };
  }

  const confirmsPending =
    pending != null &&
    candidate.timestamp - pending.timestamp <= RECALIBRATION_MAX_CONFIRM_GAP_MS &&
    distanceInMeters(pending, candidate) <= RECALIBRATION_CONSENSUS_RADIUS_METERS;

  if (confirmsPending) {
    return { accept: true, nextPending: null };
  }

  return {
    accept: false,
    nextPending: {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      timestamp: candidate.timestamp,
    },
  };
}

export function shouldPushDriverLocation(
  next: { latitude: number; longitude: number },
  prev: { latitude: number; longitude: number } | null,
  lastSentAt: number,
  options: { force?: boolean; hasActiveOrder?: boolean; now?: number } = {},
): boolean {
  const { force = false, hasActiveOrder = false, now = Date.now() } = options;
  if (force || !prev) return true;
  const elapsedMs = now - lastSentAt;
  const minIntervalMs = hasActiveOrder ? 2_500 : 10_000;
  const minDistanceM = hasActiveOrder ? 5 : 20;
  if (elapsedMs >= (hasActiveOrder ? 6_000 : 25_000)) return true;
  if (elapsedMs < minIntervalMs) return false;
  return distanceInMeters(prev, next) >= minDistanceM;
}
