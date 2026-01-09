import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { examSessions, feedbacks, questions, questionTopics } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError } from "@/lib/api-utils/error";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (userId) => {
    try {
      const sessionId = params.id;

      const session = await db
        .select()
        .from(examSessions)
        .where(eq(examSessions.id, sessionId))
        .limit(1);

      if (!session || session.length === 0) {
        return NextResponse.json(
          { error: "모의고사 세션을 찾을 수 없습니다.", code: "SESSION_NOT_FOUND" },
          { status: 404 }
        );
      }

      const sessionData = session[0];

      const examFeedbacks = await db
        .select({
          id: feedbacks.id,
          questionId: feedbacks.questionId,
          questionText: questions.questionText,
          topicName: questionTopics.topicName,
          answerText: feedbacks.answerText,
          evaluatedLevel: feedbacks.evaluatedLevel,
          scores: feedbacks.scores,
          feedback: feedbacks.feedback,
        })
        .from(feedbacks)
        .innerJoin(questions, eq(feedbacks.questionId, questions.id))
        .innerJoin(questionTopics, eq(questions.topicId, questionTopics.id))
        .where(eq(feedbacks.examSessionId, sessionId));

      const totalScore = examFeedbacks.reduce((sum, f) => {
        const scores = f.scores as any;
        return (
          sum +
          (scores.utterance || 0) +
          (scores.grammar || 0) +
          (scores.vocabulary || 0) +
          (scores.structure || 0) +
          (scores.pronunciation || 0)
        );
      }, 0);

      const averageScore = examFeedbacks.length > 0 ? totalScore / examFeedbacks.length : 0;

      const levelCount: Record<string, number> = {};
      examFeedbacks.forEach((f) => {
        if (f.evaluatedLevel) {
          levelCount[f.evaluatedLevel] = (levelCount[f.evaluatedLevel] || 0) + 1;
        }
      });

      const dominantLevel = Object.entries(levelCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const report = {
        totalQuestions: sessionData.questionIds.length,
        answeredQuestions: examFeedbacks.length,
        totalScore,
        averageScore: averageScore.toFixed(1),
        overallLevel: dominantLevel,
        scoreBreakdown: {
          utterance: examFeedbacks.reduce((sum, f) => sum + (f.scores as any).utterance, 0),
          grammar: examFeedbacks.reduce((sum, f) => sum + (f.scores as any).grammar, 0),
          vocabulary: examFeedbacks.reduce((sum, f) => sum + (f.scores as any).vocabulary, 0),
          structure: examFeedbacks.reduce((sum, f) => sum + (f.scores as any).structure, 0),
          pronunciation: examFeedbacks.reduce((sum, f) => sum + (f.scores as any).pronunciation, 0),
        },
        levelDistribution: levelCount,
        questionResults: examFeedbacks,
      };

      await db
        .update(examSessions)
        .set({
          completedAt: new Date(),
          totalScore,
          averageLevel: dominantLevel,
          report,
        })
        .where(eq(examSessions.id, sessionId));

      return NextResponse.json({
        success: true,
        report,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (userId) => {
    try {
      const sessionId = params.id;

      const session = await db
        .select({
          id: examSessions.id,
          questionIds: examSessions.questionIds,
          completedAt: examSessions.completedAt,
          totalTimeSpent: examSessions.totalTimeSpent,
          totalScore: examSessions.totalScore,
          averageLevel: examSessions.averageLevel,
          report: examSessions.report,
          createdAt: examSessions.createdAt,
        })
        .from(examSessions)
        .where(eq(examSessions.id, sessionId))
        .limit(1);

      if (!session || session.length === 0) {
        return NextResponse.json(
          { error: "모의고사 세션을 찾을 수 없습니다.", code: "SESSION_NOT_FOUND" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        session: session[0],
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
