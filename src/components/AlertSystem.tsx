import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Send, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, getGoogleMapsLink } from "@/utils/locationUtils";

interface AlertLog {
  id: string;
  timestamp: Date;
  message: string;
  location: string;
  status: "sent" | "failed";
  signals: string[];
}

interface AlertSystemProps {
  emergencySignals: string[];
}

export const AlertSystem = ({ emergencySignals }: AlertSystemProps) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [alertLog, setAlertLog] = useState<AlertLog[]>([]);
  const [isSending, setIsSending] = useState(false);

  const sendAlert = async (isManual: boolean = false) => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter an emergency contact number",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const location = await getCurrentLocation();
      const mapLink = getGoogleMapsLink(location.latitude, location.longitude);
      const message = `🚨 EMERGENCY ALERT! ${isManual ? "Manual trigger" : "Auto-detected danger"}. Location: ${mapLink}. Detected signals: ${emergencySignals.join(", ")}`;

      // For demo purposes, simulate sending (replace with actual Twilio integration)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newAlert: AlertLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        message,
        location: mapLink,
        status: "sent",
        signals: emergencySignals,
      };

      setAlertLog((prev) => [newAlert, ...prev]);

      toast({
        title: "Alert Sent!",
        description: `Emergency notification sent to ${phoneNumber}`,
      });

      // Play alert sound
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7OWhUxELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0pBSh+zPLaizsI");
      audio.play().catch(console.error);
    } catch (error) {
      const newAlert: AlertLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        message: "Failed to send alert",
        location: "",
        status: "failed",
        signals: emergencySignals,
      };

      setAlertLog((prev) => [newAlert, ...prev]);

      toast({
        title: "Alert Failed",
        description: error instanceof Error ? error.message : "Failed to send alert",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground text-lg">Emergency Alert System</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-foreground">Emergency Contact</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => sendAlert(true)}
                disabled={isSending}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Sending..." : "Test Alert"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Format: +[country code][number] (e.g., +1234567890)
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-secondary" />
              <h4 className="font-semibold text-foreground text-sm">Buddy System</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              In a real emergency, alerts will also be sent to nearby trusted contacts automatically.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Manage Buddies
            </Button>
          </div>
        </div>

        {/* Alert Log */}
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Alert History
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alertLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No alerts sent yet
              </p>
            ) : (
              alertLog.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.status === "sent"
                      ? "border-secondary/50 bg-secondary/10"
                      : "border-destructive/50 bg-destructive/10"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {alert.status === "sent" ? (
                      <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-foreground mt-1 break-words">
                        {alert.message.substring(0, 100)}...
                      </p>
                      {alert.signals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alert.signals.map((signal) => (
                            <span
                              key={signal}
                              className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary"
                            >
                              {signal}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
