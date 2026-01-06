import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  userQuestionMastery,
  questions,
  questionTopics,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const masteryData = await db
        .select({
          id: userQuestionMastery.id,
          questionId: userQuestionMastery.questionId,
          questionText: questions.questionText,
          topicName: questionTopics.topicName,
          questionType: questions.questionType,
          difficultyLevel: questions.difficultyLevel,
          masteryLevel: userQuestionMastery.masteryLevel,
          attemptCount: userQuestionMastery.attemptCount,
          lastScore: userQuestionMastery.lastScore,
          lastAttemptedAt: userQuestionMastery.lastAttemptedAt,
          isWeakTopic: userQuestionMastery.isWeakTopic,
        })
        .from(userQuestionMastery)
        .innerJoin(
          questions,
          eq(userQuestionMastery.questionId, questions.id)
        )
        .innerJoin(
          questionTopics,
          eq(questions.topicId, questionTopics.id)
        )
        .where(eq(userQuestionMastery.userId, userId))
        .orderBy(userQuestionMastery.updatedAt);

      const summary = {
        totalQuestions: masteryData.length,
        notAttempted: masteryData.filter((m) => (m.masteryLevel ?? 0) === 0).length,
        attempted: masteryData.filter((m) => (m.masteryLevel ?? 0) >= 1).length,
        inProgress: masteryData.filter((m) => (m.masteryLevel ?? 0) === 1 || (m.masteryLevel ?? 0) === 2).length,
        mastered: masteryData.filter((m) => (m.masteryLevel ?? 0) === 3).length,
        weakTopics: masteryData.filter((m) => m.isWeakTopic).length,
      };

      return NextResponse.json({
        mastery: masteryData,
        summary,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
