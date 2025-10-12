import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Phone, Key } from 'lucide-react';

interface SettingsPanelProps {
  userId: string;
  initialPhone?: string;
  initialSecretCode?: string;
  onSave: (phone: string, secretCode: string, thresholds: any) => void;
}

export function SettingsPanel({ userId, initialPhone = '', initialSecretCode = 'Amma', onSave }: SettingsPanelProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [secretCode, setSecretCode] = useState(initialSecretCode);
  const [voiceSensitivity, setVoiceSensitivity] = useState(0.7);
  const [motionThreshold, setMotionThreshold] = useState(0.5);
  const [lightThreshold, setLightThreshold] = useState(0.3);
  const [soundThreshold, setSoundThreshold] = useState(0.8);
  const [movementThreshold, setMovementThreshold] = useState(0.6);
  const [confirmationWindow, setConfirmationWindow] = useState(5);
  const [sensorsRequired, setSensorsRequired] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive'
      });
      return;
    }

    if (!secretCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a secret code',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          phone_number: phoneNumber,
          secret_code: secretCode,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      const { error: thresholdError } = await supabase
        .from('sensor_thresholds')
        .upsert({
          user_id: userId,
          voice_sensitivity: voiceSensitivity,
          motion_threshold: motionThreshold,
          light_change_threshold: lightThreshold,
          sound_threshold: soundThreshold,
          movement_threshold: movementThreshold,
          confirmation_window_seconds: confirmationWindow,
          sensors_required: sensorsRequired,
          updated_at: new Date().toISOString()
        });

      if (thresholdError) throw thresholdError;

      const thresholds = {
        voiceSensitivity,
        motionThreshold,
        lightChangeThreshold: lightThreshold,
        soundThreshold,
        movementThreshold,
        confirmationWindowSeconds: confirmationWindow,
        sensorsRequired
      };

      onSave(phoneNumber, secretCode, thresholds);

      toast({
        title: 'Success',
        description: 'Settings saved successfully!'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWhatsApp = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number first',
        variant: 'destructive'
      });
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp-alert`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          latitude: 0,
          longitude: 0,
          triggerReason: 'Test Alert',
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Test Alert Sent!',
          description: result.simulated ? 'Alert simulated (Twilio not configured)' : 'Check your WhatsApp for the test message'
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.error || 'Failed to send test alert',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test alert',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Configure emergency contact and secret code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Emergency Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +1 for US, +91 for India)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Secret Voice Code
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="Amma"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Say this word 3 times to trigger emergency alert
            </p>
          </div>

          <Button onClick={testWhatsApp} variant="outline" className="w-full">
            Test WhatsApp Alert
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensor Thresholds</CardTitle>
          <CardDescription>
            Adjust sensitivity for each sensor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Voice Sensitivity: {voiceSensitivity.toFixed(2)}</Label>
            <Slider
              value={[voiceSensitivity]}
              onValueChange={([value]) => setVoiceSensitivity(value)}
              min={0.5}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Higher = more strict matching
            </p>
          </div>

          <div className="space-y-2">
            <Label>Motion Detection: {motionThreshold.toFixed(2)}</Label>
            <Slider
              value={[motionThreshold]}
              onValueChange={([value]) => setMotionThreshold(value)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Detects sudden movement in webcam
            </p>
          </div>

          <div className="space-y-2">
            <Label>Light Change: {lightThreshold.toFixed(2)}</Label>
            <Slider
              value={[lightThreshold]}
              onValueChange={([value]) => setLightThreshold(value)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Detects sudden brightness changes
            </p>
          </div>

          <div className="space-y-2">
            <Label>Sound Level: {soundThreshold.toFixed(2)}</Label>
            <Slider
              value={[soundThreshold]}
              onValueChange={([value]) => setSoundThreshold(value)}
              min={0.3}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Triggers on loud sounds and panic voice
            </p>
          </div>

          <div className="space-y-2">
            <Label>Movement Intensity: {movementThreshold.toFixed(2)}</Label>
            <Slider
              value={[movementThreshold]}
              onValueChange={([value]) => setMovementThreshold(value)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Detects running, falling, or unusual movement
            </p>
          </div>

          <div className="space-y-2">
            <Label>Confirmation Window: {confirmationWindow}s</Label>
            <Slider
              value={[confirmationWindow]}
              onValueChange={([value]) => setConfirmationWindow(value)}
              min={3}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Time window for multi-sensor confirmation
            </p>
          </div>

          <div className="space-y-2">
            <Label>Sensors Required: {sensorsRequired}</Label>
            <Slider
              value={[sensorsRequired]}
              onValueChange={([value]) => setSensorsRequired(value)}
              min={1}
              max={4}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Minimum sensors to trigger alert
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={isSaving}>
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
