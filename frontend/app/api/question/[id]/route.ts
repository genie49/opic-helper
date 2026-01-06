import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions, questionTopics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, notFoundError } from "@/lib/api-utils/error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    try {
      const questionId = (await params).id;

      const question = await db
        .select({
          id: questions.id,
          topicName: questionTopics.topicName,
          questionType: questions.questionType,
          difficultyLevel: questions.difficultyLevel,
          questionText: questions.questionText,
          expectedAnswerStructure: questions.expectedAnswerStructure,
          keyVocabulary: questions.keyVocabulary,
          roleplayContext: questions.roleplayContext,
          createdAt: questions.createdAt,
        })
        .from(questions)
        .innerJoin(
          questionTopics,
          eq(questions.topicId, questionTopics.id)
        )
        .where(eq(questions.id, questionId))
        .limit(1);

      if (!question || question.length === 0) {
        throw notFoundError();
      }

      return NextResponse.json({ question: question[0] });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
