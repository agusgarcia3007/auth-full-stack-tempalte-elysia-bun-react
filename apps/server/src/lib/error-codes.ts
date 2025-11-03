/**
 * Error codes for API responses
 * Provides consistent error handling across all endpoints
 */

export const ErrorCodes = {
  // Authentication errors (1000-1099)
  AUTH_USER_ALREADY_EXISTS: "AUTH_USER_ALREADY_EXISTS",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_NO_TOKEN: "AUTH_NO_TOKEN",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_NO_REFRESH_TOKEN: "AUTH_NO_REFRESH_TOKEN",
  AUTH_INVALID_REFRESH_TOKEN: "AUTH_INVALID_REFRESH_TOKEN",
  AUTH_REFRESH_TOKEN_REVOKED: "AUTH_REFRESH_TOKEN_REVOKED",
  AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",

  // Validation errors (2000-2099)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  VALIDATION_INVALID_EMAIL: "VALIDATION_INVALID_EMAIL",
  VALIDATION_INVALID_PASSWORD: "VALIDATION_INVALID_PASSWORD",
  VALIDATION_REQUIRED_FIELD: "VALIDATION_REQUIRED_FIELD",

  // Server errors (5000-5099)
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",

  // Not found errors (4000-4099)
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error messages mapped to error codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCodes.AUTH_USER_ALREADY_EXISTS]: "A user with this email already exists",
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorCodes.AUTH_NO_TOKEN]: "No authentication token provided",
  [ErrorCodes.AUTH_INVALID_TOKEN]: "Invalid or malformed token",
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: "Token has expired",
  [ErrorCodes.AUTH_NO_REFRESH_TOKEN]: "No refresh token provided",
  [ErrorCodes.AUTH_INVALID_REFRESH_TOKEN]: "Invalid refresh token",
  [ErrorCodes.AUTH_REFRESH_TOKEN_REVOKED]: "Refresh token has been revoked",
  [ErrorCodes.AUTH_USER_NOT_FOUND]: "User not found",
  [ErrorCodes.AUTH_UNAUTHORIZED]: "Unauthorized access",
  [ErrorCodes.AUTH_FORBIDDEN]: "Forbidden: insufficient permissions",

  // Validation
  [ErrorCodes.VALIDATION_ERROR]: "Validation error",
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: "Invalid email format",
  [ErrorCodes.VALIDATION_INVALID_PASSWORD]: "Password does not meet requirements",
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: "Required field is missing",

  // Server
  [ErrorCodes.INTERNAL_SERVER_ERROR]: "Internal server error",
  [ErrorCodes.DATABASE_ERROR]: "Database operation failed",

  // Not found
  [ErrorCodes.RESOURCE_NOT_FOUND]: "Resource not found",
};

/**
 * HTTP status codes mapped to error codes
 */
export const ErrorStatusCodes: Record<ErrorCode, number> = {
  // Authentication - 401 Unauthorized / 403 Forbidden
  [ErrorCodes.AUTH_USER_ALREADY_EXISTS]: 409,
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCodes.AUTH_NO_TOKEN]: 401,
  [ErrorCodes.AUTH_INVALID_TOKEN]: 401,
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCodes.AUTH_NO_REFRESH_TOKEN]: 401,
  [ErrorCodes.AUTH_INVALID_REFRESH_TOKEN]: 401,
  [ErrorCodes.AUTH_REFRESH_TOKEN_REVOKED]: 401,
  [ErrorCodes.AUTH_USER_NOT_FOUND]: 404,
  [ErrorCodes.AUTH_UNAUTHORIZED]: 401,
  [ErrorCodes.AUTH_FORBIDDEN]: 403,

  // Validation - 400 Bad Request
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: 400,
  [ErrorCodes.VALIDATION_INVALID_PASSWORD]: 400,
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: 400,

  // Server - 500 Internal Server Error
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,

  // Not found - 404
  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
};

/**
 * Helper function to create error responses
 */
export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: unknown
) {
  const error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  } = {
    code,
    message: customMessage || ErrorMessages[code],
  };

  if (details !== undefined) {
    error.details = details;
  }

  return {
    success: false,
    error,
  };
}

/**
 * Helper function to create error responses with status code
 */
export function createError(
  code: ErrorCode,
  customMessage?: string,
  details?: unknown
) {
  return {
    status: ErrorStatusCodes[code],
    body: createErrorResponse(code, customMessage, details),
  };
}
