import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  questions,
  questionTopics,
  surveySelections,
  userQuestionMastery,
} from "@/lib/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, notFoundError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      // 쿼리 파라미터에서 questionType 필터 가져오기
      const { searchParams } = new URL(request.url);
      const questionTypeFilter = searchParams.get("type"); // e.g., "roleplay"

      // 사용자의 서베이 선택 토픽 조회
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

      const subquery = db
        .select({
          questionId: userQuestionMastery.questionId,
          masteryLevel: userQuestionMastery.masteryLevel,
        })
        .from(userQuestionMastery)
        .where(eq(userQuestionMastery.userId, userId))
        .as("mastery");

      // WHERE 조건 구성 - 난이도 필터 제거 (OPIc은 난이도별로 문제가 다르지 않음)
      const whereConditions = [inArray(questionTopics.topicName, topicNames)];

      // questionType 필터가 있으면 조건 추가
      if (questionTypeFilter) {
        whereConditions.push(eq(questions.questionType, questionTypeFilter));
      }

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
          roleplayContext: questions.roleplayContext,
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
        .where(and(...whereConditions))
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
          roleplayContext: selectedQuestion.roleplayContext,
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
