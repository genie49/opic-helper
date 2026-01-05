"""
FastAPI application for OPIc learning service.
Handles AI evaluation and roleplay with SSE streaming.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health
from app.core.config import settings

app = FastAPI(
    title="OPIc Learning Service API",
    description="AI-powered OPIc evaluation and practice system",
    version="0.1.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix="/api", tags=["health"])

# TODO: Add other routers
# app.include_router(evaluate.router, prefix="/api", tags=["evaluate"])
# app.include_router(roleplay.router, prefix="/api", tags=["roleplay"])
# app.include_router(generate.router, prefix="/api", tags=["generate"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "OPIc Learning Service API",
        "version": "0.1.0",
        "status": "running",
    }
