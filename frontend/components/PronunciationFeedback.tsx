import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TranscriptionResult } from '@/lib/whisper/WhisperService';

interface PronunciationFeedbackProps {
  result: TranscriptionResult;
}

export default function PronunciationFeedback({ result }: PronunciationFeedbackProps) {
  const pronunciationScore = Math.round(result.avgConfidence * 100);

  const getGrade = (score: number) => {
    if (score >= 90) return { label: '우수', color: 'text-emerald-600', bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    if (score >= 80) return { label: '양호', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (score >= 70) return { label: '보통', color: 'text-amber-600', bgColor: 'bg-amber-500', lightBg: 'bg-amber-50', borderColor: 'border-amber-200' };
    return { label: '개선 필요', color: 'text-rose-600', bgColor: 'bg-rose-500', lightBg: 'bg-rose-50', borderColor: 'border-rose-200' };
  };

  const grade = getGrade(pronunciationScore);

  return (
    <div className="divide-y divide-slate-100">
      {/* Summary Section */}
      <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50/50">
        <div className="flex items-center gap-6">
          <div className={`flex items-center justify-center w-20 h-20 rounded-2xl ${grade.lightBg} ${grade.color} shadow-inner`}>
            <span className="text-3xl font-black">{pronunciationScore}</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">발음 정확도</h4>
            <div className={`text-2xl font-black ${grade.color}`}>{grade.label}</div>
          </div>
        </div>
        
        <div className="flex-1 max-w-md w-full">
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${grade.bgColor} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
              style={{ width: `${pronunciationScore}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-bold text-slate-400">0%</span>
            <span className="text-[10px] font-bold text-slate-400 italic">평균 대비 양호</span>
            <span className="text-[10px] font-bold text-slate-400">100%</span>
          </div>
        </div>
      </div>

      {/* Transcription Text */}
      <div className="p-8">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">인식된 스크립트</h4>
        <div className="relative p-6 rounded-2xl bg-white border border-slate-100 shadow-sm leading-relaxed text-slate-700 text-lg italic">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="absolute -top-3 -left-2 text-slate-100"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.89543 14.9124 3 16.017 3H19.017C21.2261 3 23.017 4.79086 23.017 7V15C23.017 18.866 19.883 22 16.017 22H14.017V21ZM1 15C1 18.866 4.13401 22 8 22H10V21L10 18C10 16.8954 9.10457 16 8 16H5C4.44772 16 4 15.5523 4 15V9C4 8.44772 4.44772 8 5 8H8C9.10457 8 10 7.10457 10 6V5C10 3.89543 9.10457 3 8 3H5C2.79086 3 1 4.79086 1 7V15Z"/></svg>
          {result.text}
        </div>
      </div>

      {/* Word Analysis */}
      <div className="p-8">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
          <span>단어별 정밀 분석</span>
          <span className="text-[10px] font-normal lowercase normal-case">단어를 클릭하여 세부 정보를 확인하세요</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {result.words.map((word, index) => {
            const wordScore = Math.round(word.confidence * 100);
            const wordGrade = getGrade(wordScore);
            
            return (
              <div
                key={index}
                className={`group relative flex flex-col items-center p-3 px-4 rounded-xl border transition-all cursor-help hover:-translate-y-1 ${wordGrade.lightBg} ${wordGrade.borderColor} border-transparent hover:shadow-md`}
              >
                <span className={`text-base font-bold ${wordGrade.color}`}>{word.word}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-1">{wordScore}%</span>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl z-20">
                  <div className="flex justify-between mb-1">
                    <span>타임스탬프:</span>
                    <span className="font-bold">{word.timestamp[0].toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div className={`h-full ${wordGrade.bgColor}`} style={{ width: `${wordScore}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Feedback */}
      {result.lowConfidenceWords.length > 0 && (
        <div className="p-8 bg-rose-50/50">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-rose-100 shadow-sm">
            <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h5 className="font-bold text-rose-900 mb-1">발음 개선이 필요한 단어</h5>
              <p className="text-sm text-rose-800/70 mb-4">다음 단어들은 AI가 인식하기에 다소 불분명했습니다. 더 명확하게 발음해 보세요.</p>
              <div className="flex flex-wrap gap-2">
                {result.lowConfidenceWords.map((word, index) => (
                  <span key={index} className="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 text-sm font-bold">
                    {word.word} <span className="text-[10px] font-normal opacity-60">({Math.round(word.confidence * 100)}%)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
