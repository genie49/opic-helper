import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils/auth";
import { handleApiError, validationError } from "@/lib/api-utils/error";

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      const { topic, questionType, currentLevel, targetLevel } = body;

      if (!topic || !questionType) {
        throw validationError("필수 항목이 누락되었습니다.", {
          required: ["topic", "questionType"],
        });
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/generate-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          question_type: questionType,
          current_level: currentLevel || "IM2",
          target_level: targetLevel || "IH",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "문제 생성 실패");
      }

      const data = await response.json();

      return NextResponse.json(data);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
