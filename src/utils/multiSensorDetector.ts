import { VoiceDetector, VoiceDetectionConfig } from './voiceDetection';
import { WebcamDetector, WebcamDetectionConfig, WebcamData } from './webcamDetection';
import { AudioDetector, AudioDetectionConfig, AudioData } from './audioDetection';
import { MotionDetector, MotionDetectionConfig, MotionData } from './motionDetection';

export interface SensorThresholds {
  voiceSensitivity: number;
  motionThreshold: number;
  lightChangeThreshold: number;
  soundThreshold: number;
  movementThreshold: number;
  confirmationWindowSeconds: number;
  sensorsRequired: number;
}

export interface SensorEvent {
  type: 'voice' | 'webcam' | 'audio' | 'motion';
  timestamp: number;
  data: any;
}

export class MultiSensorDetector {
  private voiceDetector: VoiceDetector | null = null;
  private webcamDetector: WebcamDetector | null = null;
  private audioDetector: AudioDetector | null = null;
  private motionDetector: MotionDetector | null = null;

  private sensorEvents: SensorEvent[] = [];
  private thresholds: SensorThresholds;
  private onEmergencyCallback: ((events: SensorEvent[]) => void) | null = null;
  private onSensorDataCallback: ((type: string, data: any) => void) | null = null;

  constructor(thresholds: SensorThresholds, secretCode: string) {
    this.thresholds = thresholds;

    const voiceConfig: VoiceDetectionConfig = {
      secretCode,
      requiredRepeats: 3,
      timeWindowMs: 10000,
      sensitivity: thresholds.voiceSensitivity
    };
    this.voiceDetector = new VoiceDetector(voiceConfig);

    const webcamConfig: WebcamDetectionConfig = {
      motionThreshold: thresholds.motionThreshold,
      lightChangeThreshold: thresholds.lightChangeThreshold,
      samplingRate: 100
    };
    this.webcamDetector = new WebcamDetector(webcamConfig);

    const audioConfig: AudioDetectionConfig = {
      soundThreshold: thresholds.soundThreshold,
      panicDetectionEnabled: true,
      samplingRate: 100
    };
    this.audioDetector = new AudioDetector(audioConfig);

    const motionConfig: MotionDetectionConfig = {
      movementThreshold: thresholds.movementThreshold,
      samplingRate: 100
    };
    this.motionDetector = new MotionDetector(motionConfig);

    this.setupCallbacks();
  }

  private setupCallbacks() {
    if (this.voiceDetector) {
      this.voiceDetector.onTrigger(() => {
        this.triggerEmergency([{ type: 'voice', timestamp: Date.now(), data: { trigger: 'voice_code' } }]);
      });
    }

    if (this.webcamDetector) {
      this.webcamDetector.onDetection((data: WebcamData) => {
        if (this.onSensorDataCallback) {
          this.onSensorDataCallback('webcam', data);
        }

        if (data.motion > this.thresholds.motionThreshold || data.lightChange > this.thresholds.lightChangeThreshold) {
          this.recordSensorEvent('webcam', data);
        }
      });
    }

    if (this.audioDetector) {
      this.audioDetector.onDetection((data: AudioData) => {
        if (this.onSensorDataCallback) {
          this.onSensorDataCallback('audio', data);
        }

        if (data.volume > this.thresholds.soundThreshold || data.isPanic) {
          this.recordSensorEvent('audio', data);
        }
      });
    }

    if (this.motionDetector) {
      this.motionDetector.onDetection((data: MotionData) => {
        if (this.onSensorDataCallback) {
          this.onSensorDataCallback('motion', data);
        }

        if (data.movementIntensity > this.thresholds.movementThreshold || data.isFalling || data.isRunning) {
          this.recordSensorEvent('motion', data);
        }
      });
    }
  }

  private recordSensorEvent(type: 'voice' | 'webcam' | 'audio' | 'motion', data: any) {
    const now = Date.now();
    const event: SensorEvent = { type, timestamp: now, data };

    this.sensorEvents.push(event);

    this.sensorEvents = this.sensorEvents.filter(
      e => now - e.timestamp < this.thresholds.confirmationWindowSeconds * 1000
    );

    const uniqueSensorTypes = new Set(this.sensorEvents.map(e => e.type));

    if (uniqueSensorTypes.size >= this.thresholds.sensorsRequired) {
      this.triggerEmergency([...this.sensorEvents]);
    }
  }

  private triggerEmergency(events: SensorEvent[]) {
    if (this.onEmergencyCallback) {
      this.onEmergencyCallback(events);
    }
    this.sensorEvents = [];
  }

  async initialize() {
    try {
      if (this.webcamDetector) {
        await this.webcamDetector.initialize();
      }
      if (this.audioDetector) {
        await this.audioDetector.initialize();
      }
    } catch (error) {
      console.error('Failed to initialize sensors:', error);
      throw error;
    }
  }

  start() {
    if (this.voiceDetector) this.voiceDetector.start();
    if (this.webcamDetector) this.webcamDetector.start();
    if (this.audioDetector) this.audioDetector.start();
    if (this.motionDetector) this.motionDetector.start();
  }

  stop() {
    if (this.voiceDetector) this.voiceDetector.stop();
    if (this.webcamDetector) this.webcamDetector.stop();
    if (this.audioDetector) this.audioDetector.stop();
    if (this.motionDetector) this.motionDetector.stop();
    this.sensorEvents = [];
  }

  onEmergency(callback: (events: SensorEvent[]) => void) {
    this.onEmergencyCallback = callback;
  }

  onSensorData(callback: (type: string, data: any) => void) {
    this.onSensorDataCallback = callback;
  }

  updateThresholds(thresholds: Partial<SensorThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };

    if (this.webcamDetector) {
      this.webcamDetector.updateConfig({
        motionThreshold: this.thresholds.motionThreshold,
        lightChangeThreshold: this.thresholds.lightChangeThreshold
      });
    }

    if (this.audioDetector) {
      this.audioDetector.updateConfig({
        soundThreshold: this.thresholds.soundThreshold
      });
    }

    if (this.motionDetector) {
      this.motionDetector.updateConfig({
        movementThreshold: this.thresholds.movementThreshold
      });
    }

    if (this.voiceDetector) {
      this.voiceDetector.updateConfig({
        sensitivity: this.thresholds.voiceSensitivity
      });
    }
  }

  getWebcamElement(): HTMLVideoElement | null {
    return this.webcamDetector?.getVideoElement() || null;
  }

  getVoiceDetectionCount(): number {
    return this.voiceDetector?.getDetectionCount() || 0;
  }
}
