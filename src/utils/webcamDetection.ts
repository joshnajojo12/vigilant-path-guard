export interface WebcamDetectionConfig {
  motionThreshold: number;
  lightChangeThreshold: number;
  samplingRate: number;
}

export interface WebcamData {
  motion: number;
  lightChange: number;
  averageBrightness: number;
}

export class WebcamDetector {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private previousFrameData: ImageData | null = null;
  private config: WebcamDetectionConfig;
  private animationFrameId: number | null = null;
  private onDetectionCallback: ((data: WebcamData) => void) | null = null;
  private stream: MediaStream | null = null;
  private lastBrightness: number = 0;

  constructor(config: WebcamDetectionConfig) {
    this.config = config;
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;

    this.canvasElement = document.createElement('canvas');
    this.context = this.canvasElement.getContext('2d', { willReadFrequently: true })!;
  }

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false
      });

      this.videoElement.srcObject = this.stream;

      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.canvasElement.width = this.videoElement.videoWidth;
          this.canvasElement.height = this.videoElement.videoHeight;
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Failed to initialize webcam:', error);
      throw error;
    }
  }

  start() {
    if (this.animationFrameId) return;
    this.detectChanges();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.previousFrameData = null;
  }

  private detectChanges() {
    this.context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
    const currentFrameData = this.context.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);

    if (this.previousFrameData) {
      const motion = this.calculateMotion(this.previousFrameData, currentFrameData);
      const brightness = this.calculateBrightness(currentFrameData);
      const lightChange = Math.abs(brightness - this.lastBrightness);

      const data: WebcamData = {
        motion,
        lightChange,
        averageBrightness: brightness
      };

      if (this.onDetectionCallback) {
        this.onDetectionCallback(data);
      }

      this.lastBrightness = brightness;
    }

    this.previousFrameData = currentFrameData;

    this.animationFrameId = requestAnimationFrame(() => this.detectChanges());
  }

  private calculateMotion(prevFrame: ImageData, currFrame: ImageData): number {
    const prevData = prevFrame.data;
    const currData = currFrame.data;
    let totalDiff = 0;
    const pixelCount = prevData.length / 4;

    for (let i = 0; i < prevData.length; i += 4) {
      const rDiff = Math.abs(prevData[i] - currData[i]);
      const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
      const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);
      totalDiff += (rDiff + gDiff + bDiff) / 3;
    }

    return Math.min(totalDiff / pixelCount / 255, 1);
  }

  private calculateBrightness(frame: ImageData): number {
    const data = frame.data;
    let totalBrightness = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }

    return totalBrightness / pixelCount / 255;
  }

  onDetection(callback: (data: WebcamData) => void) {
    this.onDetectionCallback = callback;
  }

  updateConfig(config: Partial<WebcamDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  getCanvasElement(): HTMLCanvasElement {
    return this.canvasElement;
  }
}
