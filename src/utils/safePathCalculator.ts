import { GPSTracker } from './gpsTracking';

export interface DangerZone {
  latitude: number;
  longitude: number;
  radius_meters: number;
  danger_level: number;
  reason?: string;
}

export interface PathPoint {
  latitude: number;
  longitude: number;
  safetyScore: number;
}

export interface SafePath {
  waypoints: PathPoint[];
  totalDistance: number;
  safetyScore: number;
  dangerZonesAvoided: number;
  estimatedTime: number;
}

export class SafePathCalculator {
  private dangerZones: DangerZone[] = [];

  setDangerZones(zones: DangerZone[]) {
    this.dangerZones = zones;
  }

  addDangerZone(zone: DangerZone) {
    this.dangerZones.push(zone);
  }

  calculateSafestPath(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): SafePath {
    const directPath = this.generateDirectPath(startLat, startLng, endLat, endLng);
    const safePath = this.avoidDangerZones(directPath);

    const totalDistance = this.calculatePathDistance(safePath);
    const safetyScore = this.calculatePathSafetyScore(safePath);
    const dangerZonesAvoided = this.countAvoidedDangerZones(directPath, safePath);
    const estimatedTime = this.estimateTime(totalDistance);

    return {
      waypoints: safePath,
      totalDistance,
      safetyScore,
      dangerZonesAvoided,
      estimatedTime
    };
  }

  private generateDirectPath(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    segments: number = 20
  ): PathPoint[] {
    const path: PathPoint[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const lat = startLat + (endLat - startLat) * t;
      const lng = startLng + (endLng - startLng) * t;
      const safetyScore = this.calculatePointSafety(lat, lng);

      path.push({ latitude: lat, longitude: lng, safetyScore });
    }

    return path;
  }

  private avoidDangerZones(path: PathPoint[]): PathPoint[] {
    const safePath: PathPoint[] = [];

    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      const dangerZone = this.findNearestDangerZone(point.latitude, point.longitude);

      if (dangerZone && this.isPointInDangerZone(point, dangerZone)) {
        const safePoint = this.findSafeAlternative(point, dangerZone, path[i - 1], path[i + 1]);
        safePath.push(safePoint);
      } else {
        safePath.push(point);
      }
    }

    return safePath;
  }

  private findSafeAlternative(
    unsafePoint: PathPoint,
    dangerZone: DangerZone,
    prevPoint?: PathPoint,
    nextPoint?: PathPoint
  ): PathPoint {
    const angleOffset = Math.PI / 4;
    const distance = dangerZone.radius_meters * 1.5;

    const centerLat = dangerZone.latitude;
    const centerLng = dangerZone.longitude;

    const angle = Math.atan2(
      unsafePoint.latitude - centerLat,
      unsafePoint.longitude - centerLng
    );

    const newLat = centerLat + (distance / 111320) * Math.sin(angle + angleOffset);
    const newLng = centerLng + (distance / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.cos(angle + angleOffset);

    const safetyScore = this.calculatePointSafety(newLat, newLng);

    return { latitude: newLat, longitude: newLng, safetyScore };
  }

  private calculatePointSafety(lat: number, lng: number): number {
    let safetyScore = 1.0;

    for (const zone of this.dangerZones) {
      const distance = GPSTracker.calculateDistance(lat, lng, zone.latitude, zone.longitude);

      if (distance < zone.radius_meters) {
        const dangerImpact = (zone.danger_level / 10) * (1 - distance / zone.radius_meters);
        safetyScore -= dangerImpact;
      } else if (distance < zone.radius_meters * 2) {
        const proximityPenalty = (zone.danger_level / 20) * (1 - distance / (zone.radius_meters * 2));
        safetyScore -= proximityPenalty;
      }
    }

    return Math.max(0, Math.min(1, safetyScore));
  }

  private isPointInDangerZone(point: PathPoint, zone: DangerZone): boolean {
    const distance = GPSTracker.calculateDistance(
      point.latitude,
      point.longitude,
      zone.latitude,
      zone.longitude
    );

    return distance < zone.radius_meters;
  }

  private findNearestDangerZone(lat: number, lng: number): DangerZone | null {
    let nearest: DangerZone | null = null;
    let minDistance = Infinity;

    for (const zone of this.dangerZones) {
      const distance = GPSTracker.calculateDistance(lat, lng, zone.latitude, zone.longitude);

      if (distance < zone.radius_meters && distance < minDistance) {
        minDistance = distance;
        nearest = zone;
      }
    }

    return nearest;
  }

  private calculatePathDistance(path: PathPoint[]): number {
    let totalDistance = 0;

    for (let i = 1; i < path.length; i++) {
      const dist = GPSTracker.calculateDistance(
        path[i - 1].latitude,
        path[i - 1].longitude,
        path[i].latitude,
        path[i].longitude
      );
      totalDistance += dist;
    }

    return totalDistance;
  }

  private calculatePathSafetyScore(path: PathPoint[]): number {
    if (path.length === 0) return 0;

    const totalScore = path.reduce((sum, point) => sum + point.safetyScore, 0);
    return totalScore / path.length;
  }

  private countAvoidedDangerZones(originalPath: PathPoint[], safePath: PathPoint[]): number {
    let count = 0;

    for (const zone of this.dangerZones) {
      const wasInOriginal = originalPath.some(point => this.isPointInDangerZone(point, zone));
      const isInSafe = safePath.some(point => this.isPointInDangerZone(point, zone));

      if (wasInOriginal && !isInSafe) {
        count++;
      }
    }

    return count;
  }

  private estimateTime(distanceMeters: number, speedMps: number = 1.4): number {
    return Math.ceil(distanceMeters / speedMps / 60);
  }

  getDangerZones(): DangerZone[] {
    return this.dangerZones;
  }

  clearDangerZones() {
    this.dangerZones = [];
  }
}
