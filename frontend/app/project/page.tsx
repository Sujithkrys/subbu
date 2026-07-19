"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Clapperboard, Captions, Languages, Paintbrush, Download,
  ChevronDown, ChevronLeft, Plus, Trash2, Play, Pause
} from "lucide-react";
import {
  getProject,
  startTranslation,
  saveStyle,
  startExport,
  updateTranscriptSegments,
} from "@/lib/api";
import type { ProjectDetailResponse, Transcript, StylePreset, Segment } from "@/lib/types";
import { STYLE_PRESETS } from "@/lib/types";

const LANGS: Record<string, string> = { te: "Telugu", hi: "Hindi", en: "English", ta: "Tamil", ml: "Malayalam", kn: "Kannada", bn: "Bengali", mr: "Marathi", gu: "Gujarati" };
const PRESETS = [
  { id: "minimal", name: "Minimal", css: { fontSize: 14, background: "rgba(0,0,0,0.6)", fontWeight: 400 } },
  { id: "bold", name: "Bold Pop", css: { fontSize: 18, background: "rgba(0,0,0,0.8)", fontWeight: 700 } },
  { id: "karaoke", name: "Karaoke", css: { fontSize: 16, background: "rgba(116,105,182,0.9)", fontWeight: 600 } },
  { id: "classic", name: "Classic", css: { fontSize: 15, background: "rgba(0,0,0,0.75)", fontWeight: 400, textShadow: "1px 1px 2px #000" } },
];

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [tool, setTool] = useState<"captions" | "languages" | "style">("captions");
  const [lang, setLang] = useState<string>("");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!projectId) {
      router.push("/dashboard");
      return;
    }
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const { createClient } = await import("@/lib/supabaseClient");
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const data = await getProject(projectId!);
      setProject(data);
      if (data.transcripts && data.transcripts.length > 0) {
        setLang(data.transcripts[0].language);
      }
    } catch (err) {
      console.error(err);
      fireToast("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fireToast = (msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(""), 2600); 
  };

  const currentTranscript = project?.transcripts?.find(t => t.language === lang);
  const captions = currentTranscript?.segments || [];
  const dur = project?.duration_seconds || 30; // fallback dur

  // Playback sync from real video
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const seek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setTime(newTime);
  };

  const currentCaption = captions.find(c => time >= c.start && time <= c.end);

  // Auto-save logic
  const saveSegments = async (newSegments: Segment[]) => {
    if (!currentTranscript || !projectId) return;
    try {
      await updateTranscriptSegments(projectId, currentTranscript.id, newSegments);
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const setCaptionText = (index: number, value: string) => {
    const newCaps = [...captions];
    newCaps[index] = { ...newCaps[index], text: value };
    
    setProject(prev => {
      if (!prev) return prev;
      const tIdx = prev.transcripts.findIndex(t => t.id === currentTranscript?.id);
      if (tIdx === -1) return prev;
      const newTranscripts = [...prev.transcripts];
      newTranscripts[tIdx] = { ...newTranscripts[tIdx], segments: newCaps };
      return { ...prev, transcripts: newTranscripts };
    });
    
    // In a real app we would debounce this properly.
    // For this prototype, we'll do an immediate save since user types slowly or debounce in wrapper.
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSegments(newCaps);
    }, 800);
  };
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addCaption = () => {
    const last = captions[captions.length - 1];
    const start = last ? Math.min(last.end + 0.1, dur - 3) : 0;
    const end = Math.min(start + 3, dur);
    const newCaps = [...captions, { start, end, text: "New caption" }];
    
    setProject(prev => {
      if (!prev) return prev;
      const tIdx = prev.transcripts.findIndex(t => t.id === currentTranscript?.id);
      const newTranscripts = [...prev.transcripts];
      newTranscripts[tIdx] = { ...newTranscripts[tIdx], segments: newCaps };
      return { ...prev, transcripts: newTranscripts };
    });
    setSelectedId(newCaps.length - 1);
    saveSegments(newCaps);
  };

  const removeCaption = (index: number) => {
    const newCaps = captions.filter((_, i) => i !== index);
    setProject(prev => {
      if (!prev) return prev;
      const tIdx = prev.transcripts.findIndex(t => t.id === currentTranscript?.id);
      const newTranscripts = [...prev.transcripts];
      newTranscripts[tIdx] = { ...newTranscripts[tIdx], segments: newCaps };
      return { ...prev, transcripts: newTranscripts };
    });
    saveSegments(newCaps);
  };

  const addLanguage = async (code: string) => {
    if (!projectId) return;
    const existing = project?.transcripts.map(t => t.language) || [];
    if (existing.includes(code)) return;
    
    fireToast(`${LANGS[code]} translation starting...`);
    try {
      await startTranslation(projectId, { target_language: code });
      fireToast(`${LANGS[code]} added — auto-translated, review before export`);
      loadProject(); // Reload to get new transcript
    } catch (err) {
      console.error(err);
      fireToast("Translation failed");
    }
  };

  const exportSrt = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = (sec: number) => `00:${pad(Math.floor(sec / 60))}:${pad(Math.floor(sec % 60))},000`;
    const srt = captions.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join("\n");
    const url = URL.createObjectURL(new Blob([srt], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${project?.title || "Project"}_${lang}.srt`; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    fireToast(`Exported ${LANGS[lang] || lang} captions (.srt)`);
  };

  const triggerBurnExport = async () => {
    setExportOpen(false);
    if (!projectId) return;
    try {
      await startExport(projectId, { format: "burned_mp4", burn_in: true, transcript_id: currentTranscript?.id });
      fireToast("Burned-in MP4 render started");
    } catch (err) {
      console.error(err);
      fireToast("Export failed to start");
    }
  };

  if (loading || !project) {
    return <div className="flex-1 flex items-center justify-center h-screen" style={{ background: "var(--color-bg-theme)" }}><p style={{color: "var(--color-text-secondary)"}}>Loading editor...</p></div>;
  }

  const allLangs = project.transcripts.map(t => t.language);
  const activePreset = PRESETS.find(p => p.name === project.style?.font) || PRESETS[0];

  const tools = [
    { id: "captions", label: "Captions", icon: Captions },
    { id: "languages", label: "Languages", icon: Languages },
    { id: "style", label: "Style", icon: Paintbrush },
  ] as const;

  const fmt = (sec: number) => `00:${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  return (
    <div className="flex h-screen flex-1 flex-col font-sans" style={{ background: "var(--color-bg-theme)", color: "var(--color-text-primary)" }}>
      {/* top bar */}
      <header className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--color-border-theme)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard")} className="rounded-lg p-1.5 hover:opacity-70 transition-opacity">
            <ChevronLeft size={17} />
          </button>
          <span className="text-sm font-medium">{project.title || "Untitled"}</span>
          <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ color: "var(--color-green-theme)", background: "rgba(76,175,125,0.15)" }}>
            Ready
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-transform hover:scale-105"
            style={{ background: "var(--color-pill)", color: "var(--color-pill-text)" }}
          >
            <Download size={13} /> Export <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 rounded-xl p-1.5 shadow-xl animate-fade-in" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}>
              <button onClick={exportSrt} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:opacity-70 transition-opacity">SRT file ({LANGS[lang] || lang})</button>
              <button onClick={() => { setExportOpen(false); fireToast("VTT export queued"); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:opacity-70 transition-opacity">VTT file</button>
              <button onClick={triggerBurnExport} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:opacity-70 transition-opacity">Burned-in MP4</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* tool rail */}
        <aside className="flex w-[84px] flex-col items-center gap-1 py-4" style={{ background: "var(--color-rail)", borderRight: "1px solid var(--color-border-theme)" }}>
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id} onClick={() => setTool(id)}
              className="flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors"
              style={tool === id ? { background: "var(--color-accent-soft)" } : {}}
            >
              <Icon size={17} style={{ color: tool === id ? "var(--color-accent)" : "var(--color-text-secondary)" }} />
              <span className="text-[10px]" style={{ color: tool === id ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>{label}</span>
            </button>
          ))}
        </aside>

        {/* tool panel */}
        <section className="flex w-72 flex-col overflow-y-auto px-4 py-4" style={{ background: "var(--color-panel)", borderRight: "1px solid var(--color-border-theme)" }}>
          {tool === "captions" && (
            <>
              <PanelTitle title="Captions" sub={`${LANGS[lang] || lang} · click a line to edit`} />
              <div className="mb-3 flex flex-wrap gap-1.5">
                {allLangs.map((l) => (
                  <button
                    key={l} onClick={() => setLang(l)}
                    className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                    style={lang === l ? { background: "var(--color-accent)", color: "#FFF" } : { background: "var(--color-input-bg)", color: "var(--color-text-secondary)" }}
                  >
                    {LANGS[l] || l}
                  </button>
                ))}
              </div>
              <div className="flex-1 space-y-2 pb-10">
                {captions.map((c, i) => (
                  <div
                    key={i} onClick={() => { setSelectedId(i); seek(c.start); }}
                    className="cursor-pointer rounded-xl p-2.5 transition-colors"
                    style={{
                      background: "var(--color-card)",
                      border: `1px solid ${currentCaption === c ? "var(--color-accent)" : selectedId === i ? "var(--color-text-muted)" : "var(--color-border-theme)"}`,
                      borderLeft: currentCaption === c ? `3px solid var(--color-accent)` : undefined,
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: currentCaption === c ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                        {fmt(c.start)} → {fmt(c.end)} {currentCaption === c && "· now playing"}
                      </span>
                      <Trash2 size={12} style={{ color: "var(--color-text-muted)" }} onClick={(e) => { e.stopPropagation(); removeCaption(i); }} />
                    </div>
                    {selectedId === i ? (
                      <input
                        autoFocus value={c.text}
                        onChange={(e) => setCaptionText(i, e.target.value)}
                        className="w-full rounded-md px-2 py-1 text-xs outline-none"
                        style={{ background: "var(--color-input-bg)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-theme)" }}
                      />
                    ) : (
                      <p className="text-xs leading-relaxed">{c.text || <em style={{ color: "var(--color-text-muted)" }}>Empty</em>}</p>
                    )}
                  </div>
                ))}
                {captions.length === 0 && (
                  <p className="pt-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>No captions yet.</p>
                )}
                <button onClick={addCaption} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-xs transition-colors hover:bg-black/5" style={{ borderColor: "var(--color-text-muted)", color: "var(--color-text-secondary)" }}>
                  <Plus size={13} /> Add caption
                </button>
              </div>
            </>
          )}

          {tool === "languages" && (
            <>
              <PanelTitle title="Languages" sub="One video, many audiences" />
              <div className="space-y-2">
                {project.transcripts.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}>
                    <div>
                      <p className="text-xs font-medium">{LANGS[t.language] || t.language}</p>
                      <p className="text-[10px]" style={{ color: t.source === "asr" ? "var(--color-green-theme)" : "var(--color-amber-theme)" }}>
                        {t.source === "asr" ? "Source · reviewed" : "Translated · review before export"}
                      </p>
                    </div>
                    <button onClick={() => { setLang(t.language); setTool("captions"); }} className="text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--color-accent)" }}>Edit</button>
                  </div>
                ))}
              </div>
              <p className="mb-2 mt-4 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Add a language</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(LANGS).filter(([c]) => !allLangs.includes(c)).map(([c, name]) => (
                  <button key={c} onClick={() => addLanguage(c)} className="rounded-md px-2.5 py-1.5 text-[11px] transition-colors hover:bg-black/5" style={{ background: "var(--color-input-bg)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-theme)" }}>
                    + {name}
                  </button>
                ))}
              </div>
            </>
          )}

          {tool === "style" && (
            <>
              <PanelTitle title="Style" sub="Applies live to the preview" />
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id} 
                    onClick={async () => {
                      try {
                        await saveStyle(projectId!, { font: p.name, color: "#FFF", position: "bottom", animation_type: "none" });
                        loadProject(); // refresh style
                      } catch (err) { console.error(err); }
                    }}
                    className="rounded-xl p-3 text-center transition-transform hover:scale-105"
                    style={{ background: "var(--color-card)", border: `2px solid ${activePreset?.id === p.id ? "var(--color-accent)" : "var(--color-border-theme)"}` }}
                  >
                    <span className="rounded px-1.5 py-0.5 text-[11px] text-white" style={p.css}>సరళ</span>
                    <p className="mt-2 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{p.name}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* preview column — always dark theme background for video readability */}
        <section className="flex min-w-0 flex-1 flex-col p-4" style={{ background: "var(--color-bg-dark-fixed, #0D0D0D)" }}>
          <div
            className="relative mx-auto flex aspect-video w-full max-w-3xl flex-1 items-center justify-center overflow-hidden rounded-lg"
            style={{ background: "linear-gradient(135deg, #8D80C7 0%, #7469B6 60%, #665BA6 100%)", maxHeight: "100%" }}
          >
            {project.video_download_url ? (
              <video 
                ref={videoRef}
                src={project.video_download_url} 
                className="absolute inset-0 w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                playsInline
              />
            ) : null}
            
            {!playing && (
              <button
                onClick={togglePlay}
                className="flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105 z-10"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              >
                <Play size={22} fill="white" color="white" />
              </button>
            )}
            
            {currentCaption && (
              <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6 pointer-events-none z-10">
                <span className="rounded-md px-3 py-1.5 text-white" style={{...activePreset.css, textAlign: "center"}}>
                  {currentCaption.text}
                </span>
              </div>
            )}
          </div>

          {/* timeline strip */}
          <div className="mx-auto mt-3 w-full max-w-3xl">
            <div className="mb-1 flex justify-between text-[10px]" style={{ color: "#8A8A8A" }}>
              <span>{fmt(time)}</span><span>{fmt(dur)}</span>
            </div>
            <div
              className="relative h-12 cursor-pointer overflow-hidden rounded-lg"
              style={{ background: "var(--color-track-fixed, #1A1A1A)" }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - r.left) / r.width) * dur);
              }}
            >
              {captions.map((c, i) => (
                <div
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(i); seek(c.start); }}
                  className="absolute top-2 flex h-8 items-center justify-center overflow-hidden rounded-md px-1 transition-colors hover:brightness-110"
                  style={{
                    left: `${(c.start / dur) * 100}%`, width: `${((c.end - c.start) / dur) * 100}%`,
                    background: currentCaption === c ? "var(--color-accent)" : "rgba(116,105,182,0.45)",
                  }}
                >
                  <span className="truncate text-[9px] text-white">{c.text || "…"}</span>
                </div>
              ))}
              <div className="pointer-events-none absolute bottom-0 top-0 w-px" style={{ left: `${(time / dur) * 100}%`, background: "#E5484D" }}>
                <div className="absolute -left-[5px] top-0 h-3 w-[11px] rounded-b-md" style={{ background: "#E5484D" }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* toast */}
      {toast && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2.5 text-xs text-white shadow-xl animate-slide-up" style={{ background: "#2A2A3D", border: "1px solid var(--color-accent)", zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function PanelTitle({ title, sub }: { title: string, sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      <div className="mb-1 mt-1 h-0.5 w-8 rounded-full" style={{ background: "var(--color-accent)" }} />
      <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{sub}</p>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center h-screen" style={{ background: "var(--color-bg-theme)" }}><p style={{color: "var(--color-text-secondary)"}}>Loading editor...</p></div>}>
      <EditorContent />
    </Suspense>
  );
}
