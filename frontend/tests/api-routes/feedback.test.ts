import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/feedback/route';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils/auth', () => ({
  withAuth: vi.fn((req, handler) => handler('test-user-id')),
}));

describe('Feedback API', () => {
  const mockUserId = 'test-user-id';
  const mockQuestionId = 'question-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/feedback', () => {
    const validFeedbackData = {
      questionId: mockQuestionId,
      answerText: 'I often go to a cafe near my house...',
      evaluatedLevel: 'IM3',
      scores: {
        utterance: 8,
        grammar: 7,
        vocabulary: 6,
        structure: 8,
        pronunciation: 7,
      },
      feedback: {
        strengths: ['문장 수가 충분함', '기본 문법 정확'],
        weaknesses: ['어휘 다양성 부족', '접속사 활용 미흡'],
        improvements: ['however, therefore 같은 접속사 활용'],
        model_answer: 'I would like to tell you about...',
      },
    };

    it('should create feedback with valid data', async () => {
      const mockSavedFeedback = {
        id: 'feedback-1',
        userId: mockUserId,
        questionId: mockQuestionId,
        answerText: validFeedbackData.answerText,
        evaluatedLevel: validFeedbackData.evaluatedLevel,
        scores: validFeedbackData.scores,
        feedback: validFeedbackData.feedback,
        createdAt: '2024-01-15T10:30:00Z',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSavedFeedback]),
      } as any);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validFeedbackData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.feedbackId).toBe('feedback-1');
    });

    it('should return 422 if required fields missing', async () => {
      const incompleteData = {
        questionId: mockQuestionId,
        answerText: 'Test answer',
      };

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should call db.insert with correct data', async () => {
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

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validFeedbackData),
      });

      await POST(request);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should call db.select to check existing mastery', async () => {
      const mockSavedFeedback = {
        id: 'feedback-1',
        userId: mockUserId,
        questionId: mockQuestionId,
        createdAt: '2024-01-15T10:30:00Z',
      };

      const mockExistingMastery = {
        id: 'mastery-1',
        userId: mockUserId,
        questionId: mockQuestionId,
        masteryLevel: 1,
        attemptCount: 2,
        lastScore: 20,
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSavedFeedback]),
      } as any);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockExistingMastery]),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validFeedbackData),
      });

      await POST(request);

      expect(db.select).toHaveBeenCalled();
    });
  });
});
