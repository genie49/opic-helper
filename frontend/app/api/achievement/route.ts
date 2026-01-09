import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbacks, opicLevels } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError } from "@/lib/api-utils/error";

interface LevelCriteria {
  levelCode: string;
  levelName: string;
  minUtterance: number;
  minWords: number;
  minConnectors: number;
  minModifiers: number;
}

interface AchievementStatus {
  levelCode: string;
  achieved: boolean;
  avgUtterance: number;
  avgWords: number;
  avgConnectors: number;
  avgModifiers: number;
  criteria: {
    utterance: { target: number; achieved: boolean; percentage: number };
    words: { target: number; achieved: boolean; percentage: number };
    connectors: { target: number; achieved: boolean; percentage: number };
    modifiers: { target: number; achieved: boolean; percentage: number };
  };
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const levels = await db
        .select({
          levelCode: opicLevels.levelCode,
          levelName: opicLevels.levelName,
          minUtterance: opicLevels.minUtterance,
          minWords: opicLevels.minWords,
          minConnectors: opicLevels.minConnectors,
          minModifiers: opicLevels.minModifiers,
        })
        .from(opicLevels)
        .orderBy(opicLevels.levelOrder);

      const recentFeedbacks = await db
        .select({
          feedback: feedbacks.feedback,
          scores: feedbacks.scores,
        })
        .from(feedbacks)
        .where(eq(feedbacks.userId, userId))
        .orderBy(desc(feedbacks.createdAt))
        .limit(20);

      if (recentFeedbacks.length === 0) {
        return NextResponse.json({
          success: true,
          levels: levels.map((level) => ({
            levelCode: level.levelCode,
            levelName: level.levelName,
            achieved: false,
            avgUtterance: 0,
            avgWords: 0,
            avgConnectors: 0,
            avgModifiers: 0,
            criteria: {
              utterance: {
                target: level.minUtterance || 0,
                achieved: false,
                percentage: 0,
              },
              words: {
                target: level.minWords || 0,
                achieved: false,
                percentage: 0,
              },
              connectors: {
                target: level.minConnectors || 0,
                achieved: false,
                percentage: 0,
              },
              modifiers: {
                target: level.minModifiers || 0,
                achieved: false,
                percentage: 0,
              },
            },
          })),
        });
      }

      let totalUtterance = 0;
      let totalWords = 0;
      let totalConnectors = 0;
      let totalModifiers = 0;
      let validCount = 0;

      recentFeedbacks.forEach((fb) => {
        const metrics = fb.feedback as any;

        if (metrics.word_count) {
          totalWords += metrics.word_count;
        }

        if (metrics.sentence_count) {
          totalUtterance += metrics.sentence_count;
        }

        if (metrics.connector_count) {
          totalConnectors += metrics.connector_count;
        }

        if (metrics.quantitativeMetrics?.modifier_count) {
          totalModifiers += metrics.quantitativeMetrics.modifier_count;
        }

        validCount++;
      });

      const avgUtterance = validCount > 0 ? totalUtterance / validCount : 0;
      const avgWords = validCount > 0 ? totalWords / validCount : 0;
      const avgConnectors = validCount > 0 ? totalConnectors / validCount : 0;
      const avgModifiers = validCount > 0 ? totalModifiers / validCount : 0;

      const achievementStatuses: AchievementStatus[] = levels.map((level) => {
        const utteranceTarget = level.minUtterance || 0;
        const wordsTarget = level.minWords || 0;
        const connectorsTarget = level.minConnectors || 0;
        const modifiersTarget = level.minModifiers || 0;

        const utteranceAchieved = avgUtterance >= utteranceTarget;
        const wordsAchieved = avgWords >= wordsTarget;
        const connectorsAchieved = avgConnectors >= connectorsTarget;
        const modifiersAchieved = avgModifiers >= modifiersTarget;

        const allAchieved =
          utteranceAchieved &&
          wordsAchieved &&
          connectorsAchieved &&
          modifiersAchieved;

        return {
          levelCode: level.levelCode,
          levelName: level.levelName,
          achieved: allAchieved,
          avgUtterance: Math.round(avgUtterance),
          avgWords: Math.round(avgWords),
          avgConnectors: Math.round(avgConnectors),
          avgModifiers: Math.round(avgModifiers),
          criteria: {
            utterance: {
              target: utteranceTarget,
              achieved: utteranceAchieved,
              percentage: utteranceTarget > 0 ? Math.min(100, (avgUtterance / utteranceTarget) * 100) : 100,
            },
            words: {
              target: wordsTarget,
              achieved: wordsAchieved,
              percentage: wordsTarget > 0 ? Math.min(100, (avgWords / wordsTarget) * 100) : 100,
            },
            connectors: {
              target: connectorsTarget,
              achieved: connectorsAchieved,
              percentage: connectorsTarget > 0 ? Math.min(100, (avgConnectors / connectorsTarget) * 100) : 100,
            },
            modifiers: {
              target: modifiersTarget,
              achieved: modifiersAchieved,
              percentage: modifiersTarget > 0 ? Math.min(100, (avgModifiers / modifiersTarget) * 100) : 100,
            },
          },
        };
      });

      return NextResponse.json({
        success: true,
        levels: achievementStatuses,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
