"""Tenant middleware — extracts tenant context from JWT or header."""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class TenantMiddleware(BaseHTTPMiddleware):
    """Extracts tenant_id from the authenticated user's token and sets it on request state."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Tenant ID will be set by the auth dependency after JWT validation.
        # This middleware initializes the state so it's always available.
        request.state.tenant_id = None
        response = await call_next(request)
        return response
