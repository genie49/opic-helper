import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles, opicLevels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { withAuth } from "@/lib/api-utils/auth";
import { notFoundError, handleApiError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const targetLevel = alias(opicLevels, "targetLevel");

      const profile = await db
        .select({
          id: userProfiles.id,
          userId: userProfiles.userId,
          assessedLevel: userProfiles.assessedLevel, // AI 평가 레벨 (문자열)
          targetLevel: {
            id: targetLevel.id,
            levelCode: targetLevel.levelCode,
            levelName: targetLevel.levelName,
            minUtterance: targetLevel.minUtterance,
            minWords: targetLevel.minWords,
          },
          displayName: userProfiles.displayName,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .leftJoin(
          targetLevel,
          eq(userProfiles.targetLevelId, targetLevel.id)
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
      const { targetLevelId, assessedLevel, displayName } = body;

      const updates: Record<string, any> = {};
      if (targetLevelId !== undefined) {
        updates.targetLevelId = targetLevelId;
      }
      if (assessedLevel !== undefined) {
        updates.assessedLevel = assessedLevel;
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
