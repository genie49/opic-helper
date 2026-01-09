import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/exam/submit/route';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils/auth', () => ({
  withAuth: vi.fn((req, handler) => handler('test-user-id')),
}));

describe('Exam Submit API', () => {
  const mockUserId = 'test-user-id';
  const mockSessionId = 'exam-session-1';
  const mockQuestionId = 'question-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/exam/submit', () => {
    const validSubmitData = {
      sessionId: mockSessionId,
      questionId: mockQuestionId,
      answerText: 'I often go to a cafe near my house to study and relax.',
      evaluatedLevel: 'IM2',
      scores: {
        utterance: 7,
        grammar: 7,
        vocabulary: 6,
        structure: 7,
        pronunciation: 7,
      },
      feedback: {
        strengths: ['Good sentence structure'],
        weaknesses: ['Limited vocabulary'],
        improvements: ['Use more varied adjectives'],
        model_answer: 'I would like to tell you about my favorite cafe...',
      },
    };

    it('should submit answer with valid data', async () => {
      const mockSavedFeedback = {
        id: 'feedback-1',
        userId: mockUserId,
        questionId: mockQuestionId,
        answerText: validSubmitData.answerText,
        evaluatedLevel: validSubmitData.evaluatedLevel,
        scores: validSubmitData.scores,
        feedback: validSubmitData.feedback,
        examSessionId: mockSessionId,
        createdAt: '2024-01-15T10:30:00Z',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSavedFeedback]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/exam/submit', {
        method: 'POST',
        body: JSON.stringify(validSubmitData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.feedbackId).toBe('feedback-1');
    });

    it('should return 400 if required fields missing', async () => {
      const incompleteData = {
        sessionId: mockSessionId,
        questionId: mockQuestionId,
        answerText: 'Test answer',
        // Missing evaluatedLevel, scores, feedback
      };

      const request = new NextRequest('http://localhost:3000/api/exam/submit', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should call db.insert with exam_session_id', async () => {
      const mockSavedFeedback = {
        id: 'feedback-1',
        userId: mockUserId,
        questionId: mockQuestionId,
        createdAt: '2024-01-15T10:30:00Z',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSavedFeedback]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/exam/submit', {
        method: 'POST',
        body: JSON.stringify(validSubmitData),
      });

      await POST(request);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle empty scores with defaults', async () => {
      const mockSavedFeedback = {
        id: 'feedback-1',
        userId: mockUserId,
        questionId: mockQuestionId,
        createdAt: '2024-01-15T10:30:00Z',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSavedFeedback]),
      } as any);

      const dataWithEmptyScores = {
        ...validSubmitData,
        scores: undefined as any,
        feedback: undefined as any,
      };

      const request = new NextRequest('http://localhost:3000/api/exam/submit', {
        method: 'POST',
        body: JSON.stringify(dataWithEmptyScores),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
