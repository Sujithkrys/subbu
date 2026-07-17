/**
 * Shared TypeScript types for the AI Subtitle Generator Platform.
 */

// ── Core Types ──────────────────────────────────────────────────────────────

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  words?: WordTimestamp[]; // populated when karaoke/word-level timestamps are requested
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
  is_favorite?: boolean;
  file_size_bytes?: number;
  transcripts?: Transcript[];
  exports?: ExportRecord[];
  subtitle_styles?: SubtitleStyle[];
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

export type AnimationType = "fade" | "slide" | "pop" | "typewriter" | "none" | "karaoke";

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

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  project_id?: string;
  action: string;
  details?: any;
  created_at: string;
  projects?: { title: string }; // joined from projects table
}

export interface DashboardMetricsResponse {
  metrics: {
    total_videos: number;
    total_minutes: number;
    storage_bytes: number;
    distinct_languages: number;
  };
  top_languages: { language: string; count: number }[];
  recent_activity: ActivityLogEntry[];
}

export interface TranscribeRequest {
  source_language?: string;
  trim_start?: number; // seconds from start
  trim_end?: number;   // seconds from start
  word_timestamps?: boolean; // enable karaoke word-level highlights
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
    name: "Minimal",
    description: "Small, clean, bottom-centered, no animation",
    font: "Helvetica",
    color: "#CCCCCC",
    position: "bottom",
    animation_type: "none",
  },
  {
    name: "Bold Pop",
    description: "Large, high-contrast, warm orange color, slight pop animation",
    font: "Impact",
    color: "#F97316",
    position: "bottom",
    animation_type: "pop",
  },
  {
    name: "Karaoke",
    description: "Word-by-word highlight as it's spoken in real time",
    font: "Inter",
    color: "#10B981",
    position: "bottom",
    animation_type: "karaoke",
  },
  {
    name: "Classic",
    description: "Traditional white text with black outline",
    font: "Arial",
    color: "#FFFFFF",
    position: "bottom",
    animation_type: "fade",
  },
];
