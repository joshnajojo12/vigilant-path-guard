import { useState } from "react";
import { SensorMonitor } from "@/components/SensorMonitor";
import { LocationMap } from "@/components/LocationMap";
import { AlertSystem } from "@/components/AlertSystem";
import { StatusPanel } from "@/components/StatusPanel";
import { Shield } from "lucide-react";

const Index = () => {
  const [isActive, setIsActive] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencySignals, setEmergencySignals] = useState<string[]>([]);

  const handleEmergencyDetected = (signals: string[]) => {
    console.log("Emergency detected with signals:", signals);
    setIsEmergency(true);
    setEmergencySignals(signals);

    // Auto-reset after demo
    setTimeout(() => {
      setIsEmergency(false);
    }, 15000);
  };

  const handleToggleActive = () => {
    setIsActive(!isActive);
    if (isActive) {
      setIsEmergency(false);
      setEmergencySignals([]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Smart Auto-SOS
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-Powered Emergency Detection & Response System
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Status & Alerts */}
        <div className="lg:col-span-1 space-y-6">
          <StatusPanel
            isActive={isActive}
            isEmergency={isEmergency}
            activeSignals={emergencySignals}
            onToggle={handleToggleActive}
          />
          <AlertSystem emergencySignals={emergencySignals} />
        </div>

        {/* Right Column - Sensors & Map */}
        <div className="lg:col-span-2 space-y-6">
          {isActive && (
            <div className="animate-slide-up">
              <SensorMonitor
                onEmergencyDetected={handleEmergencyDetected}
                isActive={isActive}
              />
            </div>
          )}
          <div className="animate-fade-in">
            <LocationMap />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          Smart Auto-SOS • Hackathon Demo • Multi-Sensor Emergency Detection System
        </p>
        <p className="mt-1">
          Features: Motion • Sound • Light • Movement Detection • Live GPS • Alert System
        </p>
      </footer>
    </div>
  );
};

export default Index;
