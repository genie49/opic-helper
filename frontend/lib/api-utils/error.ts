import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: "알 수 없는 오류가 발생했습니다.",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

export function validationError(message: string, details?: Record<string, any>): ApiError {
  return new ApiError(422, "VALIDATION_ERROR", message, details);
}

export function notFoundError(message: string = "요청한 리소스를 찾을 수 없습니다."): ApiError {
  return new ApiError(404, "NOT_FOUND", message);
}

export function unauthorizedError(message: string = "인증이 필요합니다."): ApiError {
  return new ApiError(401, "UNAUTHORIZED", message);
}

export function forbiddenError(message: string = "접근 권한이 없습니다."): ApiError {
  return new ApiError(403, "FORBIDDEN", message);
}
