// Location and mapping utilities

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface DangerZone {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: "crime" | "dark" | "isolated";
  severity: "low" | "medium" | "high";
  description: string;
}

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const getGoogleMapsLink = (lat: number, lng: number): string => {
  return `https://maps.google.com/?q=${lat},${lng}`;
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Sample danger zones for demo
export const DEMO_DANGER_ZONES: DangerZone[] = [
  {
    id: "1",
    latitude: 40.7128,
    longitude: -74.006,
    radius: 0.5,
    type: "crime",
    severity: "high",
    description: "High crime area - avoid after dark",
  },
  {
    id: "2",
    latitude: 40.7589,
    longitude: -73.9851,
    radius: 0.3,
    type: "dark",
    severity: "medium",
    description: "Poorly lit area",
  },
];

export const isInDangerZone = (
  userLat: number,
  userLng: number,
  zones: DangerZone[]
): DangerZone | null => {
  for (const zone of zones) {
    const distance = calculateDistance(
      userLat,
      userLng,
      zone.latitude,
      zone.longitude
    );
    if (distance <= zone.radius) {
      return zone;
    }
  }
  return null;
};
