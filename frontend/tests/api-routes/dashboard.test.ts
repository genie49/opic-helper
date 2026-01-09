import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/dashboard/route';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils/auth', () => ({
  withAuth: vi.fn((req, handler) => handler('test-user-id')),
}));

describe('Dashboard API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data with user stats', async () => {
      const mockUser = {
        id: 'profile-1',
        userId: mockUserId,
        displayName: 'Test User',
        assessedLevel: 'IM2',
        targetLevel: {
          id: 8,
          levelCode: 'IH',
          levelName: 'Intermediate High',
          minUtterance: 10,
          minWords: 150,
        },
      };

      const mockStats = {
        totalAttempts: 25,
        masteredQuestions: 10,
        inProgressQuestions: 8,
        notAttemptedQuestions: 7,
        avgScore: 78.5,
      };

      const mockRecentFeedbacks = [
        {
          id: 'feedback-1',
          questionId: 'question-1',
          questionText: 'Tell me about your favorite cafe.',
          evaluatedLevel: 'IM2',
          totalScore: 34,
          createdAt: '2024-01-15T10:30:00Z',
        },
      ];

      const mockLevelHistory = [
        { level: 'IM2', achievedAt: '2024-01-15T10:30:00Z' },
        { level: 'IM1', achievedAt: '2024-01-14T10:30:00Z' },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      } as any);

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockUser]),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockRecentFeedbacks),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockLevelHistory),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.displayName).toBe('Test User');
      expect(data.user.assessedLevel).toBe('IM2');
      expect(data.stats).toBeDefined();
      expect(data.stats.totalAttempts).toBe(25);
      expect(data.recentFeedbacks).toBeDefined();
      expect(data.recentFeedbacks.length).toBe(1);
      expect(data.stats.levelHistory).toBeDefined();
      expect(data.stats.levelHistory.length).toBe(2);
    });

    it('should return 404 if profile not found', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should handle empty level history', async () => {
      const mockUser = {
        id: 'profile-1',
        userId: mockUserId,
        displayName: 'Test User',
        assessedLevel: 'IM2',
        targetLevel: {
          id: 8,
          levelCode: 'IH',
        },
      };

      const mockStats = {
        totalAttempts: 0,
        masteredQuestions: 0,
        inProgressQuestions: 0,
        notAttemptedQuestions: 0,
        avgScore: 0,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      } as any);

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockUser]),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.levelHistory).toEqual([]);
      expect(data.recentFeedbacks).toEqual([]);
    });
  });
});
