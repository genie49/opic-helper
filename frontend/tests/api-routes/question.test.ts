import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/question/route';
import { db } from '@/lib/db';
import {
  userProfiles,
  surveySelections,
  questions,
  questionTopics,
  userQuestionMastery,
  opicLevels,
} from '@/lib/db/schema';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils/auth', () => ({
  withAuth: vi.fn((req, handler) => handler('test-user-id')),
}));

describe('Question API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/question/next', () => {
    it('should return next question for user', async () => {
      const mockProfile = {
        userId: mockUserId,
        currentLevelId: 5,
      };

      const mockTopics = [
        { selection: '카페' },
        { selection: '음악' },
      ];

      const mockQuestion = {
        id: 'question-1',
        topicId: 1,
        topicName: '카페',
        questionType: 'experience',
        difficultyLevel: 'IM2',
        questionText: '카페에서 기억에 남는 경험에 대해 말해주세요.',
        expectedAnswerStructure: '도입 → 전개 → 결론',
        keyVocabulary: ['memorable', 'experience', 'atmosphere'],
        mastery_level: 0,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProfile]),
      } as any);

      // Mock chain calls
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockProfile]),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockTopics),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: 5, levelCode: 'IM2' }]),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockQuestion]),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/question/next');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question).toBeDefined();
      expect(data.question.topic).toBe('카페');
      expect(data.question.difficultyLevel).toBe('IM2');
      expect(data.metadata).toBeDefined();
    });

    it('should return 400 if survey not completed', async () => {
      const mockProfile = {
        userId: mockUserId,
        currentLevelId: 5,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProfile]),
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProfile]),
      } as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/question/next');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('SURVEY_NOT_COMPLETED');
    });

    it('should return 404 if no available questions', async () => {
      const mockProfile = {
        userId: mockUserId,
        currentLevelId: 5,
      };

      const mockTopics = [{ selection: '카페' }];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProfile]),
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProfile]),
      } as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockTopics),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/question/next');

      // Mock will return empty array for questions
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });
  });
});
