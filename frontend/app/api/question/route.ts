import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  questions,
  questionTopics,
  userProfiles,
  surveySelections,
  userQuestionMastery,
  opicLevels,
} from "@/lib/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, notFoundError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const profile = await db
        .select()
        .from(userProfiles)
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

      const userProfile = profile[0];
      const currentLevelId = userProfile.currentLevelId;

      const topics = await db
        .select({ selection: surveySelections.selection })
        .from(surveySelections)
        .where(eq(surveySelections.userId, userId));

      const topicNames = topics.map((t) => t.selection);

      if (topicNames.length === 0) {
        return NextResponse.json(
          {
            error: "서베이를 먼저 완성해주세요.",
            code: "SURVEY_NOT_COMPLETED",
          },
          { status: 400 }
        );
      }

      const levelInfo = await db
        .select()
        .from(opicLevels)
        .where(eq(opicLevels.id, currentLevelId!))
        .limit(1);

      const difficultyLevel = levelInfo[0]?.levelCode || "IM2";

      const subquery = db
        .select({
          questionId: userQuestionMastery.questionId,
          masteryLevel: userQuestionMastery.masteryLevel,
        })
        .from(userQuestionMastery)
        .where(eq(userQuestionMastery.userId, userId))
        .as("mastery");

      const availableQuestions = await db
        .select({
          id: questions.id,
          topicId: questions.topicId,
          topicName: questionTopics.topicName,
          questionType: questions.questionType,
          difficultyLevel: questions.difficultyLevel,
          questionText: questions.questionText,
          expectedAnswerStructure: questions.expectedAnswerStructure,
          keyVocabulary: questions.keyVocabulary,
          masteryLevel: sql<number>`COALESCE(${subquery.masteryLevel}, 0)`.as(
            "mastery_level"
          ),
        })
        .from(questions)
        .innerJoin(
          questionTopics,
          eq(questions.topicId, questionTopics.id)
        )
        .leftJoin(subquery, eq(questions.id, subquery.questionId))
        .where(
          and(
            eq(questions.difficultyLevel, difficultyLevel),
            inArray(questionTopics.topicName, topicNames)
          )
        )
        .orderBy(sql`COALESCE(${subquery.masteryLevel}, 0) ASC`)
        .limit(20);

      if (availableQuestions.length === 0) {
        throw notFoundError("사용 가능한 문제가 없습니다.");
      }

      const masteredQuestions = availableQuestions.filter(
        (q) => q.masteryLevel >= 3
      );
      const unmasteredQuestions = availableQuestions.filter(
        (q) => q.masteryLevel < 3
      );

      let selectedQuestion;
      if (unmasteredQuestions.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * unmasteredQuestions.length
        );
        selectedQuestion = unmasteredQuestions[randomIndex];
      } else {
        const randomIndex = Math.floor(Math.random() * masteredQuestions.length);
        selectedQuestion = masteredQuestions[randomIndex];
      }

      const currentMastery = await db
        .select()
        .from(userQuestionMastery)
        .where(
          and(
            eq(userQuestionMastery.userId, userId),
            eq(userQuestionMastery.questionId, selectedQuestion.id)
          )
        )
        .limit(1);

      return NextResponse.json({
        question: {
          id: selectedQuestion.id,
          topic: selectedQuestion.topicName,
          questionType: selectedQuestion.questionType,
          difficultyLevel: selectedQuestion.difficultyLevel,
          questionText: selectedQuestion.questionText,
          expectedAnswerStructure: selectedQuestion.expectedAnswerStructure,
          keyVocabulary: selectedQuestion.keyVocabulary,
        },
        metadata: {
          masteryLevel: currentMastery[0]?.masteryLevel || 0,
          attemptCount: currentMastery[0]?.attemptCount || 0,
          lastScore: currentMastery[0]?.lastScore || null,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
