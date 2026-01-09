import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/mastery/route';
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

describe('Mastery API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/mastery', () => {
    it('should return mastery data for user', async () => {
      const mockMasteryData = [
        {
          id: 'mastery-1',
          userId: mockUserId,
          questionId: 'question-1',
          masteryLevel: 2,
          attemptCount: 5,
          lastScore: 32,
          lastAttemptedAt: '2024-01-15T10:30:00Z',
          isWeakTopic: false,
        },
        {
          id: 'mastery-2',
          userId: mockUserId,
          questionId: 'question-2',
          masteryLevel: 1,
          attemptCount: 3,
          lastScore: 24,
          lastAttemptedAt: '2024-01-14T10:30:00Z',
          isWeakTopic: true,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/mastery');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mastery).toBeDefined();
      expect(data.mastery.length).toBe(2);
      expect(data.mastery[0].masteryLevel).toBe(2);
      expect(data.mastery[1].isWeakTopic).toBe(true);
    });

    it('should return empty array if no mastery data', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/mastery');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mastery).toEqual([]);
    });

    it('should filter by mastery level if provided', async () => {
      const mockMasteryData = [
        {
          id: 'mastery-1',
          userId: mockUserId,
          questionId: 'question-1',
          masteryLevel: 2,
          attemptCount: 5,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/mastery?level=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mastery).toBeDefined();
    });

    it('should filter by weak topic if requested', async () => {
      const mockMasteryData = [
        {
          id: 'mastery-1',
          userId: mockUserId,
          questionId: 'question-1',
          masteryLevel: 1,
          attemptCount: 3,
          isWeakTopic: true,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/mastery?weak=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mastery).toBeDefined();
    });

    it('should return mastery counts', async () => {
      const mockMasteryData = [
        { masteryLevel: 0 },
        { masteryLevel: 1 },
        { masteryLevel: 1 },
        { masteryLevel: 2 },
        { masteryLevel: 3 },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/mastery');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mastery).toBeDefined();
    });
  });
});
