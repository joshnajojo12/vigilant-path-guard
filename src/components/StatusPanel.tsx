import { Card } from "@/components/ui/card";
import { Shield, AlertTriangle, Activity, Power } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusPanelProps {
  isActive: boolean;
  isEmergency: boolean;
  activeSignals: string[];
  onToggle: () => void;
}

export const StatusPanel = ({
  isActive,
  isEmergency,
  activeSignals,
  onToggle,
}: StatusPanelProps) => {
  return (
    <Card
      className={`p-6 border-2 transition-all duration-300 ${
        isEmergency
          ? "border-primary bg-primary/10 animate-pulse-glow"
          : isActive
          ? "border-secondary bg-secondary/10 animate-pulse-safe"
          : "border-border bg-card"
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Status Icon */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isEmergency
              ? "bg-primary/20"
              : isActive
              ? "bg-secondary/20"
              : "bg-muted"
          }`}
        >
          {isEmergency ? (
            <AlertTriangle className="w-12 h-12 text-primary" />
          ) : isActive ? (
            <Shield className="w-12 h-12 text-secondary" />
          ) : (
            <Activity className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        {/* Status Text */}
        <div>
          <h2
            className={`text-3xl font-bold mb-2 ${
              isEmergency
                ? "text-primary"
                : isActive
                ? "text-secondary"
                : "text-muted-foreground"
            }`}
          >
            {isEmergency
              ? "🚨 EMERGENCY DETECTED"
              : isActive
              ? "✅ SYSTEM ACTIVE"
              : "⚪ SYSTEM STANDBY"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEmergency
              ? "Multiple danger signals detected - Alerting emergency contacts"
              : isActive
              ? "All sensors monitoring - You are protected"
              : "Click the button below to activate protection"}
          </p>
        </div>

        {/* Active Signals */}
        {activeSignals.length > 0 && (
          <div className="w-full">
            <p className="text-sm font-semibold text-foreground mb-2">Active Signals:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {activeSignals.map((signal) => (
                <span
                  key={signal}
                  className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium capitalize"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Control Button */}
        <Button
          onClick={onToggle}
          size="lg"
          className={`w-full max-w-xs ${
            isActive
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-secondary hover:bg-secondary/90"
          }`}
        >
          <Power className="w-5 h-5 mr-2" />
          {isActive ? "Deactivate Protection" : "Activate Protection"}
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isActive ? "ON" : "OFF"}
            </p>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{activeSignals.length}</p>
            <p className="text-xs text-muted-foreground">Signals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">4</p>
            <p className="text-xs text-muted-foreground">Sensors</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
