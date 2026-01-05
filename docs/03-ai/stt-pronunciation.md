# STT 및 발음 평가 시스템

## 목차
- [개요](#개요)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [발음 평가 전략](#발음-평가-전략)
- [설치 및 설정](#설치-및-설정)
- [구현 가이드](#구현-가이드)
- [브라우저 호환성](#브라우저-호환성)
- [성능 최적화](#성능-최적화)
- [참고 자료](#참고-자료)

---

## 개요

### 선택한 솔루션
**Whisper WebGPU (Transformers.js @xenova/transformers)**

### 핵심 특징
- ✅ **완전 무료**: 오픈소스, API 비용 없음
- ✅ **클라이언트 사이드**: 음성 파일을 서버에 업로드하지 않음 (프라이버시 보호)
- ✅ **WebGPU 가속**: GPU 활용으로 빠른 처리 속도
- ✅ **오프라인 가능**: 모델 로드 후 인터넷 연결 불필요
- ✅ **단어 수준 발음 평가**: 어느 단어가 잘못 발음되었는지 파악 가능
- ✅ **타임스탬프 지원**: 각 단어의 시작/종료 시간 제공

### 제약사항
- ⚠️ **WebGPU 필수**: Chrome 113+, Edge 113+ 필요
- ⚠️ **HTTPS 필수**: WebGPU API는 보안 컨텍스트에서만 동작
- ⚠️ **초기 로딩**: 첫 실행 시 모델 다운로드 (~100MB, 캐시됨)
- ⚠️ **음소 수준 평가 제한**: 단어 내 개별 발음 오류는 추론 기반

---

## 기술 스택

### Core Libraries
```json
{
  "@xenova/transformers": "^2.17.1"
}
```

### 사용 모델
- **모델**: `Xenova/whisper-tiny.en` (영어 전용, 작은 크기)
- **대안**: `Xenova/whisper-base.en` (더 높은 정확도, 더 큰 크기)
- **크기**:
  - whisper-tiny.en: ~39MB (ONNX) + ~60MB (WebGPU)
  - whisper-base.en: ~74MB (ONNX) + ~140MB (WebGPU)

### Browser APIs
- **MediaRecorder API**: 음성 녹음
- **Web Audio API**: 오디오 전처리
- **WebGPU API**: GPU 가속 추론

---

## 아키텍처

### 전체 플로우

```
사용자 음성 입력
    ↓
MediaRecorder API
    ↓
AudioBlob 생성
    ↓
Whisper WebGPU 처리
    ├─ 음성 → 텍스트 변환
    ├─ 단어별 타임스탬프 추출
    └─ 단어별 Confidence Score 추출
    ↓
발음 분석
    ├─ 낮은 confidence 단어 식별 (< 0.8)
    ├─ 오인식된 단어 탐지
    └─ 발음 오류 위치 파악
    ↓
UI 표시
    ├─ 전체 텍스트 표시
    ├─ 문제 있는 단어 하이라이트
    └─ 타임스탬프 기반 재생 가능
    ↓
FastAPI 전송
    ├─ 텍스트
    ├─ 단어별 confidence scores
    └─ 발음 오류 요약
    ↓
Grok LLM 분석 (선택적)
    ├─ 발음 오류 원인 추론
    ├─ 개선 방법 제안
    └─ 음소 수준 피드백 생성
```

---

## 발음 평가 전략

### Phase 1: MVP - 단어 수준 피드백 (현재)

#### 평가 기준
1. **단어별 Confidence Score**
   - 0.9 이상: 우수
   - 0.8~0.9: 양호
   - 0.7~0.8: 개선 필요
   - 0.7 미만: 발음 오류 가능성 높음

2. **오인식 탐지**
   - 예상 단어와 인식된 단어 비교
   - 철자 유사도 분석 (Levenshtein distance)

3. **전체 발음 점수**
   - 평균 confidence score 기반
   - 오류 단어 개수 고려

#### 피드백 예시
```
✅ 전체 발음 점수: 85/100

📊 단어별 분석:
✅ I (0.98)
✅ went (0.95)
✅ to (0.97)
⚠️ the (0.72) - 발음 개선 권장
❌ cafe (0.58) - /kæfeɪ/로 발음하세요
✅ yesterday (0.92)

💡 개선 포인트:
- "cafe" 단어의 발음이 불명확합니다
- 모음 /eɪ/를 더 또렷하게 발음해보세요
- 7개 단어 중 1개 단어에서 개선이 필요합니다
```

### Phase 2: LLM 기반 발음 추론

#### Grok을 활용한 고급 피드백

**입력 데이터:**
```json
{
  "expected_text": "I went to the cafe yesterday",
  "recognized_text": "I went to the caffy yesterday",
  "word_confidences": [
    { "word": "cafe", "confidence": 0.58, "recognized_as": "caffy" }
  ]
}
```

**LLM 프롬프트:**
```python
prompt = f"""
You are a pronunciation expert. Analyze the following speech recognition result:

Expected: "{expected_text}"
Recognized: "{recognized_text}"

Low confidence words:
{json.dumps(low_confidence_words, indent=2)}

Provide specific pronunciation feedback:
1. Which sounds were likely mispronounced?
2. What is the correct pronunciation in IPA?
3. How can the user improve?

Format:
- Word: [word]
- Issue: [specific phoneme or sound]
- Correct IPA: [IPA notation]
- Tip: [practical advice]
"""
```

**LLM 응답 예시:**
```
Word: cafe
Issue: Final vowel sound /eɪ/ was pronounced as /i/
Correct IPA: /kæˈfeɪ/
Tip: Pronounce the last syllable like "fay" not "fee".
     Open your mouth wider for the /eɪ/ sound.
```

### Phase 3: 전문 발음 평가 API (프로덕션)

#### 옵션 비교

| 특징 | Whisper WebGPU + LLM | ELSA API | SoapBox Labs |
|-----|---------------------|----------|--------------|
| **비용** | 무료 | $0.01~0.05/분 | 커스텀 |
| **정확도** | 단어 수준 | 음소 수준 | 음소 수준 |
| **처리 위치** | 클라이언트 | 서버 | 서버 |
| **프라이버시** | 높음 | 중간 | 중간 |
| **억양 분석** | 불가 | 가능 | 가능 |
| **리듬 분석** | 불가 | 가능 | 가능 |

---

## 설치 및 설정

### 1. 패키지 설치

```bash
npm install @xenova/transformers
```

### 2. Next.js 설정

#### `next.config.js` 수정

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transformers.js WASM/ONNX 파일 처리
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // WASM 파일 처리
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },

  // 헤더 설정 (SharedArrayBuffer 지원)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 3. 환경 변수

```bash
# .env.local
NEXT_PUBLIC_WHISPER_MODEL=Xenova/whisper-tiny.en
```

---

## 구현 가이드

### 1. Whisper 서비스 클래스

```typescript
// lib/whisper/WhisperService.ts
import { pipeline, AutomaticSpeechRecognitionPipeline } from '@xenova/transformers';

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
  private pipeline: AutomaticSpeechRecognitionPipeline | null = null;
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
      // 로딩 중이면 대기
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    try {
      this.isLoading = true;

      this.pipeline = await pipeline(
        'automatic-speech-recognition',
        this.modelName,
        {
          device: 'webgpu',
          dtype: 'fp32',
          progress_callback: (progress: any) => {
            if (onProgress && progress.progress) {
              onProgress(Math.round(progress.progress));
            }
          },
        }
      );

      console.log('✅ Whisper WebGPU 초기화 완료');
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
      // AudioBlob을 ArrayBuffer로 변환
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Whisper 실행 (단어별 타임스탬프 포함)
      const result = await this.pipeline(arrayBuffer, {
        return_timestamps: 'word',
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      // 결과 파싱
      const words: WordTimestamp[] = result.chunks.map((chunk: any) => ({
        word: chunk.text.trim(),
        timestamp: chunk.timestamp,
        confidence: chunk.confidence || 0.0,
      }));

      const avgConfidence = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;

      const lowConfidenceWords = words.filter(w => w.confidence < 0.8);

      return {
        text: result.text,
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
      // @ts-ignore - dispose 메서드가 존재하는 경우
      if (typeof this.pipeline.dispose === 'function') {
        await this.pipeline.dispose();
      }
      this.pipeline = null;
    }
  }
}

export default WhisperService;
```

### 2. 음성 녹음 컴포넌트

```typescript
// components/VoiceRecorder.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import WhisperService, { TranscriptionResult } from '@/lib/whisper/WhisperService';

interface VoiceRecorderProps {
  onTranscriptionComplete: (result: TranscriptionResult) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [isModelReady, setIsModelReady] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const whisperService = WhisperService.getInstance();

  // 모델 초기화
  const initializeModel = useCallback(async () => {
    try {
      await whisperService.initialize((progress) => {
        setModelProgress(progress);
      });
      setIsModelReady(true);
    } catch (error) {
      console.error('모델 초기화 실패:', error);
      alert('음성 인식 모델 로딩에 실패했습니다.');
    }
  }, []);

  // 녹음 시작
  const startRecording = async () => {
    try {
      // 모델이 준비되지 않았으면 초기화
      if (!isModelReady) {
        await initializeModel();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // 음성 인식 처리
        setIsProcessing(true);
        try {
          const result = await whisperService.transcribe(audioBlob);
          onTranscriptionComplete(result);
        } catch (error) {
          console.error('음성 인식 실패:', error);
          alert('음성 인식에 실패했습니다.');
        } finally {
          setIsProcessing(false);
        }

        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 모델 로딩 상태 */}
      {!isModelReady && modelProgress > 0 && (
        <div className="w-full max-w-md">
          <div className="text-sm text-gray-600 mb-2">
            음성 인식 모델 로딩 중... {modelProgress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${modelProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 녹음 버튼 */}
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? '처리 중...' : '녹음 시작'}
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          녹음 중지
        </button>
      )}

      {/* 녹음 상태 표시 */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">녹음 중...</span>
        </div>
      )}
    </div>
  );
}
```

### 3. 발음 분석 컴포넌트

```typescript
// components/PronunciationFeedback.tsx
'use client';

import { TranscriptionResult } from '@/lib/whisper/WhisperService';

interface PronunciationFeedbackProps {
  result: TranscriptionResult;
}

export default function PronunciationFeedback({ result }: PronunciationFeedbackProps) {
  // 전체 발음 점수 계산 (0-100)
  const pronunciationScore = Math.round(result.avgConfidence * 100);

  // 점수에 따른 등급
  const getGrade = (score: number) => {
    if (score >= 90) return { label: '우수', color: 'text-green-600' };
    if (score >= 80) return { label: '양호', color: 'text-blue-600' };
    if (score >= 70) return { label: '보통', color: 'text-yellow-600' };
    return { label: '개선 필요', color: 'text-red-600' };
  };

  const grade = getGrade(pronunciationScore);

  return (
    <div className="space-y-6">
      {/* 전체 점수 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">전체 발음 점수</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{pronunciationScore}</div>
          <div className={`text-xl ${grade.color}`}>{grade.label}</div>
        </div>
      </div>

      {/* 인식된 텍스트 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">인식된 텍스트</h3>
        <p className="text-gray-800 leading-relaxed">{result.text}</p>
      </div>

      {/* 단어별 분석 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">단어별 분석</h3>
        <div className="space-y-2">
          {result.words.map((word, index) => {
            const isLowConfidence = word.confidence < 0.8;
            const isVeryLow = word.confidence < 0.7;

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded ${
                  isVeryLow
                    ? 'bg-red-50 border border-red-200'
                    : isLowConfidence
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium">{word.word}</span>
                  <span className="text-xs text-gray-500">
                    {word.timestamp[0].toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isVeryLow
                          ? 'bg-red-600'
                          : isLowConfidence
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${word.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {Math.round(word.confidence * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 개선 포인트 */}
      {result.lowConfidenceWords.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-amber-900">💡 개선 포인트</h3>
          <ul className="space-y-2">
            {result.lowConfidenceWords.map((word, index) => (
              <li key={index} className="text-amber-800">
                <span className="font-medium">{word.word}</span> 단어의 발음이 불명확합니다
                <span className="text-sm text-amber-600 ml-2">
                  (신뢰도: {Math.round(word.confidence * 100)}%)
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-amber-700">
            전체 {result.words.length}개 단어 중 {result.lowConfidenceWords.length}개 단어에서
            개선이 필요합니다.
          </p>
        </div>
      )}
    </div>
  );
}
```

### 4. 사용 예시

```typescript
// app/practice/page.tsx
'use client';

import { useState } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import PronunciationFeedback from '@/components/PronunciationFeedback';
import { TranscriptionResult } from '@/lib/whisper/WhisperService';

export default function PracticePage() {
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  const handleTranscription = async (transcriptionResult: TranscriptionResult) => {
    setResult(transcriptionResult);

    // FastAPI로 전송하여 Grok 분석 받기
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text: transcriptionResult.text,
          words: transcriptionResult.words,
          avgConfidence: transcriptionResult.avgConfidence,
        }),
      });

      const evaluation = await response.json();
      console.log('Grok 평가:', evaluation);
    } catch (error) {
      console.error('평가 전송 실패:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">발음 연습</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 녹음 영역 */}
        <div>
          <VoiceRecorder onTranscriptionComplete={handleTranscription} />
        </div>

        {/* 결과 영역 */}
        <div>
          {result && <PronunciationFeedback result={result} />}
        </div>
      </div>
    </div>
  );
}
```

---

## 브라우저 호환성

### WebGPU 지원 현황 (2026년 1월 기준)

| 브라우저 | 버전 | 지원 여부 |
|---------|-----|---------|
| Chrome | 113+ | ✅ 지원 |
| Edge | 113+ | ✅ 지원 |
| Firefox | 미지원 | ❌ 2024년 하반기 예정 |
| Safari | 미지원 | ❌ 개발 중 |
| Mobile Chrome | Android 121+ | ✅ 지원 |
| Mobile Safari | 미지원 | ❌ |

### Fallback 전략

#### 1. WebGPU 미지원 브라우저 감지

```typescript
// lib/whisper/browserCheck.ts
export async function checkWebGPUSupport(): Promise<boolean> {
  if (!navigator.gpu) {
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

export async function checkBrowserCompatibility() {
  const hasWebGPU = await checkWebGPUSupport();
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  return {
    webgpu: hasWebGPU,
    mediaRecorder: hasMediaRecorder,
    https: isHTTPS,
    isCompatible: hasWebGPU && hasMediaRecorder && isHTTPS,
  };
}
```

#### 2. 대체 방안 제시

```typescript
// components/BrowserCheck.tsx
'use client';

import { useEffect, useState } from 'react';
import { checkBrowserCompatibility } from '@/lib/whisper/browserCheck';

export default function BrowserCheck({ children }: { children: React.ReactNode }) {
  const [compatibility, setCompatibility] = useState<any>(null);

  useEffect(() => {
    checkBrowserCompatibility().then(setCompatibility);
  }, []);

  if (!compatibility) {
    return <div>브라우저 호환성 확인 중...</div>;
  }

  if (!compatibility.isCompatible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            브라우저 호환성 문제
          </h2>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              {compatibility.webgpu ? '✅' : '❌'}
              <span>WebGPU 지원</span>
            </div>
            <div className="flex items-center gap-2">
              {compatibility.https ? '✅' : '❌'}
              <span>HTTPS 연결</span>
            </div>
            <div className="flex items-center gap-2">
              {compatibility.mediaRecorder ? '✅' : '❌'}
              <span>음성 녹음 지원</span>
            </div>
          </div>

          <p className="text-gray-700 mb-4">
            이 서비스를 이용하려면 다음 브라우저를 사용하세요:
          </p>

          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-6">
            <li>Google Chrome 113 이상</li>
            <li>Microsoft Edge 113 이상</li>
            <li>Android Chrome 121 이상</li>
          </ul>

          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Chrome 다운로드
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 성능 최적화

### 1. 모델 캐싱

```typescript
// Transformers.js는 자동으로 IndexedDB에 모델 캐시
// 첫 실행: ~100MB 다운로드 (1~2분)
// 이후 실행: 캐시에서 로드 (수 초)
```

### 2. Web Worker 활용 (선택적)

```typescript
// lib/whisper/whisper.worker.ts
import { pipeline } from '@xenova/transformers';

let transcriber: any = null;

self.onmessage = async (event) => {
  const { type, data } = event.data;

  if (type === 'initialize') {
    transcriber = await pipeline(
      'automatic-speech-recognition',
      data.model,
      { device: 'webgpu' }
    );
    self.postMessage({ type: 'ready' });
  }

  if (type === 'transcribe') {
    const result = await transcriber(data.audio, {
      return_timestamps: 'word',
    });
    self.postMessage({ type: 'result', data: result });
  }
};
```

### 3. 오디오 전처리

```typescript
// 녹음 품질 최적화
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000, // 128kbps (충분한 음질)
});
```

---

## 참고 자료

### 공식 문서
- [Transformers.js 공식 문서](https://huggingface.co/docs/transformers.js)
- [Whisper WebGPU Demo](https://huggingface.co/spaces/Xenova/whisper-web)
- [WebGPU 사양](https://www.w3.org/TR/webgpu/)

### 관련 저장소
- [Xenova/whisper-web](https://github.com/xenova/whisper-web) - Whisper WebGPU 데모
- [Xenova/transformers.js](https://github.com/xenova/transformers.js) - 메인 라이브러리

### 발음 평가 연구
- [Confidence Score for Pronunciation Assessment](https://arxiv.org/abs/2203.09127)
- [Forced Alignment for Pronunciation Feedback](https://www.phonetik.uni-muenchen.de/forschung/publikationen/Bissiri_PaPI2007.pdf)

### 추가 도구 (고급)
- [Montreal Forced Aligner](https://montreal-forced-aligner.readthedocs.io/) - 음소 수준 정렬
- [ELSA Speak API](https://elsaspeak.com/en/solutions/api/) - 프로덕션 발음 평가
- [SoapBox Labs](https://www.soapboxlabs.com/) - 어린이 음성 인식 전문

---

## 다음 단계

### MVP 구현 체크리스트
- [ ] Transformers.js 설치 및 Next.js 설정
- [ ] WhisperService 클래스 구현
- [ ] VoiceRecorder 컴포넌트 작성
- [ ] PronunciationFeedback UI 구현
- [ ] FastAPI 연동 (텍스트 + confidence scores 전송)
- [ ] 브라우저 호환성 체크 추가

### Phase 2 준비
- [ ] Grok LLM 발음 피드백 프롬프트 작성
- [ ] 음소 수준 피드백 UI 디자인
- [ ] 오인식 패턴 분석 로직 개발

### 성능 테스트
- [ ] 다양한 브라우저에서 테스트
- [ ] 모바일 환경 테스트
- [ ] 네트워크 속도별 로딩 시간 측정
- [ ] 메모리 사용량 모니터링
