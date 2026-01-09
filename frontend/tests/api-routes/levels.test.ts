import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/levels/route';
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

describe('Levels API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/levels', () => {
    it('should return all OPIc levels', async () => {
      const mockLevels = [
        {
          id: 1,
          levelCode: 'NL',
          levelName: 'Novice Low',
          levelOrder: 1,
          minUtterance: 3,
          minWords: 30,
          description: '단어나 구 단위 답변',
        },
        {
          id: 2,
          levelCode: 'NM',
          levelName: 'Novice Mid',
          levelOrder: 2,
          minUtterance: 4,
          minWords: 40,
          description: '기본적인 문장 구성',
        },
        {
          id: 8,
          levelCode: 'IH',
          levelName: 'Intermediate High',
          levelOrder: 8,
          minUtterance: 10,
          minWords: 150,
          description: '논리적 문단 구성',
        },
        {
          id: 9,
          levelCode: 'AL',
          levelName: 'Advanced Low',
          levelOrder: 9,
          minUtterance: 15,
          minWords: 184,
          description: '능숙한 표현 구사',
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/levels');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels).toBeDefined();
      expect(data.levels.length).toBe(4);
      expect(data.levels[0].levelCode).toBe('NL');
      expect(data.levels[3].levelCode).toBe('AL');
    });

    it('should return levels in correct order', async () => {
      const mockLevels = [
        {
          id: 1,
          levelCode: 'NL',
          levelName: 'Novice Low',
          levelOrder: 1,
          minUtterance: 3,
          minWords: 30,
        },
        {
          id: 5,
          levelCode: 'IM1',
          levelName: 'Intermediate Mid 1',
          levelOrder: 5,
          minUtterance: 7,
          minWords: 90,
        },
        {
          id: 9,
          levelCode: 'AL',
          levelName: 'Advanced Low',
          levelOrder: 9,
          minUtterance: 15,
          minWords: 184,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/levels');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels).toBeDefined();
      expect(data.levels[0].levelOrder).toBeLessThan(data.levels[1].levelOrder);
    });

    it('should include all required fields', async () => {
      const mockLevels = [
        {
          id: 1,
          levelCode: 'NL',
          levelName: 'Novice Low',
          levelOrder: 1,
          minUtterance: 3,
          minWords: 30,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/levels');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels[0]).toHaveProperty('id');
      expect(data.levels[0]).toHaveProperty('levelCode');
      expect(data.levels[0]).toHaveProperty('levelName');
      expect(data.levels[0]).toHaveProperty('levelOrder');
      expect(data.levels[0]).toHaveProperty('minUtterance');
      expect(data.levels[0]).toHaveProperty('minWords');
    });

    it('should return all 9 OPIc levels', async () => {
      const mockLevels = Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        levelCode: ['NL', 'NM', 'NH', 'IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'][i],
        levelName: `Level ${i + 1}`,
        levelOrder: i + 1,
        minUtterance: 3 + i,
        minWords: 30 + i * 20,
      }));

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/levels');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels).toBeDefined();
      expect(data.levels.length).toBe(9);
    });

    it('should handle empty levels array', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/levels');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels).toEqual([]);
    });
  });
});
