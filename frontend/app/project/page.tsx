"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getProject,
  startTranscription,
  startTranslation,
  saveStyle,
  startExport,
} from "@/lib/api";
import type {
  ProjectDetailResponse,
  Transcript,
  StylePreset,
  ExportFormat,
  Job,
} from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import VideoUploader from "@/components/VideoUploader";
import SubtitlePreviewPlayer from "@/components/SubtitlePreviewPlayer";
import SubtitleStylePicker from "@/components/SubtitleStylePicker";
import LanguageSelector from "@/components/LanguageSelector";
import ExportPanel from "@/components/ExportPanel";
import JobStatusBadge from "@/components/JobStatusBadge";

function ProjectEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("id") as string;

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Transcript state
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Translation state
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  // Style state
  const [selectedPreset, setSelectedPreset] = useState<StylePreset | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);

      // Set upload URL from project creation (stored in session)
      if (data.video_download_url) {
        setUploadComplete(true);
      }

      // Select the first transcript if available
      if (data.transcripts?.length > 0) {
        const asrTranscript = data.transcripts.find((t) => t.source === "asr");
        setSelectedTranscript(asrTranscript || data.transcripts[0]);
        if (asrTranscript) {
          setSourceLanguage(asrTranscript.language);
        }
      }

      // Load style
      if (data.style) {
        setSelectedPreset({
          name: "Custom",
          description: "",
          font: data.style.font,
          color: data.style.color,
          position: data.style.position as "top" | "center" | "bottom",
          animation_type: data.style.animation_type as any,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
      await startTranscription(projectId, {
        source_language: sourceLanguage || undefined,
      });
      // Polling will pick up the result
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTranslate = async () => {
    if (!targetLanguage) return;
    setIsTranslating(true);
    try {
      await startTranslation(projectId, {
        target_language: targetLanguage,
        source_language: sourceLanguage || undefined,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleStyleChange = async (preset: StylePreset) => {
    setSelectedPreset(preset);
    try {
      await saveStyle(projectId, {
        font: preset.font,
        color: preset.color,
        position: preset.position,
        animation_type: preset.animation_type,
      });
    } catch (err: any) {
      console.error("Failed to save style:", err);
    }
  };

  const handleExport = async (format: ExportFormat, burnIn: boolean) => {
    setIsExporting(true);
    try {
      await startExport(projectId, {
        format,
        burn_in: burnIn,
        transcript_id: selectedTranscript?.id,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusUpdate = (jobs: Job[], projectStatus: string) => {
    // Reload project data when a job completes
    const justCompleted = jobs.some((j) => j.status === "done");
    if (justCompleted) {
      loadProject();
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "spin-slow 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 64px)",
          gap: "16px",
        }}
      >
        <p style={{ color: "#ef4444" }}>Error: {error}</p>
        <button className="btn-secondary" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <Sidebar projectId={projectId} projectTitle={project?.title || undefined} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "32px 40px",
          maxWidth: "1000px",
        }}
      >
        {/* Job Status */}
        <div style={{ marginBottom: "32px" }}>
          <JobStatusBadge
            projectId={projectId}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: "0.9rem",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Section: Upload */}
        <section id="section-upload" style={{ marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>📤</span> Upload Video
          </h2>
          {!uploadComplete && !project?.video_download_url ? (
            <VideoUploader
              uploadUrl={uploadUrl}
              onUploadComplete={() => {
                setUploadComplete(true);
                handleTranscribe();
              }}
              onUploadError={(err) => setError(err)}
            />
          ) : (
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
              }}
            >
              <span className="badge badge-success">✓ Uploaded</span>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                Video uploaded successfully
              </span>
              {!selectedTranscript && (
                <button
                  className="btn-primary"
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  style={{ marginLeft: "auto", padding: "8px 16px", fontSize: "0.85rem" }}
                >
                  {isTranscribing ? "Starting..." : "🎤 Start Transcription"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Section: Preview */}
        <section id="section-preview" style={{ marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>🖥️</span> Preview
          </h2>
          <SubtitlePreviewPlayer
            videoUrl={project?.video_download_url || null}
            segments={selectedTranscript?.segments || []}
            style={
              selectedPreset
                ? {
                    font: selectedPreset.font,
                    color: selectedPreset.color,
                    position: selectedPreset.position,
                    animation_type: selectedPreset.animation_type,
                  }
                : null
            }
          />
        </section>

        {/* Section: Transcript */}
        {(project?.transcripts?.length ?? 0) > 0 && (
          <section id="section-transcript" style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>📝</span> Transcript
            </h2>

            {/* Transcript tabs */}
            {(project?.transcripts?.length ?? 0) > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                {project!.transcripts.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTranscript(t)}
                    className={
                      selectedTranscript?.id === t.id
                        ? "btn-primary"
                        : "btn-secondary"
                    }
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                  >
                    {t.language.toUpperCase()} ({t.source})
                  </button>
                ))}
              </div>
            )}

            {/* Segments list */}
            <div
              className="card"
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                padding: "0",
              }}
            >
              {selectedTranscript?.segments.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    gap: "16px",
                    fontSize: "0.9rem",
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-accent-light)",
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      minWidth: "100px",
                      flexShrink: 0,
                    }}
                  >
                    {seg.start.toFixed(1)}s → {seg.end.toFixed(1)}s
                  </span>
                  <span style={{ color: "var(--color-text-primary)" }}>
                    {seg.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Translate */}
        {selectedTranscript && (
          <section id="section-translate" style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>🌐</span> Translate
            </h2>
            <LanguageSelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceChange={setSourceLanguage}
              onTargetChange={setTargetLanguage}
              onTranslate={handleTranslate}
              isTranslating={isTranslating}
            />
          </section>
        )}

        {/* Section: Style */}
        {selectedTranscript && (
          <section id="section-style" style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>🎨</span> Style
            </h2>
            <SubtitleStylePicker
              selectedPreset={selectedPreset}
              onSelectPreset={handleStyleChange}
            />
          </section>
        )}

        {/* Section: Export */}
        {selectedTranscript && (
          <section id="section-export" style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>📥</span> Export
            </h2>
            <ExportPanel
              onExport={handleExport}
              isExporting={isExporting}
              downloads={
                project?.exports
                  ?.filter((e) => e.url)
                  .map((e) => ({
                    format: e.format,
                    url: e.url!,
                    created_at: e.created_at,
                  })) || []
              }
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading project...</div>}>
      <ProjectEditor />
    </Suspense>
  );
}
