/**
 * Shared TypeScript types for the AI Subtitle Generator Platform.
 */

// ── Core Types ──────────────────────────────────────────────────────────────

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string | null;
  video_url: string | null;
  video_download_url?: string | null;
  duration_seconds: number | null;
  status: ProjectStatus;
  created_at: string;
}

export type ProjectStatus =
  | "uploaded"
  | "transcribing"
  | "translating"
  | "ready"
  | "failed";

export interface Transcript {
  id: string;
  project_id: string;
  language: string;
  segments: Segment[];
  source: "asr" | "translated";
  created_at: string;
}

export interface SubtitleStyle {
  id: string;
  project_id: string;
  font: string;
  color: string;
  position: "top" | "center" | "bottom";
  animation_type: AnimationType | null;
  created_at: string;
}

export type AnimationType = "fade" | "slide" | "pop" | "typewriter" | "none";

export interface ExportRecord {
  id: string;
  project_id: string;
  format: ExportFormat;
  url: string | null;
  created_at: string;
}

export type ExportFormat = "srt" | "vtt" | "ass" | "burned_mp4";

export interface Job {
  id: string;
  project_id: string;
  type: "transcribe" | "translate" | "render";
  status: "queued" | "processing" | "done" | "failed";
  progress: number;
  error: string | null;
  created_at: string;
}

// ── API Request/Response Types ──────────────────────────────────────────────

export interface CreateProjectRequest {
  title: string;
}

export interface CreateProjectResponse {
  id: string;
  title: string;
  upload_url: string;
  video_key: string;
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface TranscribeRequest {
  source_language?: string;
}

export interface TranslateRequest {
  target_language: string;
  source_language?: string;
}

export interface StyleRequest {
  font: string;
  color: string;
  position: string;
  animation_type?: string | null;
}

export interface ExportRequest {
  format: ExportFormat;
  burn_in: boolean;
  transcript_id?: string;
}

export interface ProjectStatusResponse {
  project_id: string;
  project_status: ProjectStatus;
  jobs: Job[];
  transcripts: Transcript[];
  exports: ExportRecord[];
}

export interface ProjectDetailResponse extends Project {
  transcripts: Transcript[];
  exports: ExportRecord[];
  style: SubtitleStyle | null;
}

// ── Language Types ──────────────────────────────────────────────────────────

export interface Language {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "ur", name: "Urdu" },
  { code: "as", name: "Assamese" },
];

// ── Style Presets ───────────────────────────────────────────────────────────

export interface StylePreset {
  name: string;
  description: string;
  font: string;
  color: string;
  position: "top" | "center" | "bottom";
  animation_type: AnimationType | null;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    name: "Classic White",
    description: "Clean white subtitles at the bottom",
    font: "Arial",
    color: "#FFFFFF",
    position: "bottom",
    animation_type: "fade",
  },
  {
    name: "Neon Glow",
    description: "Vibrant cyan with glow effect",
    font: "Courier New",
    color: "#00FFFF",
    position: "bottom",
    animation_type: "pop",
  },
  {
    name: "Gradient Pop",
    description: "Warm golden subtitles with pop animation",
    font: "Georgia",
    color: "#FFD700",
    position: "bottom",
    animation_type: "pop",
  },
  {
    name: "Cinematic",
    description: "Elegant serif font, centered positioning",
    font: "Times New Roman",
    color: "#F0E6D2",
    position: "center",
    animation_type: "fade",
  },
  {
    name: "Minimal",
    description: "Simple light gray, no animation",
    font: "Helvetica",
    color: "#CCCCCC",
    position: "bottom",
    animation_type: "none",
  },
];
