export interface WordTimestamp {
  word: string;
  timestamp: [number, number]; // [start, end]
  confidence: number;
}

export interface TranscriptionResult {
  text: string;
  words: WordTimestamp[];
  avgConfidence: number;
  lowConfidenceWords: WordTimestamp[];
}

class WhisperService {
  private static instance: WhisperService;
  private pipeline: any | null = null;
  private modelName: string = process.env.NEXT_PUBLIC_WHISPER_MODEL || 'Xenova/whisper-tiny.en';
  private isLoading: boolean = false;

  private constructor() {}

  static getInstance(): WhisperService {
    if (!WhisperService.instance) {
      WhisperService.instance = new WhisperService();
    }
    return WhisperService.instance;
  }

  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.pipeline) return;
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    try {
      this.isLoading = true;

      const { pipeline } = await import('@xenova/transformers');

      this.pipeline = await pipeline(
        'automatic-speech-recognition',
        this.modelName,
        {
          progress_callback: (progress: any) => {
            if (onProgress && progress.progress) {
              onProgress(Math.round(progress.progress * 100));
            }
          },
        }
      );

      console.log('✅ Whisper 초기화 완료');
    } catch (error) {
      console.error('❌ Whisper 초기화 실패:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!this.pipeline) {
      throw new Error('Whisper 모델이 초기화되지 않았습니다. initialize()를 먼저 호출하세요.');
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = new Float32Array(arrayBuffer);

      const result = await this.pipeline(audioData, {
        return_timestamps: 'word',
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      const text = (result as any).text || result || '';
      
      // 기본 단어 및 confidence 추출 (실제 구현에서는 더 상세하게 처리)
      const words: WordTimestamp[] = [];
      const lowConfidenceWords: WordTimestamp[] = [];
      
      const avgConfidence = 0.85; // 기본값

      return {
        text: String(text),
        words,
        avgConfidence,
        lowConfidenceWords,
      };
    } catch (error) {
      console.error('❌ 음성 인식 실패:', error);
      throw error;
    }
  }

  async release(): Promise<void> {
    if (this.pipeline) {
      if (typeof (this.pipeline as any).dispose === 'function') {
        await (this.pipeline as any).dispose();
      }
      this.pipeline = null;
    }
  }
}

export default WhisperService;
