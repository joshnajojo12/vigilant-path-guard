// Multi-signal emergency detection utility

export interface SensorData {
  motion: boolean;
  sound: boolean;
  lightChange: boolean;
  accelerometer: boolean;
  timestamp: number;
}

export class EmergencyDetector {
  private detectionWindow = 5000; // 5 seconds
  private cooldownPeriod = 10000; // 10 seconds
  private lastAlert: number = 0;
  private recentSignals: SensorData[] = [];

  addSignal(data: Partial<SensorData>) {
    const signal: SensorData = {
      motion: data.motion || false,
      sound: data.sound || false,
      lightChange: data.lightChange || false,
      accelerometer: data.accelerometer || false,
      timestamp: Date.now(),
    };

    this.recentSignals.push(signal);
    this.cleanOldSignals();
  }

  private cleanOldSignals() {
    const cutoff = Date.now() - this.detectionWindow;
    this.recentSignals = this.recentSignals.filter(
      (signal) => signal.timestamp > cutoff
    );
  }

  checkEmergency(): { isEmergency: boolean; signals: string[] } {
    // Check cooldown
    if (Date.now() - this.lastAlert < this.cooldownPeriod) {
      return { isEmergency: false, signals: [] };
    }

    this.cleanOldSignals();

    // Count active signals
    const activeSignals: string[] = [];
    const hasMotion = this.recentSignals.some((s) => s.motion);
    const hasSound = this.recentSignals.some((s) => s.sound);
    const hasLight = this.recentSignals.some((s) => s.lightChange);
    const hasAccel = this.recentSignals.some((s) => s.accelerometer);

    if (hasMotion) activeSignals.push("motion");
    if (hasSound) activeSignals.push("sound");
    if (hasLight) activeSignals.push("light");
    if (hasAccel) activeSignals.push("movement");

    // Trigger if 2 or more signals detected
    const isEmergency = activeSignals.length >= 2;

    if (isEmergency) {
      this.lastAlert = Date.now();
    }

    return { isEmergency, signals: activeSignals };
  }

  reset() {
    this.recentSignals = [];
    this.lastAlert = 0;
  }
}

// Motion detection from webcam
export class MotionDetector {
  private previousFrame: ImageData | null = null;
  private threshold = 30;
  private minPixelDiff = 5000;

  detectMotion(currentFrame: ImageData): boolean {
    if (!this.previousFrame) {
      this.previousFrame = currentFrame;
      return false;
    }

    let diffCount = 0;
    const pixels = currentFrame.data.length;

    for (let i = 0; i < pixels; i += 4) {
      const diff =
        Math.abs(currentFrame.data[i] - this.previousFrame.data[i]) +
        Math.abs(currentFrame.data[i + 1] - this.previousFrame.data[i + 1]) +
        Math.abs(currentFrame.data[i + 2] - this.previousFrame.data[i + 2]);

      if (diff > this.threshold) {
        diffCount++;
      }
    }

    this.previousFrame = currentFrame;
    return diffCount > this.minPixelDiff;
  }

  setThreshold(threshold: number) {
    this.threshold = threshold;
  }
}

// Sound level detection
export class SoundDetector {
  private threshold = 70; // Panic sound threshold

  detectPanic(volume: number): boolean {
    return volume > this.threshold;
  }

  setThreshold(threshold: number) {
    this.threshold = threshold;
  }
}

// Light change detection
export class LightDetector {
  private previousBrightness: number | null = null;
  private threshold = 50;

  detectChange(currentBrightness: number): boolean {
    if (this.previousBrightness === null) {
      this.previousBrightness = currentBrightness;
      return false;
    }

    const diff = Math.abs(currentBrightness - this.previousBrightness);
    this.previousBrightness = currentBrightness;

    return diff > this.threshold;
  }

  setThreshold(threshold: number) {
    this.threshold = threshold;
  }
}
