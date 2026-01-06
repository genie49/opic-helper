import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/profile/route';
import { db } from '@/lib/db';
import { userProfiles, opicLevels } from '@/lib/db/schema';

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

describe('Profile API', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/profile', () => {
    it('should return user profile with levels', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: mockUserId,
        displayName: 'Test User',
        currentLevel: {
          id: 5,
          levelCode: 'IM2',
          levelName: 'Intermediate Mid 2',
          minUtterance: 8,
          minWords: 110,
        },
        targetLevel: {
          id: 8,
          levelCode: 'IH',
          levelName: 'Intermediate High',
          minUtterance: 10,
          minWords: 150,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProfile]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(mockProfile);
    });

    it('should return 404 if profile not found', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('PROFILE_NOT_FOUND');
    });
  });

  describe('PATCH /api/profile', () => {
    it('should update profile with targetLevelId', async () => {
      const mockUpdatedProfile = {
        id: 'profile-1',
        userId: mockUserId,
        targetLevelId: 9,
        displayName: 'Test User',
        updatedAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ targetLevelId: 9 }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile.targetLevelId).toBe(9);
    });

    it('should update profile with displayName', async () => {
      const mockUpdatedProfile = {
        id: 'profile-1',
        userId: mockUserId,
        displayName: 'Updated User',
        updatedAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: 'Updated User' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile.displayName).toBe('Updated User');
    });

    it('should return 400 if no update fields provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('NO_UPDATE_FIELDS');
    });
  });
});
