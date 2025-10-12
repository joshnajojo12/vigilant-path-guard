import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, AlertTriangle, Navigation } from "lucide-react";
import { getCurrentLocation, getGoogleMapsLink, DEMO_DANGER_ZONES, isInDangerZone, type Location, type DangerZone } from "@/utils/locationUtils";
import { Button } from "@/components/ui/button";

export const LocationMap = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyDanger, setNearbyDanger] = useState<DangerZone | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await getCurrentLocation();
        setLocation(loc);
        
        // Check for nearby danger zones
        const danger = isInDangerZone(loc.latitude, loc.longitude, DEMO_DANGER_ZONES);
        setNearbyDanger(danger);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get location");
        setLoading(false);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const openInMaps = () => {
    if (location) {
      window.open(getGoogleMapsLink(location.latitude, location.longitude), "_blank");
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground text-lg">Live Location</h3>
        </div>
        {location && (
          <Button onClick={openInMaps} variant="outline" size="sm">
            <Navigation className="w-4 h-4 mr-2" />
            Open Maps
          </Button>
        )}
      </div>

      {loading && (
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Getting location...</p>
        </div>
      )}

      {error && (
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {location && !loading && (
        <div className="space-y-4">
          <div className="h-64 bg-muted rounded-lg relative overflow-hidden">
            <iframe
              src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
              title="Location Map"
            />
            
            {nearbyDanger && (
              <div className="absolute top-2 left-2 right-2 bg-destructive/90 backdrop-blur-sm p-3 rounded-lg animate-pulse-glow">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-destructive-foreground text-sm">
                      Danger Zone Alert!
                    </p>
                    <p className="text-xs text-destructive-foreground/90 mt-1">
                      {nearbyDanger.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-muted-foreground mb-1">Latitude</p>
              <p className="font-mono font-semibold text-foreground">
                {location.latitude.toFixed(6)}
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-muted-foreground mb-1">Longitude</p>
              <p className="font-mono font-semibold text-foreground">
                {location.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-muted-foreground text-sm mb-1">Accuracy</p>
            <p className="font-semibold text-foreground">
              ±{location.accuracy.toFixed(0)} meters
            </p>
          </div>

          {/* Danger Zones Overlay */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Nearby Areas:</p>
            {DEMO_DANGER_ZONES.map((zone) => (
              <div
                key={zone.id}
                className={`p-3 rounded-lg border ${
                  zone.severity === "high"
                    ? "border-destructive/50 bg-destructive/10"
                    : zone.severity === "medium"
                    ? "border-warning/50 bg-warning/10"
                    : "border-muted bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      zone.severity === "high"
                        ? "text-destructive"
                        : zone.severity === "medium"
                        ? "text-warning"
                        : "text-muted-foreground"
                    }`}
                  />
                  <p className="text-sm font-medium text-foreground">{zone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
