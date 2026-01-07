import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/survey/route';
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

describe('Survey API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/survey', () => {
    it('should return user survey selections', async () => {
      const mockSelections = [
        {
          id: 'survey-1',
          userId: mockUserId,
          category: 'residence',
          selection: '아파트',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 'survey-2',
          userId: mockUserId,
          category: 'leisure',
          selection: '카페',
          createdAt: '2024-01-15T10:30:00Z',
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockSelections),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/survey');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selections.length).toBe(2);
      expect(data.selections[0].selection).toBe('아파트');
      expect(data.selections[1].selection).toBe('카페');
      expect(data.total).toBe(2);
    });
  });

  describe('POST /api/survey', () => {
    it('should create survey selections with valid data', async () => {
      const mockSelections = [
        { id: 's1', userId: mockUserId, category: 'residence', selection: '아파트' },
        { id: 's2', userId: mockUserId, category: 'leisure', selection: '카페' },
        { id: 's3', userId: mockUserId, category: 'hobby', selection: '음악' },
        { id: 's4', userId: mockUserId, category: 'exercise', selection: '수영' },
        { id: 's5', userId: mockUserId, category: 'travel', selection: '국내여행' },
        { id: 's6', userId: mockUserId, category: 'travel', selection: '해외여행' },
      ];

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(mockSelections),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/survey', {
        method: 'POST',
        body: JSON.stringify({
          selections: [
            { category: 'residence', selection: '아파트' },
            { category: 'leisure', selection: '카페' },
            { category: 'hobby', selection: '음악' },
            { category: 'exercise', selection: '수영' },
            { category: 'travel', selection: '국내여행' },
            { category: 'travel', selection: '해외여행' },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(6);
    });

    it('should return 400 if selections is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/survey', {
        method: 'POST',
        body: JSON.stringify({
          selections: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SELECTION_COUNT');
    });

    it('should return 400 if selections is less than 6', async () => {
      const request = new NextRequest('http://localhost:3000/api/survey', {
        method: 'POST',
        body: JSON.stringify({
          selections: [
            { category: 'residence', selection: '아파트' },
            { category: 'leisure', selection: '카페' },
            { category: 'hobby', selection: '음악' },
            { category: 'exercise', selection: '수영' },
            { category: 'travel', selection: '국내여행' },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SELECTION_COUNT');
    });

    it('should return 400 if selections is more than 12', async () => {
      const selections = Array.from({ length: 13 }, (_, i) => ({
        category: 'test',
        selection: `item-${i}`,
      }));

      const request = new NextRequest('http://localhost:3000/api/survey', {
        method: 'POST',
        body: JSON.stringify({ selections }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SELECTION_COUNT');
    });
  });
});
