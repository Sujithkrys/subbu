# 🎬 AI Subtitle Generator Platform

AI-powered subtitle generation and translation platform for Indian languages. Upload a video, get instant transcription via Groq Whisper, translate into Telugu, Hindi, Tamil, and more via Google Gemini API, customize subtitle styles, and export in multiple formats.

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────┐
│   Frontend          │    │   Backend            │    │   Services   │
│   (Next.js)         │───▶│   (FastAPI)          │───▶│              │
│   Cloudflare Pages  │    │   Render             │    │  Groq Whisper│
└─────────────────────┘    └─────────────────────┘    │  Gemini NMT    │
         │                          │                  │  FFmpeg      │
         │                          │                  └──────────────┘
         ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Supabase          │    │   Cloudflare R2     │
│   (Auth + Postgres) │    │   (Object Storage)  │
└─────────────────────┘    └─────────────────────┘
                                    ▲
                                    │
                           ┌─────────────────────┐
                           │   Upstash            │
                           │   (Redis + QStash)   │
                           └─────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Python + FastAPI |
| Database + Auth | Supabase (Postgres + Auth) |
| Object Storage | Cloudflare R2 |
| Job Queue | Upstash Redis + QStash |
| Speech-to-Text | Groq API (Whisper Large v3) |
| Translation | Google Gemini API (gemini-3-flash) |
| Video Processing | FFmpeg |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- FFmpeg installed locally
- Accounts on: Supabase, Cloudflare, Groq, Gemini (Google AI), Upstash

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sujithkrys/subbu.git subtitle-platform
   cd subtitle-platform
   ```

2. **Copy environment variables:**
   ```bash
   cp .env.example .env
   # Fill in all credentials
   ```

3. **Set up the database:**
   - Create a Supabase project
   - Run `backend/db/schema.sql` in the Supabase SQL Editor

4. **Start the backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

5. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Open the app:**
   Visit `http://localhost:3000`

## Supported Languages

| Language | Code |
|----------|------|
| English | en |
| Hindi | hi |
| Telugu | te |
| Tamil | ta |
| Kannada | kn |
| Malayalam | ml |
| Bengali | bn |
| Marathi | mr |
| Gujarati | gu |
| Punjabi | pa |
| Odia | or |
| Urdu | ur |
| Assamese | as |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/projects` | Create project + get presigned upload URL |
| GET | `/projects` | List user's projects |
| GET | `/projects/{id}` | Get project details |
| POST | `/projects/{id}/transcribe` | Start transcription |
| POST | `/projects/{id}/translate` | Start translation |
| POST | `/projects/{id}/style` | Save subtitle style |
| POST | `/projects/{id}/export` | Start export |
| GET | `/projects/{id}/status` | Get job statuses |

## Export Formats

- **SRT** — SubRip Subtitle (most compatible)
- **VTT** — WebVTT (web-optimized)
- **ASS** — Advanced SubStation Alpha (styled)
- **Burned MP4** — Subtitles burned into video

## License

MIT