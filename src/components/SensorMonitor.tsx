import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Camera, Mic, Activity, AlertTriangle } from "lucide-react";
import {
  EmergencyDetector,
  MotionDetector,
  SoundDetector,
  LightDetector,
} from "@/utils/sensorDetection";

interface SensorMonitorProps {
  onEmergencyDetected: (signals: string[]) => void;
  isActive: boolean;
}

export const SensorMonitor = ({
  onEmergencyDetected,
  isActive,
}: SensorMonitorProps) => {
  const [motionLevel, setMotionLevel] = useState(0);
  const [soundLevel, setSoundLevel] = useState(0);
  const [lightLevel, setLightLevel] = useState(0);
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const detectorRef = useRef(new EmergencyDetector());
  const motionDetectorRef = useRef(new MotionDetector());
  const soundDetectorRef = useRef(new SoundDetector());
  const lightDetectorRef = useRef(new LightDetector());

  // Webcam motion detection
  useEffect(() => {
    if (!isActive) return;

    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const detectMotion = () => {
          if (!videoRef.current || !canvasRef.current) return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = 320;
          canvas.height = 240;
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);

          const frame = ctx.getImageData(0, 0, 320, 240);
          const motion = motionDetectorRef.current.detectMotion(frame);

          // Calculate average brightness
          let totalBrightness = 0;
          for (let i = 0; i < frame.data.length; i += 4) {
            totalBrightness +=
              (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3;
          }
          const avgBrightness = totalBrightness / (frame.data.length / 4);
          const lightChange =
            lightDetectorRef.current.detectChange(avgBrightness);

          setMotionLevel(motion ? 100 : 0);
          setLightLevel(Math.min(avgBrightness / 2.55, 100));

          if (motion) {
            detectorRef.current.addSignal({ motion: true });
          }
          if (lightChange) {
            detectorRef.current.addSignal({ lightChange: true });
          }

          checkEmergency();
        };

        const interval = setInterval(detectMotion, 200);
        return () => {
          clearInterval(interval);
          stream.getTracks().forEach((track) => track.stop());
        };
      } catch (error) {
        console.error("Webcam error:", error);
      }
    };

    setupWebcam();
  }, [isActive]);

  // Microphone sound detection
  useEffect(() => {
    if (!isActive) return;

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const audioContext = new AudioContext();
        const analyzer = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        analyzer.fftSize = 256;
        microphone.connect(analyzer);

        audioContextRef.current = audioContext;
        analyzerRef.current = analyzer;

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);

        const detectSound = () => {
          if (!analyzerRef.current) return;

          analyzerRef.current.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const volume = (average / 255) * 100;

          setSoundLevel(volume);

          if (soundDetectorRef.current.detectPanic(volume)) {
            detectorRef.current.addSignal({ sound: true });
          }

          checkEmergency();
        };

        const interval = setInterval(detectSound, 100);

        return () => {
          clearInterval(interval);
          stream.getTracks().forEach((track) => track.stop());
          audioContext.close();
        };
      } catch (error) {
        console.error("Microphone error:", error);
      }
    };

    setupMicrophone();
  }, [isActive]);

  // Accelerometer detection
  useEffect(() => {
    if (!isActive) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { x, y, z } = event.accelerationIncludingGravity || {
        x: 0,
        y: 0,
        z: 0,
      };
      setAccelData({ x: x || 0, y: y || 0, z: z || 0 });

      // Detect sudden movement
      const magnitude = Math.sqrt((x || 0) ** 2 + (y || 0) ** 2 + (z || 0) ** 2);
      if (magnitude > 20) {
        detectorRef.current.addSignal({ accelerometer: true });
        checkEmergency();
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [isActive]);

  const checkEmergency = () => {
    const { isEmergency, signals } = detectorRef.current.checkEmergency();
    if (isEmergency) {
      onEmergencyDetected(signals);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Motion Detection</h3>
        </div>
        <div className="space-y-2">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-32 bg-black rounded"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${motionLevel}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Motion Level: {motionLevel.toFixed(0)}%
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Sound Monitor</h3>
        </div>
        <div className="space-y-2">
          <div className="h-32 bg-black rounded flex items-end p-2 gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-primary transition-all duration-100"
                style={{
                  height: `${Math.max(
                    5,
                    (soundLevel * (1 - i * 0.05)) / 100
                  )}%`,
                }}
              />
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${soundLevel}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sound Level: {soundLevel.toFixed(0)}%
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Light Sensor</h3>
        </div>
        <div className="space-y-2">
          <div
            className="h-32 rounded transition-all duration-300"
            style={{
              background: `rgb(${lightLevel * 2.55}, ${lightLevel * 2.55}, ${lightLevel * 2.55})`,
            }}
          />
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-warning transition-all duration-300"
              style={{ width: `${lightLevel}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Brightness: {lightLevel.toFixed(0)}%
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-secondary" />
          <h3 className="font-semibold text-foreground">Movement Sensor</h3>
        </div>
        <div className="space-y-2">
          <div className="h-32 bg-black rounded flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {Math.sqrt(accelData.x ** 2 + accelData.y ** 2 + accelData.z ** 2).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">m/s²</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">X</div>
              <div className="font-semibold">{accelData.x.toFixed(1)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Y</div>
              <div className="font-semibold">{accelData.y.toFixed(1)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Z</div>
              <div className="font-semibold">{accelData.z.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
