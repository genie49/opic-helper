import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveySelections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const selections = await db
        .select()
        .from(surveySelections)
        .where(eq(surveySelections.userId, userId))
        .orderBy(surveySelections.createdAt);

      return NextResponse.json({
        selections,
        total: selections.length,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      const { selections } = body;

      if (!Array.isArray(selections) || selections.length < 6 || selections.length > 12) {
        return NextResponse.json(
          {
            error: "서베이는 최소 6개, 최대 12개 항목을 선택해야 합니다.",
            code: "INVALID_SELECTION_COUNT",
          },
          { status: 400 }
        );
      }

      const validatedSelections = selections.map((s: any) => ({
        userId,
        category: s.category,
        selection: s.selection,
      }));

      const result = await db
        .insert(surveySelections)
        .values(validatedSelections)
        .returning();

      return NextResponse.json({
        success: true,
        message: "서베이가 저장되었습니다.",
        count: result.length,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
