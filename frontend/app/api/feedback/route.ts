import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  feedbacks,
  userQuestionMastery,
  userProfiles,
  opicLevels,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, validationError } from "@/lib/api-utils/error";

const LEVEL_ORDER: Record<string, number> = {
  NL: 1,
  NM: 2,
  NH: 3,
  IL: 4,
  IM1: 5,
  IM2: 6,
  IM3: 7,
  IH: 8,
  AL: 9,
};

const ORDER_TO_LEVEL: Record<number, string> = Object.fromEntries(
  Object.entries(LEVEL_ORDER).map(([k, v]) => [v, k])
);

function calculateWeightedAverageLevel(
  recentFeedbacks: { evaluatedLevel: string | null }[]
): string | null {
  if (!recentFeedbacks || recentFeedbacks.length === 0) {
    return null;
  }

  const n = Math.min(recentFeedbacks.length, 10);
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < n; i++) {
    const feedback = recentFeedbacks[i];
    const levelCode = feedback.evaluatedLevel;
    if (!levelCode) continue;

    const levelOrder = LEVEL_ORDER[levelCode];
    if (!levelOrder) continue;

    const weight = Math.pow(1.2, n - 1 - i);
    weightedSum += levelOrder * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;

  const averageOrder = weightedSum / totalWeight;
  return ORDER_TO_LEVEL[Math.round(averageOrder)] || null;
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      const {
        questionId,
        answerText,
        evaluatedLevel,
        scores,
        feedback,
      } = body;

      if (!questionId || !answerText || !evaluatedLevel || !scores || !feedback) {
        throw validationError("필수 항목이 누락되었습니다.", {
          required: ["questionId", "answerText", "evaluatedLevel", "scores", "feedback"],
        });
      }

      const totalScore = scores.utterance + scores.grammar + scores.vocabulary + scores.structure + scores.pronunciation;

      const savedFeedback = await db
        .insert(feedbacks)
        .values({
          userId,
          questionId,
          answerText,
          evaluatedLevel,
          scores: scores,
          feedback: feedback,
        })
        .returning();

      const masteryData = await db
        .select()
        .from(userQuestionMastery)
        .where(
          and(
            eq(userQuestionMastery.userId, userId),
            eq(userQuestionMastery.questionId, questionId)
          )
        )
        .limit(1);

      const existingMastery = masteryData[0];
      const currentMasteryLevel = existingMastery?.masteryLevel || 0;
      const attemptCount = (existingMastery?.attemptCount || 0) + 1;

      let newMasteryLevel = currentMasteryLevel;

      if (totalScore >= 35 && currentMasteryLevel < 3) {
        newMasteryLevel = 3;
      } else if (totalScore >= 25 && currentMasteryLevel < 2) {
        newMasteryLevel = 2;
      } else if (totalScore >= 15 && currentMasteryLevel < 1) {
        newMasteryLevel = 1;
      }

      if (existingMastery) {
        await db
          .update(userQuestionMastery)
          .set({
            masteryLevel: newMasteryLevel,
            attemptCount,
            lastScore: totalScore,
            lastAttemptedAt: new Date(),
            isWeakTopic: totalScore < 20,
            updatedAt: new Date(),
          })
          .where(eq(userQuestionMastery.id, existingMastery.id));
      } else {
        await db
          .insert(userQuestionMastery)
          .values({
            userId,
            questionId,
            masteryLevel: newMasteryLevel,
            attemptCount,
            lastScore: totalScore,
            lastAttemptedAt: new Date(),
            isWeakTopic: totalScore < 20,
          });
      }

      // 최근 10개 피드백 조회 후 지수 가중 평균 레벨 계산
      const recentFeedbacks = await db
        .select({
          evaluatedLevel: feedbacks.evaluatedLevel,
        })
        .from(feedbacks)
        .where(eq(feedbacks.userId, userId))
        .orderBy(desc(feedbacks.createdAt))
        .limit(10);

      const averageLevel = calculateWeightedAverageLevel(recentFeedbacks);

      await db
        .update(userProfiles)
        .set({
          assessedLevel: averageLevel,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));

      return NextResponse.json({
        success: true,
        feedbackId: savedFeedback[0].id,
        mastery: {
          level: newMasteryLevel,
          attemptCount,
          lastScore: totalScore,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
