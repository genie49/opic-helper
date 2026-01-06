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
  }, [whisperService]);

  const startRecording = async () => {
    try {
      if (!isModelReady) {
        await initializeModel();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
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

      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? '처리 중...' : '녹음 시작'}
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          녹음 중지
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">녹음 중...</span>
        </div>
      )}
    </div>
  );
}
