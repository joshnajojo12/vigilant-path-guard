export interface VoiceDetectionConfig {
  secretCode: string;
  requiredRepeats: number;
  timeWindowMs: number;
  sensitivity: number;
}

export class VoiceDetector {
  private recognition: any;
  private detectedPhrases: { phrase: string; timestamp: number }[] = [];
  private config: VoiceDetectionConfig;
  private onTriggerCallback: (() => void) | null = null;
  private onPhraseCallback: ((phrase: string, count: number) => void) | null = null;

  constructor(config: VoiceDetectionConfig) {
    this.config = config;
    this.initializeRecognition();
  }

  private initializeRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];

      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        this.processTranscript(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (this.recognition) {
            try {
              this.recognition.start();
            } catch (e) {
              console.log('Recognition already started');
            }
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      try {
        this.recognition.start();
      } catch (e) {
        console.log('Recognition restart failed');
      }
    };
  }

  private processTranscript(transcript: string) {
    const codeWords = this.config.secretCode.toLowerCase().split(' ');
    const transcriptWords = transcript.split(' ');

    let matchFound = false;
    for (const word of transcriptWords) {
      if (codeWords.some(codeWord => this.similarity(word, codeWord) >= this.config.sensitivity)) {
        matchFound = true;
        break;
      }
    }

    if (matchFound) {
      const now = Date.now();
      this.detectedPhrases.push({ phrase: transcript, timestamp: now });

      this.detectedPhrases = this.detectedPhrases.filter(
        p => now - p.timestamp < this.config.timeWindowMs
      );

      const count = this.detectedPhrases.length;

      if (this.onPhraseCallback) {
        this.onPhraseCallback(transcript, count);
      }

      if (count >= this.config.requiredRepeats) {
        this.triggerEmergency();
      }
    }
  }

  private similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private triggerEmergency() {
    if (this.onTriggerCallback) {
      this.onTriggerCallback();
    }
    this.detectedPhrases = [];
  }

  start() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.log('Recognition already started');
      }
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.detectedPhrases = [];
  }

  onTrigger(callback: () => void) {
    this.onTriggerCallback = callback;
  }

  onPhrase(callback: (phrase: string, count: number) => void) {
    this.onPhraseCallback = callback;
  }

  updateConfig(config: Partial<VoiceDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  getDetectionCount(): number {
    const now = Date.now();
    this.detectedPhrases = this.detectedPhrases.filter(
      p => now - p.timestamp < this.config.timeWindowMs
    );
    return this.detectedPhrases.length;
  }
}
