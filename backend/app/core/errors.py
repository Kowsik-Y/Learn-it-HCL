"""
Learn-it HCL — Consistent Error Handling

Machine-readable error responses with request IDs.
Never leak stack traces to users.
"""

from typing import Any
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class AppError(HTTPException):
    """Application-level error with a machine-readable code."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        self.code = code
        self.error_message = message
        self.details = details
        super().__init__(status_code=status_code, detail=message)


# ── Common Error Codes ───────────────────────────────────────

class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str | None = None):
        msg = f"{resource} not found"
        if resource_id:
            msg = f"{resource} with id '{resource_id}' not found"
        super().__init__(404, f"{resource.upper()}_NOT_FOUND", msg)


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(401, "AUTHENTICATION_REQUIRED", message)


class AuthorizationError(AppError):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(403, "INSUFFICIENT_PERMISSIONS", message)


class ValidationError(AppError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(422, "VALIDATION_ERROR", message, details)


class ConflictError(AppError):
    def __init__(self, message: str):
        super().__init__(409, "CONFLICT", message)


class RateLimitError(AppError):
    def __init__(self):
        super().__init__(429, "RATE_LIMIT_EXCEEDED", "Too many requests")


class TenantAccessError(AppError):
    def __init__(self):
        super().__init__(403, "TENANT_ACCESS_DENIED", "Access denied for this tenant")


class LearnerNotEnrolledError(AppError):
    def __init__(self):
        super().__init__(403, "LEARNER_NOT_ENROLLED", "Learner is not enrolled in this course")


# ── Error Handler ────────────────────────────────────────────

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Format AppError exceptions into consistent JSON responses."""
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.error_message,
                "request_id": request_id,
                **({"details": exc.details} if exc.details else {}),
            }
        },
    )
