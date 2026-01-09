import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/achievement/route';
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

describe('Achievement API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/achievement', () => {
    it('should return achievement status with recent feedbacks', async () => {
      const mockLevels = [
        {
          levelCode: 'IM2',
          levelName: 'Intermediate Mid 2',
          minUtterance: 7,
          minWords: 90,
          minConnectors: 2,
          minModifiers: 5,
        },
        {
          levelCode: 'IH',
          levelName: 'Intermediate High',
          minUtterance: 10,
          minWords: 150,
          minConnectors: 3,
          minModifiers: 8,
        },
      ];

      const mockFeedbacks = [
        {
          feedback: {
            word_count: 100,
            sentence_count: 8,
            connector_count: 2,
            quantitativeMetrics: {
              modifier_count: 5,
            },
          },
          scores: { utterance: 7, grammar: 7, vocabulary: 6, structure: 7, pronunciation: 7 },
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      } as any);

      // First call for levels, second call for feedbacks
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockLevels),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockFeedbacks),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/achievement');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.levels).toBeDefined();
      expect(data.levels.length).toBe(2);
      expect(data.levels[0].levelCode).toBe('IM2');
    });

    it('should handle empty feedbacks array', async () => {
      const mockLevels = [
        {
          levelCode: 'IM2',
          levelName: 'Intermediate Mid 2',
          minUtterance: 7,
          minWords: 90,
          minConnectors: 2,
          minModifiers: 5,
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockLevels),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/achievement');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.levels).toBeDefined();
      expect(data.levels[0].achieved).toBe(false);
    });

    it('should calculate correct achievement status', async () => {
      const mockLevels = [
        {
          levelCode: 'IM2',
          levelName: 'Intermediate Mid 2',
          minUtterance: 7,
          minWords: 90,
          minConnectors: 2,
          minModifiers: 5,
        },
      ];

      const mockFeedbacks = [
        {
          feedback: {
            word_count: 95,
            sentence_count: 8,
            connector_count: 3,
            quantitativeMetrics: {
              modifier_count: 6,
            },
          },
          scores: { utterance: 7, grammar: 7, vocabulary: 6, structure: 7, pronunciation: 7 },
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockLevels),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockFeedbacks),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/achievement');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels[0].achieved).toBe(true);
      expect(data.levels[0].avgUtterance).toBe(8);
      expect(data.levels[0].avgWords).toBe(95);
      expect(data.levels[0].avgConnectors).toBe(3);
      expect(data.levels[0].avgModifiers).toBe(6);
    });

    it('should calculate achievement percentages correctly', async () => {
      const mockLevels = [
        {
          levelCode: 'IM2',
          levelName: 'Intermediate Mid 2',
          minUtterance: 10,
          minWords: 100,
          minConnectors: 3,
          minModifiers: 6,
        },
      ];

      const mockFeedbacks = [
        {
          feedback: {
            word_count: 50,
            sentence_count: 5,
            connector_count: 1,
            quantitativeMetrics: {
              modifier_count: 3,
            },
          },
          scores: { utterance: 5, grammar: 5, vocabulary: 5, structure: 5, pronunciation: 5 },
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockLevels),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockFeedbacks),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/achievement');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels[0].achieved).toBe(false);
      expect(data.levels[0].criteria.utterance.percentage).toBe(50); // 5/10
      expect(data.levels[0].criteria.words.percentage).toBe(50); // 50/100
      expect(data.levels[0].criteria.connectors.percentage).toBe(33.33333333333333); // 1/3
      expect(data.levels[0].criteria.modifiers.percentage).toBe(50); // 3/6
    });

    it('should handle zero target values', async () => {
      const mockLevels = [
        {
          levelCode: 'NL',
          levelName: 'Novice Low',
          minUtterance: 0,
          minWords: 0,
          minConnectors: 0,
          minModifiers: 0,
        },
      ];

      const mockFeedbacks = [
        {
          feedback: {
            word_count: 10,
            sentence_count: 1,
            connector_count: 0,
          },
          scores: { utterance: 1, grammar: 1, vocabulary: 1, structure: 1, pronunciation: 1 },
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLevels),
      } as any);

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockLevels),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockFeedbacks),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/achievement');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.levels[0].achieved).toBe(true);
      expect(data.levels[0].criteria.utterance.percentage).toBe(100);
      expect(data.levels[0].criteria.words.percentage).toBe(100);
    });
  });
});
