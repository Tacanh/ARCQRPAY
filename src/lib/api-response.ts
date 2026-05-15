import { NextResponse } from 'next/server';

type ErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'CIRCLE_ERROR'
  | 'WEBHOOK_INVALID';

interface ApiError {
  error: ErrorCode;
  message: string;
}

/** Return a standardised JSON error response. */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: 400 | 404 | 500 | 401 = 400
): NextResponse<ApiError> {
  return NextResponse.json({ error: code, message }, { status });
}

/** Return a standardised JSON success response. */
export function successResponse<T>(data: T, status: 200 | 201 = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
