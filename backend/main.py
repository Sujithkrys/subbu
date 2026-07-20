"""
AI Subtitle Generator Platform — FastAPI Backend
Main application entrypoint.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import projects, transcribe, translate, cloning, style, export, status, voice_samples
from workers import transcribe_worker, translate_worker, render_worker

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    print("Subtitle Platform API starting up...")
    yield
    print("Subtitle Platform API shutting down...")


app = FastAPI(
    title="AI Subtitle Generator API",
    description="Backend API for AI-powered subtitle generation and translation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "https://subbu.teamsvastrinots.workers.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(transcribe.router, prefix="/projects", tags=["Transcription"])
app.include_router(translate.router, prefix="/projects", tags=["Translation"])
app.include_router(cloning.router, prefix="/projects", tags=["Cloning"])
app.include_router(voice_samples.router, tags=["Voice Samples"])
app.include_router(style.router, prefix="/projects", tags=["Styling"])
app.include_router(export.router, prefix="/projects", tags=["Export"])
app.include_router(status.router, prefix="/projects", tags=["Status"])

# Mount worker endpoints (called by QStash)
app.include_router(transcribe_worker.router, tags=["Workers"])
app.include_router(translate_worker.router, tags=["Workers"])
app.include_router(render_worker.router, tags=["Workers"])


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "subtitle-platform-api", "version": "1.0.0"}
