export interface MotionDetectionConfig {
  movementThreshold: number;
  samplingRate: number;
}

export interface MotionData {
  acceleration: number;
  isRunning: boolean;
  isFalling: boolean;
  movementIntensity: number;
}

export class MotionDetector {
  private config: MotionDetectionConfig;
  private onDetectionCallback: ((data: MotionData) => void) | null = null;
  private isActive: boolean = false;
  private previousAcceleration: { x: number; y: number; z: number } | null = null;
  private accelerationHistory: number[] = [];
  private readonly historySize = 10;

  constructor(config: MotionDetectionConfig) {
    this.config = config;
  }

  start() {
    if (this.isActive) return;

    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', this.handleMotion);
      this.isActive = true;
    } else {
      console.error('Device motion not supported');
    }
  }

  stop() {
    if (!this.isActive) return;

    window.removeEventListener('devicemotion', this.handleMotion);
    this.isActive = false;
    this.previousAcceleration = null;
    this.accelerationHistory = [];
  }

  private handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const current = { x: acc.x, y: acc.y, z: acc.z };

    if (this.previousAcceleration) {
      const deltaX = Math.abs(current.x - this.previousAcceleration.x);
      const deltaY = Math.abs(current.y - this.previousAcceleration.y);
      const deltaZ = Math.abs(current.z - this.previousAcceleration.z);

      const totalAcceleration = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

      this.accelerationHistory.push(totalAcceleration);
      if (this.accelerationHistory.length > this.historySize) {
        this.accelerationHistory.shift();
      }

      const avgAcceleration = this.accelerationHistory.reduce((a, b) => a + b, 0) / this.accelerationHistory.length;
      const normalizedAcceleration = Math.min(avgAcceleration / 20, 1);

      const isRunning = this.detectRunning(this.accelerationHistory);
      const isFalling = this.detectFalling(current, this.previousAcceleration);
      const movementIntensity = normalizedAcceleration;

      const data: MotionData = {
        acceleration: normalizedAcceleration,
        isRunning,
        isFalling,
        movementIntensity
      };

      if (this.onDetectionCallback) {
        this.onDetectionCallback(data);
      }
    }

    this.previousAcceleration = current;
  };

  private detectRunning(history: number[]): boolean {
    if (history.length < 5) return false;

    const recentAvg = history.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const variance = history.slice(-5).reduce((sum, val) => {
      return sum + Math.pow(val - recentAvg, 2);
    }, 0) / 5;

    return recentAvg > 5 && variance > 10;
  }

  private detectFalling(current: { x: number; y: number; z: number }, previous: { x: number; y: number; z: number }): boolean {
    const verticalDelta = Math.abs(current.z - previous.z);
    const suddenDrop = current.z < -15 && verticalDelta > 10;

    const totalAcceleration = Math.sqrt(
      Math.pow(current.x - previous.x, 2) +
      Math.pow(current.y - previous.y, 2) +
      Math.pow(current.z - previous.z, 2)
    );

    return suddenDrop || totalAcceleration > 25;
  }

  onDetection(callback: (data: MotionData) => void) {
    this.onDetectionCallback = callback;
  }

  updateConfig(config: Partial<MotionDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  isSupported(): boolean {
    return 'DeviceMotionEvent' in window;
  }
}
