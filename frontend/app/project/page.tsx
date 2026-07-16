"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getProject,
  startTranscription,
  startTranslation,
  saveStyle,
  startExport,
  updateTranscriptSegments,
} from "@/lib/api";
import type {
  ProjectDetailResponse,
  Transcript,
  StylePreset,
  ExportFormat,
  Job,
  Segment,
} from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import VideoUploader from "@/components/VideoUploader";
import SubtitlePreviewPlayer from "@/components/SubtitlePreviewPlayer";
import SubtitleStylePicker from "@/components/SubtitleStylePicker";
import LanguageSelector from "@/components/LanguageSelector";
import ExportPanel from "@/components/ExportPanel";
import JobStatusBadge from "@/components/JobStatusBadge";
import TranscriptEditor from "@/components/TranscriptEditor";
import KaraokePlayer from "@/components/KaraokePlayer";

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

  // Trim state
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [wordTimestamps, setWordTimestamps] = useState<boolean>(false);

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
        trim_start: trimStart > 0 ? trimStart : undefined,
        trim_end: trimEnd !== null ? trimEnd : undefined,
        word_timestamps: wordTimestamps || undefined,
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

  const handleSaveTranscript = async (updatedSegments: Segment[]) => {
    if (!selectedTranscript) return;
    try {
      const updated = await updateTranscriptSegments(projectId, selectedTranscript.id, updatedSegments);
      setSelectedTranscript(updated);
      if (project) {
        const updatedTranscripts = project.transcripts.map((t) =>
          t.id === selectedTranscript.id ? updated : t
        );
        setProject({
          ...project,
          transcripts: updatedTranscripts,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to save transcript edits");
      throw err;
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
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="badge badge-success">✓ Uploaded</span>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                  Video uploaded successfully
                </span>
              </div>

              {!selectedTranscript && (
                <>
                  {/* Trim Controls */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "12px" }}>
                      ✂️ Trim Video <span style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "0.8rem" }}>(optional — only process part of the video)</span>
                    </p>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "120px" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Start (seconds)</span>
                        <input
                          type="number"
                          className="input"
                          min={0}
                          step={0.5}
                          value={trimStart}
                          onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                        />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "120px" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>End (seconds)</span>
                        <input
                          type="number"
                          className="input"
                          min={0}
                          step={0.5}
                          value={trimEnd ?? ""}
                          onChange={(e) => setTrimEnd(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="end of video"
                          style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                        />
                      </label>
                    </div>
                    {(trimStart > 0 || trimEnd !== null) && (
                      <p style={{ fontSize: "0.8rem", color: "var(--color-accent-light)", marginTop: "8px" }}>
                        Processing: {trimStart}s → {trimEnd !== null ? `${trimEnd}s` : "end"} ({trimEnd !== null ? `${(trimEnd - trimStart).toFixed(1)}s` : "remainder"})
                      </p>
                    )}
                  </div>

                  {/* Word Timestamps / Karaoke toggle */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "var(--color-text-secondary)",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={wordTimestamps}
                      onChange={(e) => setWordTimestamps(e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                    />
                    <span>
                      Enable <strong style={{ color: "var(--color-text-primary)" }}>Karaoke mode</strong>{" "}
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        (requests word-level timestamps from Whisper — slower)
                      </span>
                    </span>
                  </label>

                  <button
                    className="btn-primary"
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    style={{ alignSelf: "flex-start", padding: "10px 20px", fontSize: "0.9rem" }}
                  >
                    {isTranscribing ? "Starting..." : "🎤 Start Transcription"}
                  </button>
                </>
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

            {/* Interactive Editor */}
            {selectedTranscript && (
              <TranscriptEditor
                initialSegments={selectedTranscript.segments}
                onSave={handleSaveTranscript}
              />
            )}

            {/* Karaoke Player (shown when word-level data exists) */}
            {selectedTranscript && selectedTranscript.segments.some((s) => s.words && s.words.length > 0) && (
              <div style={{ marginTop: "24px" }}>
                <KaraokePlayer
                  segments={selectedTranscript.segments}
                  showDemoControls={true}
                />
              </div>
            )}

            {/* Karaoke hint when no word data */}
            {selectedTranscript && !selectedTranscript.segments.some((s) => s.words && s.words.length > 0) && selectedPreset?.animation_type === "karaoke" && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  background: "rgba(99,102,241,0.07)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                💡 You selected the <strong>Karaoke</strong> preset. To enable word-by-word highlighting, re-transcribe with <em>Karaoke mode</em> checked in the upload section.
              </div>
            )}
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
