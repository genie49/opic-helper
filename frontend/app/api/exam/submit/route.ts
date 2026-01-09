import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbacks, examSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, validationError } from "@/lib/api-utils/error";

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      const { sessionId, questionId, answerText, evaluatedLevel, scores, feedback } = body;

      if (!sessionId || !questionId || !answerText) {
        throw validationError("필수 항목이 누락되었습니다.", {
          required: ["sessionId", "questionId", "answerText"],
        });
      }

      const savedFeedback = await db
        .insert(feedbacks)
        .values({
          userId,
          questionId,
          answerText,
          evaluatedLevel,
          scores: scores || {
            utterance: 0,
            grammar: 0,
            vocabulary: 0,
            structure: 0,
            pronunciation: 0,
          },
          feedback: feedback || {
            strengths: [],
            weaknesses: [],
            improvements: [],
            model_answer: "",
          },
          examSessionId: sessionId,
        })
        .returning();

      return NextResponse.json({
        success: true,
        feedbackId: savedFeedback[0].id,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
