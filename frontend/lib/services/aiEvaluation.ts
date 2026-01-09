/**
 * AI 기반 답변 평가 서비스
 * FastAPI 백엔드와 통신하여 실제 AI 평가를 수행
 */

import { evaluateAnswerSSE, evaluateAnswerSync, EvaluationResult } from '@/lib/api/sseClient';

export interface EvaluationProgress {
  step: string;
  progress: number;
  message: string;
}

export interface EvaluationCallbacks {
  onProgress?: (progress: EvaluationProgress) => void;
  onComplete?: (result: EvaluationResult) => void;
  onError?: (error: string) => void;
}

/**
 * AI 평가 실행 (SSE 스트리밍)
 */
export async function evaluateWithAI(
  token: string,
  questionId: string,
  question: string,
  answer: string,
  currentLevel: string = 'IM2',
  targetLevel: string = 'IH',
  callbacks?: EvaluationCallbacks
): Promise<EvaluationResult | null> {
  return new Promise((resolve) => {
    evaluateAnswerSSE(
      token,
      {
        question_id: questionId,
        question,
        answer,
        current_level: currentLevel,
        target_level: targetLevel,
      },
      {
        onProgress: (data) => {
          callbacks?.onProgress?.(data);
        },
        onComplete: (result) => {
          callbacks?.onComplete?.(result);
          resolve(result);
        },
        onError: (error) => {
          callbacks?.onError?.(error.message);
          resolve(null);
        },
      }
    );
  });
}

/**
 * AI 평가 실행 (동기식, SSE 미지원 환경용)
 */
export async function evaluateWithAISync(
  token: string,
  questionId: string,
  question: string,
  answer: string,
  currentLevel: string = 'IM2',
  targetLevel: string = 'IH'
): Promise<EvaluationResult> {
  return evaluateAnswerSync(token, {
    question_id: questionId,
    question,
    answer,
    current_level: currentLevel,
    target_level: targetLevel,
  });
}

/**
 * Mock 평가 결과를 EvaluationResult 형식으로 변환
 */
export function convertMockToEvaluationResult(mockResult: any): EvaluationResult {
  return {
    evaluated_level: mockResult.evaluated_level,
    scores: mockResult.scores,
    feedback: mockResult.feedback,
    overall_comment: mockResult.feedback.improvements?.join(' ') || '',
  };
}

/**
 * 환경에 따라 Mock 또는 AI 평가 선택
 */
export function shouldUseAI(): boolean {
  const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
  const useAI = process.env.NEXT_PUBLIC_USE_AI_EVALUATION === 'true';

  return Boolean(fastApiUrl && useAI);
}
