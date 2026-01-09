import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/exam/start/route';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils/auth', () => ({
  withAuth: vi.fn((req, handler) => handler('test-user-id')),
}));

describe('Exam Start API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/exam/start', () => {
    it('should create exam session with valid question count', async () => {
      const mockSession = {
        id: 'exam-session-1',
        userId: mockUserId,
        questionIds: ['question-1', 'question-2'],
        createdAt: '2024-01-15T10:30:00Z',
      };

      const mockQuestions = [
        {
          id: 'question-1',
          topicName: '카페',
          questionType: 'experience',
          questionText: 'Tell me about a memorable experience at a cafe.',
        },
        {
          id: 'question-2',
          topicName: '음악',
          questionType: 'description',
          questionText: 'Describe your favorite music genre.',
        },
      ];

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      } as any);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/exam/start', {
        method: 'POST',
        body: JSON.stringify({ questionCount: 12 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.id).toBe('exam-session-1');
      expect(data.questions).toBeDefined();
      expect(data.questions.length).toBe(2);
    });

    it('should return 400 for invalid question count (<10)', async () => {
      const request = new NextRequest('http://localhost:3000/api/exam/start', {
        method: 'POST',
        body: JSON.stringify({ questionCount: 5 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid question count (>15)', async () => {
      const request = new NextRequest('http://localhost:3000/api/exam/start', {
        method: 'POST',
        body: JSON.stringify({ questionCount: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should use default question count 12 if not provided', async () => {
      const mockSession = {
        id: 'exam-session-1',
        userId: mockUserId,
        questionIds: ['question-1'],
        createdAt: '2024-01-15T10:30:00Z',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSession]),
      } as any);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/exam/start', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
