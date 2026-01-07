import { useState, useRef, useCallback, useEffect } from 'react';
import WhisperService, { TranscriptionResult } from '@/lib/whisper/WhisperService';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onTranscriptionComplete: (result: TranscriptionResult) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [isModelReady, setIsModelReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const whisperService = WhisperService.getInstance();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeModel = useCallback(async () => {
    try {
      await whisperService.initialize((progress) => {
        setModelProgress(progress);
      });
      setIsModelReady(true);
    } catch (error) {
      console.error('모델 초기화 실패:', error);
    }
  }, [whisperService]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 마이크 접근을 지원하지 않습니다.');
      }

      if (!isModelReady) {
        await initializeModel();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      stream.getTracks().forEach(track => {
        track.onended = () => {
          console.log('마이크 트랙이 종료되었습니다.');
        };
      });

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
        } finally {
          setIsProcessing(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setPermissionDenied(false);
    } catch (error: any) {
      console.error('녹음 시작 실패:', error);

      if (error.name === 'NotAllowedError') {
        setPermissionDenied(true);
      } else if (error.name === 'NotFoundError') {
        alert('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
      } else if (error.name === 'NotReadableError') {
        alert('마이크에 접근할 수 없습니다. 다른 앱에서 사용 중인지 확인해주세요.');
      } else {
        alert(`녹음 시작 실패: ${error.message || '알 수 없는 오류'}`);
      }
    }
  };

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionDenied(false);
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setPermissionDenied(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-8">
       {permissionDenied && (
         <div className="w-full max-w-md p-6 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
           <div className="flex items-start gap-4">
             <div className="p-2 bg-rose-100 rounded-full shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             </div>
             <div className="flex-1">
               <h5 className="font-bold text-rose-900 text-sm mb-2">마이크 접근 권한 필요</h5>
               <p className="text-xs text-rose-700 mb-4 leading-relaxed">
                 음성 녹음 기능을 사용하려면 마이크 접근 권한을 허용해야 합니다.
                 브라우저 설정에서 권한을 허용한 후 아래 버튼을 클릭하세요.
               </p>
               <button
                 onClick={requestPermission}
                 className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors"
               >
                 권한 다시 요청
               </button>
             </div>
           </div>
         </div>
       )}

       {!isModelReady && modelProgress > 0 && (
        <div className="w-full max-w-md p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h5 className="font-bold text-slate-800 text-sm">음성 엔진 준비 중</h5>
              <p className="text-[10px] text-slate-400">최초 1회만 모델을 다운로드합니다.</p>
            </div>
            <span className="text-sm font-black text-primary">{modelProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${modelProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="relative flex flex-col items-center">
        {/* Recording Animation Ring */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
            <div className="absolute -inset-4 rounded-full border-2 border-rose-500/10 animate-pulse" />
          </>
        )}

        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isRecording 
              ? 'bg-rose-500 hover:bg-rose-600 scale-110' 
              : 'bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95'
          } disabled:opacity-50 disabled:cursor-wait`}
        >
          {isProcessing ? (
            <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          )}
        </button>

        <div className="mt-6 text-center">
          {isRecording ? (
            <div className="space-y-1">
              <div className="text-2xl font-black tracking-widest tabular-nums text-slate-800">
                {formatTime(recordingTime)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Recording</span>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="text-sm font-bold text-slate-400 animate-pulse">
              답변 분석 중...
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-400">
              {isModelReady ? '클릭하여 답변 시작' : '클릭하여 엔진 로드 및 시작'}
            </div>
          )}
        </div>
      </div>

      {/* Constraints info */}
      <div className="flex gap-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Max 2:00
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          AI Secure
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          HD Audio
        </div>
      </div>
    </div>
  );
}
