# 🎬 Subbu — AI Subtitle & Voice Cloning Platform

Subbu is an AI-powered subtitle generation, translation, and voice cloning platform built specifically for Indian languages. Upload a video, get instant transcription via Groq's Whisper API, translate subtitles into 10+ Indic languages via Google Gemini API, generate natural-sounding voiceovers using Sarvam AI, customize your subtitle styles, and export your video in a single click.

## ✨ Key Features

- **Guest Mode Architecture**: The app allows seamless usage as a guest user for local development and demos. Authentication has been bypassed to facilitate friction-free access to the dashboard.
- **Auto-Transcription**: High-speed, highly accurate speech-to-text processing using Groq API (Whisper Large v3).
- **Indic Language Translation**: Deeply contextual text translation using Google Gemini API.
- **Voice Cloning & Dubbing**: Generate realistic AI voice clones for dubbing Indian languages via Sarvam AI.
- **Subtitle Styling Studio**: Fully customize subtitle fonts, colors, positioning, outlines, and animations.
- **Multiple Export Formats**: Render burned-in MP4s with customized subtitles, or download SRT, VTT, and ASS files.
- **Background Processing**: Reliable background job execution using Upstash QStash.

## 🏗 Architecture & Tech Stack

```text
┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────┐
│   Frontend          │    │   Backend            │    │   Services   │
│   (Next.js App Dir) │───▶│   (FastAPI)          │───▶│  Groq API    │
│   Tailwind CSS      │    │   Python 3.12        │    │  Gemini NMT  │
└─────────────────────┘    └─────────────────────┘    │  Sarvam AI   │
         │                          │                  │  FFmpeg      │
         │                          │                  └──────────────┘
         ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Supabase          │    │   Cloudflare R2     │
│   (Postgres + Auth) │    │   (Object Storage)  │
└─────────────────────┘    └─────────────────────┘
                                    ▲
                                    │
                           ┌─────────────────────┐
                           │   Upstash QStash    │
                           │   (Job Queue)       │
                           └─────────────────────┘
```

| Component | Technology |
|---|---|
| **Frontend** | Next.js 14, Tailwind CSS, Lucide React, Framer Motion |
| **Backend** | Python, FastAPI, Pydantic, Boto3 |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Cloudflare R2 |
| **Queue** | Upstash QStash |
| **AI Models** | Groq (Whisper), Gemini (Translation), Sarvam AI (Cloning) |
| **Media Processing**| FFmpeg, pydub, imageio-ffmpeg |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) 18+
- [Python](https://www.python.org/downloads/) 3.12+
- [FFmpeg](https://ffmpeg.org/download.html) installed locally
- API Keys: Supabase, Cloudflare R2, Groq, Google Gemini, Sarvam AI, Upstash

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sujithkrys/subbu.git subtitle-platform
   cd subtitle-platform
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   ```
   *Edit `.env.local` to include your Supabase and Backend API keys.*
   ```bash
   npm run dev
   ```

3. **Backend Setup:**
   ```bash
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
   *Create a `.env` file in the `backend/` directory with your API keys (Supabase, Cloudflare R2, Groq, Gemini, Sarvam AI, Upstash).*
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Database Setup:**
   - Execute the schema migration scripts found in `backend/db/` inside your Supabase SQL Editor.

5. **Start Creating!**
   - Head over to `http://localhost:3000`. You will be instantly redirected to the dashboard as a Guest User, skipping the login page completely.

## 🗣 Supported Languages

Subbu currently supports transcription, translation, and voice cloning in the following languages:

| Language | Code | | Language | Code |
|----------|------|-|----------|------|
| English | `en` | | Bengali | `bn` |
| Hindi | `hi` | | Marathi | `mr` |
| Telugu | `te` | | Gujarati | `gu` |
| Tamil | `ta` | | Punjabi | `pa` |
| Kannada | `kn` | | Odia | `or` |
| Malayalam| `ml` | | Assamese | `as` |
| Urdu | `ur` | | | |

## 🌐 API Endpoints Overview

| Method | Path | Description |
|--------|------|-------------|
| **POST** | `/projects` | Create a new project & generate R2 upload URL |
| **GET** | `/projects/{id}` | Fetch project details, transcripts, and exports |
| **POST** | `/projects/{id}/transcribe` | Trigger Groq Whisper transcription job |
| **POST** | `/projects/{id}/translate` | Trigger Gemini translation job |
| **POST** | `/projects/{id}/clone-voice` | Trigger Sarvam AI voice cloning job |
| **POST** | `/projects/{id}/style` | Save custom subtitle styling parameters |
| **POST** | `/projects/{id}/export` | Trigger FFmpeg video rendering job |
| **GET** | `/projects/{id}/status` | Poll real-time job progress |

## 📦 Export Capabilities

Subbu gives creators the flexibility to export their processed videos in the way that best fits their workflow:
- **SRT (.srt)**: The universally compatible standard subtitle format.
- **VTT (.vtt)**: Optimized for HTML5 web players.
- **ASS (.ass)**: Advanced SubStation Alpha for retaining highly customized styles, fonts, and colors.
- **Burned MP4 (.mp4)**: Hardcoded subtitles burned directly onto the video frames using FFmpeg, ready for social media upload.

## 📄 License
MIT License