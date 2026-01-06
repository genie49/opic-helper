'use client';

import { TranscriptionResult } from '@/lib/whisper/WhisperService';

interface PronunciationFeedbackProps {
  result: TranscriptionResult;
}

export default function PronunciationFeedback({ result }: PronunciationFeedbackProps) {
  const pronunciationScore = Math.round(result.avgConfidence * 100);

  const getGrade = (score: number) => {
    if (score >= 90) return { label: '우수', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (score >= 80) return { label: '양호', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (score >= 70) return { label: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { label: '개선 필요', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const grade = getGrade(pronunciationScore);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">전체 발음 점수</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{pronunciationScore}</div>
          <div className={`text-xl ${grade.color}`}>{grade.label}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">인식된 텍스트</h3>
        <p className="text-gray-800 leading-relaxed">{result.text}</p>
      </div>

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
                    ? grade.bgColor + ' ' + grade.borderColor
                    : isLowConfidence
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                } border`}
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
