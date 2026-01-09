import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-question/route';

// Mock dependencies
vi.mock('@/lib/api-utils/auth', () => ({
  withAuth: vi.fn((req, handler) => handler('test-user-id')),
}));

// Mock global fetch
global.fetch = vi.fn() as any;

describe('Generate Question API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('POST /api/generate-question', () => {
    it('should generate question with valid data', async () => {
      const mockBackendResponse = {
        success: true,
        question: {
          topic: '카페',
          question_type: 'experience',
          question_text: 'Tell me about a memorable experience at a cafe.',
          expected_answer_structure: '도입 → 시간/장소 → 상황 전개 → 느낀 점',
          key_vocabulary: ['memorable', 'experience', 'atmosphere'],
          difficulty_level: 'IM2',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendResponse,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-question', {
        method: 'POST',
        body: JSON.stringify({
          topic: '카페',
          questionType: 'experience',
          currentLevel: 'IM2',
          targetLevel: 'IH',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.question.topic).toBe('카페');
      expect(data.question.question_type).toBe('experience');
      expect(data.question.difficulty_level).toBe('IM2');
    });

    it('should use default parameters if not provided', async () => {
      const mockBackendResponse = {
        success: true,
        question: {
          topic: '일상',
          question_type: 'experience',
          question_text: 'Tell me about your daily routine.',
          expected_answer_structure: '도입 → 설명',
          key_vocabulary: ['routine', 'daily', 'schedule'],
          difficulty_level: 'IM2',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendResponse,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-question', {
        method: 'POST',
        body: JSON.stringify({
          topic: '카페',
          questionType: 'experience',
          // currentLevel and targetLevel will use defaults
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.question).toBeDefined();
    });

    it('should return error if required fields missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-question', {
        method: 'POST',
        body: JSON.stringify({
          questionType: 'experience',
          // Missing 'topic' field
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should handle backend error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          detail: 'AI generation failed',
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/generate-question', {
        method: 'POST',
        body: JSON.stringify({
          topic: '카페',
          questionType: 'experience',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('failed');
    });

    it('should generate different question types', async () => {
      const questionTypes = ['description', 'routine', 'experience', 'roleplay', 'surprise'];

      for (const qType of questionTypes) {
        const mockBackendResponse = {
          success: true,
          question: {
            topic: '카페',
            question_type: qType,
            question_text: 'Tell me about...',
            expected_answer_structure: '도입 → 설명',
            key_vocabulary: ['test'],
            difficulty_level: 'IM2',
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockBackendResponse,
        });

        const request = new NextRequest('http://localhost:3000/api/generate-question', {
          method: 'POST',
          body: JSON.stringify({
            topic: '카페',
            questionType: qType,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.question.question_type).toBe(qType);
      }
    });

    it('should call backend with correct URL', async () => {
      const mockBackendResponse = {
        success: true,
        question: {
          topic: '카페',
          question_type: 'experience',
          question_text: 'Tell me about...',
          expected_answer_structure: '도입 → 설명',
          key_vocabulary: ['test'],
          difficulty_level: 'IM2',
        },
      };

      process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8000';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendResponse,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-question', {
        method: 'POST',
        body: JSON.stringify({
          topic: '카페',
          questionType: 'experience',
        }),
      });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/generate-question',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });
});
