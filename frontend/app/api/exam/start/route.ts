import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { examSessions, questions, questionTopics, surveySelections } from "@/lib/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, validationError } from "@/lib/api-utils/error";

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      const { questionCount = 12 } = body;

      if (questionCount < 10 || questionCount > 15) {
        throw validationError("문제 수는 10~15개 사이여야 합니다.", {
          field: "questionCount",
        });
      }

      const profile = await db.query.userProfiles.findFirst({
        where: eq(sql`${examSessions.userId} = ${userId}`, userId),
      });

      const currentLevel = profile?.assessedLevel || "IM2";

      const surveyTopics = await db
        .select({ selection: surveySelections.selection })
        .from(surveySelections)
        .where(eq(surveySelections.userId, userId));

      const topicNames = surveyTopics.map((t) => t.selection);

      const allQuestions = await db
        .select({
          id: questions.id,
          topicId: questions.topicId,
          topicName: questionTopics.topicName,
          questionType: questions.questionType,
          questionText: questions.questionText,
        })
        .from(questions)
        .innerJoin(questionTopics, eq(questions.topicId, questionTopics.id))
        .where(
          inArray(
            sql`${questionTopics.topicName}`,
            topicNames.length > 0 ? topicNames : ["카페", "집", "음악"]
          )
        );

      const questionTypes = ["description", "routine", "experience", "roleplay", "surprise"];
      const selectedQuestions: string[] = [];
      const questionsPerType = Math.ceil(questionCount / questionTypes.length);

      for (const qType of questionTypes) {
        const typeQuestions = allQuestions.filter((q) => q.questionType === qType);
        const shuffled = typeQuestions.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, questionsPerType);

        selectedQuestions.push(...selected.map((q) => q.id));
      }

      const finalQuestions = selectedQuestions.slice(0, questionCount);

      const session = await db
        .insert(examSessions)
        .values({
          userId,
          questionIds: finalQuestions,
          createdAt: new Date(),
        })
        .returning();

      const questionDetails = await db
        .select({
          id: questions.id,
          topicName: questionTopics.topicName,
          questionType: questions.questionType,
          questionText: questions.questionText,
        })
        .from(questions)
        .innerJoin(questionTopics, eq(questions.topicId, questionTopics.id))
        .where(inArray(questions.id, finalQuestions));

      return NextResponse.json({
        success: true,
        session: session[0],
        questions: questionDetails,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
