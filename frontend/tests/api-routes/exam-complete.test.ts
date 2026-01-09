import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/exam/[id]/complete/route';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils/auth', () => ({
  withAuth: vi.fn((req, handler) => handler('test-user-id')),
}));

describe('Exam Complete API', () => {
  const mockUserId = 'test-user-id';
  const mockSessionId = 'exam-session-1';
  const mockQuestionId = 'question-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/exam/[id]/complete', () => {
    it('should generate report with valid session', async () => {
      const mockSession = {
        id: mockSessionId,
        userId: mockUserId,
        questionIds: [mockQuestionId],
        createdAt: '2024-01-15T10:00:00Z',
      };

      const mockFeedbacks = [
        {
          id: 'feedback-1',
          questionId: mockQuestionId,
          questionText: 'Tell me about your favorite cafe.',
          answerText: 'I often go to a cafe near my house.',
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
          },
          createdAt: '2024-01-15T10:30:00Z',
        },
      ];

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      } as any);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest(`http://localhost:3000/api/exam/${mockSessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { id: mockSessionId } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report.totalQuestions).toBe(1);
      expect(data.report.answeredQuestions).toBe(1);
    });

    it('should return 404 if session not found', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest(`http://localhost:3000/api/exam/non-existent/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { id: 'non-existent' } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });

    it('should calculate correct average score', async () => {
      const mockSession = {
        id: mockSessionId,
        userId: mockUserId,
        questionIds: [mockQuestionId, 'question-2'],
        createdAt: '2024-01-15T10:00:00Z',
      };

      const mockFeedbacks = [
        {
          id: 'feedback-1',
          questionId: mockQuestionId,
          scores: { utterance: 7, grammar: 7, vocabulary: 6, structure: 7, pronunciation: 7 },
        },
        {
          id: 'feedback-2',
          questionId: 'question-2',
          scores: { utterance: 8, grammar: 8, vocabulary: 7, structure: 8, pronunciation: 8 },
        },
      ];

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      } as any);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest(`http://localhost:3000/api/exam/${mockSessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { id: mockSessionId } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.report.totalScore).toBe(38); // 34 + 40
      expect(data.report.averageScore).toBe('19.0'); // 38 / 2
    });

    it('should determine dominant level correctly', async () => {
      const mockSession = {
        id: mockSessionId,
        userId: mockUserId,
        questionIds: [mockQuestionId, 'question-2', 'question-3'],
        createdAt: '2024-01-15T10:00:00Z',
      };

      const mockFeedbacks = [
        { evaluatedLevel: 'IM2' },
        { evaluatedLevel: 'IM2' },
        { evaluatedLevel: 'IM3' },
      ];

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      } as any);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest(`http://localhost:3000/api/exam/${mockSessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { id: mockSessionId } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.report.overallLevel).toBe('IM2'); // Most frequent
    });
  });

  describe('GET /api/exam/[id]/complete', () => {
    it('should return exam report', async () => {
      const mockSession = {
        id: mockSessionId,
        userId: mockUserId,
        questionIds: [mockQuestionId],
        completedAt: '2024-01-15T11:00:00Z',
        totalTimeSpent: 1800,
        totalScore: 34,
        averageLevel: 'IM2',
        report: {
          totalQuestions: 1,
          answeredQuestions: 1,
          totalScore: 34,
          averageScore: '34.0',
          overallLevel: 'IM2',
          scoreBreakdown: {
            utterance: 7,
            grammar: 7,
            vocabulary: 6,
            structure: 7,
            pronunciation: 7,
          },
        },
        createdAt: '2024-01-15T10:00:00Z',
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockSession]),
      } as any);

      const request = new NextRequest(`http://localhost:3000/api/exam/${mockSessionId}/complete`, {
        method: 'GET',
      });

      const response = await GET(request, { id: mockSessionId } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.id).toBe(mockSessionId);
      expect(data.session.report).toBeDefined();
    });

    it('should return 404 if session not found', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest(`http://localhost:3000/api/exam/non-existent/complete`, {
        method: 'GET',
      });

      const response = await GET(request, { id: 'non-existent' } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('SESSION_NOT_FOUND');
    });
  });
});
