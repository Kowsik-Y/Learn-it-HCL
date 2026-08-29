"""
Gateway Auth Middleware — Validates requests from Next.js API gateway.

The Python ML service is only called by the Next.js API gateway,
which passes user identity via headers after JWT validation.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse


class GatewayAuthMiddleware(BaseHTTPMiddleware):
    """
    Validates that requests come from the Next.js gateway.

    Reads X-User-Id and X-Tenant-Id headers set by the gateway
    and makes them available on request.state.
    """

    # Paths that don't require gateway auth
    EXCLUDED_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip auth for health check and docs
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        user_id = request.headers.get("X-User-Id")
        tenant_id = request.headers.get("X-Tenant-Id")

        if not user_id or not tenant_id:
            return JSONResponse(
                status_code=401,
                content={
                    "detail": "Missing gateway auth headers (X-User-Id, X-Tenant-Id). "
                    "This service should only be called by the Next.js API gateway."
                },
            )

        # Set on request state for use in route handlers
        request.state.user_id = user_id
        request.state.tenant_id = tenant_id

        return await call_next(request)
