/**
 * SSE (Server-Sent Events) 클라이언트
 * FastAPI 백엔드와 실시간 통신을 위한 유틸리티
 */

export interface SSEEventHandlers<T = unknown> {
  onProgress?: (data: ProgressEvent) => void;
  onComplete?: (data: T) => void;
  onChunk?: (data: ChunkEvent) => void;
  onDone?: (data: DoneEvent) => void;
  onError?: (error: ErrorEvent) => void;
}

export interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
}

export interface ChunkEvent {
  content: string;
  done: boolean;
}

export interface DoneEvent {
  content: string;
  done: boolean;
  conversation_count?: number;
}

export interface ErrorEvent {
  message: string;
}

export interface EvaluationResult {
  evaluated_level: string;
  scores: {
    utterance: number;
    grammar: number;
    vocabulary: number;
    structure: number;
    pronunciation: number;
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    model_answer: string;
  };
  overall_comment: string;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8080';

/**
 * SSE 연결을 통한 답변 평가
 */
export async function evaluateAnswerSSE(
  token: string,
  request: {
    question_id: string;
    question: string;
    answer: string;
    current_level?: string;
    target_level?: string;
  },
  handlers: SSEEventHandlers<EvaluationResult>
): Promise<void> {
  const response = await fetch(`${FASTAPI_URL}/api/evaluate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    handlers.onError?.({ message: error.detail || '평가 요청 실패' });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError?.({ message: 'SSE 스트림을 읽을 수 없습니다' });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const eventType = line.replace('event:', '').trim();
          continue;
        }

        if (line.startsWith('data:')) {
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            // 이벤트 타입에 따라 핸들러 호출
            if (data.step !== undefined && data.progress !== undefined) {
              handlers.onProgress?.(data as ProgressEvent);
            } else if (data.result !== undefined) {
              handlers.onComplete?.(data.result as EvaluationResult);
            } else if (data.message !== undefined && !data.progress) {
              handlers.onError?.(data as ErrorEvent);
            }
          } catch (e) {
            console.error('SSE 데이터 파싱 오류:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * SSE 연결을 통한 롤플레이 대화
 */
export async function roleplayChatSSE(
  token: string,
  request: {
    session_id: string;
    message: string;
    scenario: string;
    ai_role: string;
    ai_role_details: string;
  },
  handlers: SSEEventHandlers
): Promise<void> {
  const response = await fetch(`${FASTAPI_URL}/api/roleplay/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    handlers.onError?.({ message: error.detail || '대화 요청 실패' });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError?.({ message: 'SSE 스트림을 읽을 수 없습니다' });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.done === false) {
              handlers.onChunk?.(data as ChunkEvent);
            } else if (data.done === true) {
              handlers.onDone?.(data as DoneEvent);
            } else if (data.message !== undefined) {
              handlers.onError?.(data as ErrorEvent);
            }
          } catch (e) {
            console.error('SSE 데이터 파싱 오류:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 롤플레이 세션 시작
 */
export async function startRoleplay(
  token: string,
  request: {
    scenario: string;
    ai_role: string;
    ai_role_details: string;
    expected_interactions?: number;
  }
): Promise<{ session_id: string; greeting: string }> {
  const response = await fetch(`${FASTAPI_URL}/api/roleplay/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '롤플레이 시작 실패');
  }

  return response.json();
}

/**
 * 롤플레이 세션 종료
 */
export async function endRoleplay(
  token: string,
  sessionId: string
): Promise<void> {
  const response = await fetch(`${FASTAPI_URL}/api/roleplay/end?session_id=${sessionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '롤플레이 종료 실패');
  }
}

/**
 * 동기식 답변 평가 (SSE 미지원 환경용)
 */
export async function evaluateAnswerSync(
  token: string,
  request: {
    question_id: string;
    question: string;
    answer: string;
    current_level?: string;
    target_level?: string;
  }
): Promise<EvaluationResult> {
  const response = await fetch(`${FASTAPI_URL}/api/evaluate/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '평가 요청 실패');
  }

  const data = await response.json();
  return data.result;
}
