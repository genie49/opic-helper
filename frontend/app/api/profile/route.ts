import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles, opicLevels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { notFoundError, handleApiError, ApiError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const profile = await db
        .select({
          id: userProfiles.id,
          userId: userProfiles.userId,
          currentLevel: {
            id: opicLevels.id,
            levelCode: opicLevels.levelCode,
            levelName: opicLevels.levelName,
            minUtterance: opicLevels.minUtterance,
            minWords: opicLevels.minWords,
          },
          targetLevel: {
            id: opicLevels.id,
            levelCode: opicLevels.levelCode,
            levelName: opicLevels.levelName,
            minUtterance: opicLevels.minUtterance,
            minWords: opicLevels.minWords,
          },
          displayName: userProfiles.displayName,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .leftJoin(
          opicLevels,
          eq(userProfiles.currentLevelId, opicLevels.id)
        )
        .leftJoin(
          opicLevels,
          eq(userProfiles.targetLevelId, opicLevels.id)
        )
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (!profile || profile.length === 0) {
        return NextResponse.json(
          {
            error: "사용자 프로필을 찾을 수 없습니다.",
            code: "PROFILE_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ profile: profile[0] });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      const { targetLevelId, displayName } = body;

      const updates: Record<string, any> = {};
      if (targetLevelId !== undefined) {
        updates.targetLevelId = targetLevelId;
      }
      if (displayName !== undefined) {
        updates.displayName = displayName;
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          {
            error: "업데이트할 필드가 없습니다.",
            code: "NO_UPDATE_FIELDS",
          },
          { status: 400 }
        );
      }

      const result = await db
        .update(userProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();

      if (!result || result.length === 0) {
        throw notFoundError();
      }

      return NextResponse.json({
        success: true,
        profile: result[0],
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
