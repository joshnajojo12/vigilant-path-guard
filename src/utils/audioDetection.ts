export interface AudioDetectionConfig {
  soundThreshold: number;
  panicDetectionEnabled: boolean;
  samplingRate: number;
}

export interface AudioData {
  volume: number;
  frequency: number;
  isPanic: boolean;
}

export class AudioDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private config: AudioDetectionConfig;
  private animationFrameId: number | null = null;
  private onDetectionCallback: ((data: AudioData) => void) | null = null;
  private stream: MediaStream | null = null;

  constructor(config: AudioDetectionConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  start() {
    if (this.animationFrameId) return;
    this.detectAudio();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private detectAudio() {
    if (!this.analyser || !this.dataArray) return;

    this.analyser.getByteTimeDomainData(this.dataArray);

    const volume = this.calculateVolume(this.dataArray);
    const frequency = this.calculateDominantFrequency();
    const isPanic = this.detectPanicVoice(volume, frequency);

    const data: AudioData = {
      volume,
      frequency,
      isPanic
    };

    if (this.onDetectionCallback) {
      this.onDetectionCallback(data);
    }

    this.animationFrameId = requestAnimationFrame(() => this.detectAudio());
  }

  private calculateVolume(dataArray: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(rms * 2, 1);
  }

  private calculateDominantFrequency(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray);

    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }

    const nyquist = (this.audioContext?.sampleRate || 44100) / 2;
    return (maxIndex * nyquist) / this.dataArray.length;
  }

  private detectPanicVoice(volume: number, frequency: number): boolean {
    if (!this.config.panicDetectionEnabled) return false;

    const isPanicVolume = volume > 0.7;
    const isPanicFrequency = frequency > 300 && frequency < 3000;
    const isHighPitched = frequency > 1000;

    return isPanicVolume && isPanicFrequency && isHighPitched;
  }

  onDetection(callback: (data: AudioData) => void) {
    this.onDetectionCallback = callback;
  }

  updateConfig(config: Partial<AudioDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}
