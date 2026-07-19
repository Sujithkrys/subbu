/**
 * Typed API wrapper for calling the FastAPI backend.
 * Automatically injects the Supabase auth token.
 */

import { createClient } from "./supabaseClient";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectListResponse,
  ProjectDetailResponse,
  ProjectStatusResponse,
  TranscribeRequest,
  TranslateRequest,
  StyleRequest,
  ExportRequest,
  SubtitleStyle,
  DashboardMetricsResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ── Project APIs ────────────────────────────────────────────────────────────

export async function createProject(
  data: CreateProjectRequest
): Promise<CreateProjectResponse> {
  return apiFetch<CreateProjectResponse>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listProjects(): Promise<ProjectListResponse> {
  return apiFetch<ProjectListResponse>("/projects");
}

export async function getProject(
  projectId: string
): Promise<ProjectDetailResponse> {
  return apiFetch<ProjectDetailResponse>(`/projects/${projectId}`);
}

export async function getProjectStatus(
  projectId: string
): Promise<ProjectStatusResponse> {
  return apiFetch<ProjectStatusResponse>(`/projects/${projectId}/status`);
}

// ── Transcription APIs ──────────────────────────────────────────────────────

export async function startTranscription(
  projectId: string,
  data: TranscribeRequest = {}
): Promise<{ job_id: string; message: string }> {
  return apiFetch(`/projects/${projectId}/transcribe`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Translation APIs ────────────────────────────────────────────────────────

export async function startTranslation(
  projectId: string,
  data: TranslateRequest
): Promise<{ job_id: string; message: string }> {
  return apiFetch(`/projects/${projectId}/translate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Style APIs ──────────────────────────────────────────────────────────────

export async function saveStyle(
  projectId: string,
  data: StyleRequest
): Promise<SubtitleStyle> {
  return apiFetch<SubtitleStyle>(`/projects/${projectId}/style`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getStyle(
  projectId: string
): Promise<SubtitleStyle | null> {
  return apiFetch<SubtitleStyle | null>(`/projects/${projectId}/style`);
}

// ── Export APIs ──────────────────────────────────────────────────────────────

export async function startExport(
  projectId: string,
  data: ExportRequest
): Promise<{ job_id: string; message: string }> {
  return apiFetch(`/projects/${projectId}/export`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listExports(
  projectId: string
): Promise<any> {
  return apiFetch(`/projects/${projectId}/exports`);
}

// ── Dashboard APIs ──────────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<DashboardMetricsResponse> {
  return apiFetch<DashboardMetricsResponse>("/projects/dashboard/metrics");
}

export async function toggleFavorite(projectId: string, isFavorite: boolean): Promise<any> {
  return apiFetch(`/projects/${projectId}/favorite`, {
    method: "POST",
    body: JSON.stringify({ is_favorite: isFavorite }),
  });
}

export async function duplicateProject(projectId: string): Promise<CreateProjectResponse> {
  return apiFetch<CreateProjectResponse>(`/projects/${projectId}/duplicate`, {
    method: "POST",
  });
}

export async function deleteProject(projectId: string): Promise<any> {
  return apiFetch(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function updateTranscriptSegments(
  projectId: string,
  transcriptId: string,
  segments: import("./types").Segment[]
): Promise<import("./types").Transcript> {
  return apiFetch<import("./types").Transcript>(`/projects/${projectId}/transcripts/${transcriptId}`, {
    method: "PUT",
    body: JSON.stringify({ segments }),
  });
}

// ── Upload Helper ───────────────────────────────────────────────────────────

export async function uploadVideoToR2(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.send(file);
  });
}

/** Fetch the current user's monthly usage & limits */
export async function getUserUsage(): Promise<{
  usage: {
    transcription_seconds_used: number;
    translation_characters_used: number;
    month: string;
  };
  limits: {
    transcription_seconds: number;
    translation_characters: number;
  };
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/projects/user/usage`, { headers });
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}

export async function getUserSettings(): Promise<{ user_id: string; theme: string }> {
  return apiFetch<{ user_id: string; theme: string }>("/projects/user/settings");
}

export async function updateUserSettings(theme: string): Promise<{ user_id: string; theme: string }> {
  return apiFetch<{ user_id: string; theme: string }>("/projects/user/settings", {
    method: "PATCH",
    body: JSON.stringify({ theme }),
  });
}
