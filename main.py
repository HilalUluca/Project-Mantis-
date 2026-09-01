"""Compatibility shim for the project root.

The frontend talks to http://localhost:8000, and when uvicorn is started from the
repository root it imports this file (`main:app`). The old root app only had mock
routes, so `/api/v1/auth/*` requests returned 404. We re-export the real backend
application so the frontend hits the same routes as the production backend.
"""

from backend.main import app

__all__ = ["app"]