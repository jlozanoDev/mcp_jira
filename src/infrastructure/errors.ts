export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly source?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, source?: string) {
    super(message, 401, source);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, source?: string) {
    super(message, 403, source);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, source?: string) {
    super(message, 404, source);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, source?: string) {
    super(message, 400, source);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, source?: string) {
    super(message, 429, source);
    this.name = "RateLimitError";
  }
}

export function formatError(error: unknown): string {
  if (error instanceof AppError) {
    return `[${error.source || "Unknown"}] ${error.message} (Status: ${error.statusCode || "N/A"})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
