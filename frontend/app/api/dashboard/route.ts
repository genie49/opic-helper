import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  userProfiles,
  opicLevels,
  feedbacks,
  userQuestionMastery,
  questions,
} from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const profileData = await db
        .select({
          id: userProfiles.id,
          userId: userProfiles.userId,
          displayName: userProfiles.displayName,
          currentLevelId: userProfiles.currentLevelId,
          targetLevelId: userProfiles.targetLevelId,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (!profileData || profileData.length === 0) {
        return NextResponse.json(
          {
            error: "사용자 프로필을 찾을 수 없습니다.",
            code: "PROFILE_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      const profile = profileData[0];

      const [currentLevel, targetLevel] = await Promise.all([
        profile.currentLevelId
          ? db
              .select()
              .from(opicLevels)
              .where(eq(opicLevels.id, profile.currentLevelId))
              .limit(1)
          : Promise.resolve([]),
        profile.targetLevelId
          ? db
              .select()
              .from(opicLevels)
              .where(eq(opicLevels.id, profile.targetLevelId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const profileWithLevels = {
        ...profile,
        currentLevel: currentLevel[0] ? {
          id: currentLevel[0].id,
          levelCode: currentLevel[0].levelCode,
          levelName: currentLevel[0].levelName,
          minUtterance: currentLevel[0].minUtterance,
          minWords: currentLevel[0].minWords,
        } : null,
        targetLevel: targetLevel[0] ? {
          id: targetLevel[0].id,
          levelCode: targetLevel[0].levelCode,
          levelName: targetLevel[0].levelName,
          minUtterance: targetLevel[0].minUtterance,
          minWords: targetLevel[0].minWords,
        } : null,
      };

      if (!profileData || profileData.length === 0) {
        return NextResponse.json(
          {
            error: "사용자 프로필을 찾을 수 없습니다.",
            code: "PROFILE_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      const statsQuery = await db
        .select({
          totalAttempts: sql<number>`COUNT(DISTINCT ${feedbacks.id})`.as(
            "total_attempts"
          ),
          avgScore: sql<number>`AVG(
            CAST(${feedbacks.scores}->>'utterance' AS INTEGER) +
            CAST(${feedbacks.scores}->>'grammar' AS INTEGER) +
            CAST(${feedbacks.scores}->>'vocabulary' AS INTEGER) +
            CAST(${feedbacks.scores}->>'structure' AS INTEGER) +
            CAST(${feedbacks.scores}->>'pronunciation' AS INTEGER)
          )`.as("avg_score"),
        })
        .from(feedbacks)
        .where(eq(feedbacks.userId, userId));

      const masteryQuery = await db
        .select({
          mastered: sql<number>`COUNT(*) FILTER (WHERE ${userQuestionMastery.masteryLevel} >= 3)`.as(
            "mastered"
          ),
          inProgress: sql<number>`COUNT(*) FILTER (WHERE ${userQuestionMastery.masteryLevel} >= 1 AND ${userQuestionMastery.masteryLevel} < 3)`.as(
            "in_progress"
          ),
          notAttempted: sql<number>`COUNT(*) FILTER (WHERE ${userQuestionMastery.masteryLevel} = 0)`.as(
            "not_attempted"
          ),
        })
        .from(userQuestionMastery)
        .where(eq(userQuestionMastery.userId, userId));

      const recentFeedbacks = await db
        .select({
          id: feedbacks.id,
          questionId: feedbacks.questionId,
          questionText: questions.questionText,
          evaluatedLevel: feedbacks.evaluatedLevel,
          totalScore: sql<number>`
            CAST(${feedbacks.scores}->>'utterance' AS INTEGER) +
            CAST(${feedbacks.scores}->>'grammar' AS INTEGER) +
            CAST(${feedbacks.scores}->>'vocabulary' AS INTEGER) +
            CAST(${feedbacks.scores}->>'structure' AS INTEGER) +
            CAST(${feedbacks.scores}->>'pronunciation' AS INTEGER)
          `.as("total_score"),
          createdAt: feedbacks.createdAt,
        })
        .from(feedbacks)
        .innerJoin(
          questions,
          eq(feedbacks.questionId, questions.id)
        )
        .where(eq(feedbacks.userId, userId))
        .orderBy(feedbacks.createdAt)
        .limit(5);

      const stats = statsQuery[0];
      const mastery = masteryQuery[0];

      const levelHistoryQuery = await db
        .select({
          level: opicLevels.levelCode,
          achievedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .leftJoin(
          opicLevels,
          eq(userProfiles.currentLevelId, opicLevels.id)
        )
        .where(eq(userProfiles.userId, userId))
        .limit(10);

      return NextResponse.json({
        user: profileWithLevels,
        stats: {
          totalAttempts: Number(stats?.totalAttempts || 0),
          masteredQuestions: Number(mastery?.mastered || 0),
          inProgressQuestions: Number(mastery?.inProgress || 0),
          notAttemptedQuestions: Number(mastery?.notAttempted || 0),
          avgScore: Number(stats?.avgScore || 0).toFixed(1),
          levelHistory: levelHistoryQuery.map((h) => ({
            level: h.level,
            achievedAt: h.achievedAt,
          })),
        },
        recentFeedbacks,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
