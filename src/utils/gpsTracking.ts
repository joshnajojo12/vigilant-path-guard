export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class GPSTracker {
  private watchId: number | null = null;
  private currentLocation: LocationData | null = null;
  private onLocationUpdateCallback: ((location: LocationData) => void) | null = null;
  private onErrorCallback: ((error: GeolocationPositionError) => void) | null = null;

  async getCurrentLocation(options?: LocationOptions): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        defaultOptions
      );
    });
  }

  startTracking(options?: LocationOptions) {
    if (this.watchId !== null) {
      console.warn('GPS tracking is already active');
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        this.currentLocation = location;

        if (this.onLocationUpdateCallback) {
          this.onLocationUpdateCallback(location);
        }
      },
      (error) => {
        console.error('GPS tracking error:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      },
      defaultOptions
    );
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getLastKnownLocation(): LocationData | null {
    return this.currentLocation;
  }

  onLocationUpdate(callback: (location: LocationData) => void) {
    this.onLocationUpdateCallback = callback;
  }

  onError(callback: (error: GeolocationPositionError) => void) {
    this.onErrorCallback = callback;
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }

  static getGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  static getGoogleMapsEmbedUrl(latitude: number, longitude: number, zoom: number = 15): string {
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;
  }

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
