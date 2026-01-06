import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  feedbacks,
  userQuestionMastery,
  userProfiles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, validationError } from "@/lib/api-utils/error";

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

      const profileData = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (profileData.length > 0) {
        const currentProfile = profileData[0];
        const recentFeedbacks = await db
          .select({ level: feedbacks.evaluatedLevel })
          .from(feedbacks)
          .where(eq(feedbacks.userId, userId))
          .orderBy(feedbacks.createdAt)
          .limit(3);

        const recentLevels = recentFeedbacks.map((f) => f.level);
        const allSameLevel = recentLevels.every(
          (l) => l === evaluatedLevel
        );
        const currentLevelId = currentProfile.currentLevelId;

        if (allSameLevel && recentLevels.length >= 3 && currentLevelId) {
          await db
            .update(userProfiles)
            .set({
              currentLevelId: currentLevelId + 1,
              updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, userId));
        }
      }

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
