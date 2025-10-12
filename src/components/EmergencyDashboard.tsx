import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, MapPin, Play, Square, Settings, Mic } from 'lucide-react';
import { MultiSensorDetector, SensorThresholds, SensorEvent } from '@/utils/multiSensorDetector';
import { GPSTracker, LocationData } from '@/utils/gpsTracking';
import { SafePathCalculator } from '@/utils/safePathCalculator';
import { SensorGraphs } from './SensorGraphs';
import { BuddySystem } from './BuddySystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyAlert {
  id: string;
  timestamp: string;
  reason: string;
  location: string;
  whatsappSent: boolean;
}

interface EmergencyDashboardProps {
  userId: string;
  phoneNumber: string;
  secretCode: string;
  onOpenSettings: () => void;
}

export function EmergencyDashboard({ userId, phoneNumber, secretCode, onOpenSettings }: EmergencyDashboardProps) {
  const [isActive, setIsActive] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [voiceCount, setVoiceCount] = useState(0);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<SensorThresholds>({
    voiceSensitivity: 0.7,
    motionThreshold: 0.5,
    lightChangeThreshold: 0.3,
    soundThreshold: 0.8,
    movementThreshold: 0.6,
    confirmationWindowSeconds: 5,
    sensorsRequired: 2
  });

  const detectorRef = useRef<MultiSensorDetector | null>(null);
  const gpsTrackerRef = useRef<GPSTracker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    gpsTrackerRef.current = new GPSTracker();
    gpsTrackerRef.current.onLocationUpdate((loc) => {
      setLocation(loc);
    });

    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
      }
      if (gpsTrackerRef.current) {
        gpsTrackerRef.current.stopTracking();
      }
    };
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedAlerts: EmergencyAlert[] = (data || []).map(alert => ({
        id: alert.id,
        timestamp: new Date(alert.created_at).toLocaleString(),
        reason: alert.trigger_reason,
        location: GPSTracker.getGoogleMapsUrl(alert.latitude, alert.longitude),
        whatsappSent: alert.whatsapp_sent
      }));

      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const startMonitoring = async () => {
    try {
      if (gpsTrackerRef.current) {
        await gpsTrackerRef.current.getCurrentLocation();
        gpsTrackerRef.current.startTracking();
      }

      detectorRef.current = new MultiSensorDetector(thresholds, secretCode);

      await detectorRef.current.initialize();

      detectorRef.current.onEmergency((events) => {
        handleEmergency(events);
      });

      detectorRef.current.onSensorData((type, data) => {
        handleSensorUpdate(type, data);
      });

      detectorRef.current.start();

      if (detectorRef.current.getWebcamElement() && videoRef.current) {
        videoRef.current.srcObject = detectorRef.current.getWebcamElement()!.srcObject;
      }

      setIsActive(true);

      toast({
        title: 'Monitoring Active',
        description: 'All sensors are now monitoring for emergencies'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start monitoring',
        variant: 'destructive'
      });
    }
  };

  const stopMonitoring = () => {
    if (detectorRef.current) {
      detectorRef.current.stop();
    }

    if (gpsTrackerRef.current) {
      gpsTrackerRef.current.stopTracking();
    }

    setIsActive(false);
    setIsEmergency(false);
    setVoiceCount(0);

    toast({
      title: 'Monitoring Stopped',
      description: 'All sensors have been deactivated'
    });
  };

  const handleSensorUpdate = (type: string, data: any) => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    setSensorData(prev => {
      const newData = [
        ...prev.slice(-29),
        {
          time: timeStr,
          motion: type === 'webcam' ? data.motion : prev[prev.length - 1]?.motion || 0,
          sound: type === 'audio' ? data.volume : prev[prev.length - 1]?.sound || 0,
          light: type === 'webcam' ? data.lightChange : prev[prev.length - 1]?.light || 0,
          movement: type === 'motion' ? data.movementIntensity : prev[prev.length - 1]?.movement || 0
        }
      ];
      return newData;
    });

    if (detectorRef.current) {
      setVoiceCount(detectorRef.current.getVoiceDetectionCount());
    }
  };

  const handleEmergency = async (events: SensorEvent[]) => {
    setIsEmergency(true);

    const currentLoc = gpsTrackerRef.current?.getLastKnownLocation();
    if (!currentLoc) {
      toast({
        title: 'Warning',
        description: 'Location not available. Alert may not be sent.',
        variant: 'destructive'
      });
      return;
    }

    const triggerReason = events.map(e => e.type).join(', ');

    try {
      const { data: alertData, error: alertError } = await supabase
        .from('emergency_alerts')
        .insert({
          user_id: userId,
          latitude: currentLoc.latitude,
          longitude: currentLoc.longitude,
          trigger_reason: triggerReason,
          sensor_data: events,
          whatsapp_sent: false
        })
        .select()
        .single();

      if (alertError) throw alertError;

      if (phoneNumber) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp-alert`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            triggerReason,
            sensorData: events
          })
        });

        const result = await response.json();

        await supabase
          .from('emergency_alerts')
          .update({
            whatsapp_sent: result.success,
            whatsapp_error: result.error || null
          })
          .eq('id', alertData.id);

        if (result.success) {
          toast({
            title: 'Emergency Alert Sent!',
            description: result.simulated ? 'Alert simulated (Twilio not configured)' : 'WhatsApp alert sent successfully',
            variant: result.simulated ? 'default' : 'destructive'
          });
        }
      }

      loadAlerts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send alert',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEmergency ? (
                <ShieldAlert className="w-6 h-6 text-red-600 animate-pulse" />
              ) : (
                <Shield className="w-6 h-6 text-green-600" />
              )}
              <span>Safety Monitor</span>
            </div>
            <Badge variant={isEmergency ? 'destructive' : isActive ? 'default' : 'secondary'}>
              {isEmergency ? 'ALERT' : isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={startMonitoring} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Monitoring
              </Button>
            ) : (
              <Button onClick={stopMonitoring} variant="destructive" className="flex-1">
                <Square className="w-4 h-4 mr-2" />
                Stop Monitoring
              </Button>
            )}
            <Button onClick={onOpenSettings} variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {isActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Voice Code Detection
                </span>
                <Badge variant={voiceCount > 0 ? 'destructive' : 'outline'}>
                  {voiceCount}/3
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg border"
                />
                {location && (
                  <div className="flex flex-col gap-2">
                    <iframe
                      src={GPSTracker.getGoogleMapsEmbedUrl(location.latitude, location.longitude)}
                      className="w-full h-full rounded-lg border"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              {location && (
                <Alert>
                  <MapPin className="w-4 h-4" />
                  <AlertDescription>
                    <a
                      href={GPSTracker.getGoogleMapsUrl(location.latitude, location.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Current Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isActive && sensorData.length > 0 && (
        <SensorGraphs
          data={sensorData}
          thresholds={{
            motion: thresholds.motionThreshold,
            sound: thresholds.soundThreshold,
            light: thresholds.lightChangeThreshold,
            movement: thresholds.movementThreshold
          }}
        />
      )}

      <BuddySystem userId={userId} currentLocation={location ? { latitude: location.latitude, longitude: location.longitude } : null} />

      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{alert.reason}</p>
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={alert.whatsappSent ? 'default' : 'secondary'}>
                      {alert.whatsappSent ? 'Sent' : 'Failed'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(alert.location, '_blank')}
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
