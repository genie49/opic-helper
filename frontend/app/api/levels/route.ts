import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { opicLevels } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { handleApiError } from "@/lib/api-utils/error";

export async function GET(request: NextRequest) {
  try {
    const levels = await db
      .select({
        id: opicLevels.id,
        levelCode: opicLevels.levelCode,
        levelName: opicLevels.levelName,
        levelOrder: opicLevels.levelOrder,
      })
      .from(opicLevels)
      .orderBy(asc(opicLevels.levelOrder));

    return NextResponse.json({ levels });
  } catch (error) {
    return handleApiError(error);
  }
}
