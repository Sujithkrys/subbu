"use client";

import { useEffect, useState, useRef } from "react";
import { useSidebar } from "./SidebarContext";
import { X, Mic, Upload, Trash2, Loader2, User, Activity, Mic2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { getUserSettings, updateUserSettings, apiFetch, getUserUsage } from "@/lib/api";

type VoiceSample = { id: string; storage_url: string; label: string; created_at: string; };
interface UsageData { usage: { transcription_seconds_used: number; translation_characters_used: number; month: string; }; limits: { transcription_seconds: number; translation_characters: number; }; }

export default function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState<"account" | "voice" | "usage">("account");
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAnon, setIsAnon] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email || null);
        setIsAnon(data.user?.is_anonymous || false);
      });
    }
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-5xl h-[85vh] flex rounded-2xl shadow-2xl overflow-hidden border border-white/10" style={{ background: "var(--color-bg)" }}>
        
        {/* Modal Sidebar */}
        <div className="w-64 flex flex-col p-4 border-r border-white/10" style={{ background: "var(--color-rail)" }}>
          <div className="flex items-center gap-2 mb-8 px-2 mt-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: "var(--color-accent)" }}>S</div>
            <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Settings</span>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            <TabButton active={activeTab === "account"} onClick={() => setActiveTab("account")} icon={User} label="Account" />
            <TabButton active={activeTab === "voice"} onClick={() => setActiveTab("voice")} icon={Mic2} label="Voice Models" />
            <TabButton active={activeTab === "usage"} onClick={() => setActiveTab("usage")} icon={Activity} label="Usage & Limits" />
          </nav>

          <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
            {isAnon ? (
              <button 
                onClick={() => window.location.href = "/signup"}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
              >
                Create Account
              </button>
            ) : (
              <button 
                onClick={() => { supabase.auth.signOut(); window.location.href = "/login"; }}
                className="w-full py-2.5 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <LogOut size={16} /> Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col relative" style={{ background: "var(--color-bg)" }}>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <X size={20} />
          </button>
          
          <div className="flex-1 overflow-y-auto p-10">
            {activeTab === "account" && <AccountTab />}
            {activeTab === "voice" && <VoiceModelsTab />}
            {activeTab === "usage" && <UsageTab />}
          </div>
        </div>

      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "" : "hover:bg-white/5"}`}
      style={{
        background: active ? "var(--color-accent)" : "transparent",
        color: active ? "#FFF" : "var(--color-text-secondary)"
      }}
    >
      <Icon size={18} /> {label}
    </button>
  );
}

function AccountTab() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    getUserSettings().then(res => {
      if (res?.theme) setTheme(res.theme as "dark" | "light");
    }).catch(() => {
      const current = document.documentElement.getAttribute("data-theme");
      if (current) setTheme(current as "dark" | "light");
    });
  }, []);

  const handleThemeChange = async (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    setIsSaving(true);
    try { await updateUserSettings(newTheme); } catch (err) {} finally { setIsSaving(false); }
  };

  const isAnonymous = user && !user.email;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>Account Settings</h2>

      <div className="mb-8 p-6 rounded-xl border border-white/10" style={{ background: "var(--color-card)" }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Theme</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>Select your preferred interface theme.</p>
          </div>
          <div className="flex p-1 rounded-lg gap-1" style={{ background: "var(--color-track)" }}>
            <button onClick={() => handleThemeChange("dark")} className={`px-5 py-1.5 rounded-md text-sm font-medium transition-all ${theme === "dark" ? "shadow-sm" : ""}`} style={{ background: theme === "dark" ? "var(--color-pill)" : "transparent", color: theme === "dark" ? "var(--color-pill-text)" : "var(--color-text-primary)" }}>Dark</button>
            <button onClick={() => handleThemeChange("light")} className={`px-5 py-1.5 rounded-md text-sm font-medium transition-all ${theme === "light" ? "shadow-sm" : ""}`} style={{ background: theme === "light" ? "var(--color-pill)" : "transparent", color: theme === "light" ? "var(--color-pill-text)" : "var(--color-text-primary)" }}>Light</button>
          </div>
        </div>
      </div>

      <div className="mb-8 p-6 rounded-xl border border-white/10" style={{ background: "var(--color-card)" }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Account Information</h3>
        <div className="space-y-4">
          <Row label="Account Type" value={isAnonymous ? "Guest (Anonymous)" : "Registered User"} />
          <Row label="Email Address" value={user?.email || "—"} />
          <Row label="Account ID" value={user?.id || "—"} />
          <Row label="Member Since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
        </div>
      </div>

      {isAnonymous && (
        <div className="p-6 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
          <h3 className="text-base font-semibold mb-2 text-indigo-400">Save your work permanently</h3>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>You are currently using the platform as a guest. Create a free account to save your projects and settings permanently.</p>
          <button onClick={() => window.location.href = "/signup"} className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "var(--color-accent)" }}>Create Free Account</button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 last:pb-0">
      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

function VoiceModelsTab() {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => { loadSamples(); }, []);

  const loadSamples = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<VoiceSample[]>("/voice-samples");
      setSamples(res || []);
    } catch (err: any) { setError("Failed to load voice samples"); } finally { setLoading(false); }
  };

  const uploadSample = async (blob: Blob, label: string = "My voice") => {
    try {
      setUploading(true); setError("");
      const formData = new FormData();
      formData.append("file", blob, "sample.webm");
      formData.append("label", label);
      await apiFetch("/voice-samples", { method: "POST", body: formData });
      await loadSamples();
    } catch (err: any) { setError(err.message || "Failed to upload"); } finally { setUploading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { setError("File too large. Max 10MB."); return; }
      await uploadSample(file, file.name.split('.')[0] || "Uploaded sample");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        uploadSample(blob, `Recorded voice ${new Date().toLocaleDateString()}`);
      };
      mediaRecorder.current = recorder; recorder.start(); setRecording(true);
    } catch (err) { setError("Could not access microphone."); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) { mediaRecorder.current.stop(); setRecording(false); }
  };

  const deleteSample = async (id: string) => {
    try { await apiFetch(`/voice-samples/${id}`, { method: "DELETE" }); setSamples(samples.filter(s => s.id !== id)); } catch (err) { setError("Failed to delete sample"); }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Voice Models</h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>Record or upload reference voices to clone and dub your projects. Reuse models across videos.</p>

      {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium border border-red-500/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center transition-colors hover:bg-white/5" style={{ background: "var(--color-card)" }}>
          <div className="w-14 h-14 rounded-full mb-4 flex items-center justify-center bg-white/5">
            <Mic size={26} style={{ color: "var(--color-text-secondary)" }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Add new voice model</h3>
          <p className="text-xs mb-6" style={{ color: "var(--color-text-secondary)" }}>Provide a clean 30-60 second sample without background noise.</p>
          
          <div className="w-full space-y-3 mt-auto">
            <button onClick={recording ? stopRecording : startRecording} disabled={uploading} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50" style={{ background: recording ? "rgba(239,68,68,0.15)" : "var(--color-accent)", color: recording ? "#ef4444" : "white" }}>
              {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : recording ? <><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Stop Recording</> : <><Mic size={18} /> Record Audio</>}
            </button>
            <div className="relative">
              <input type="file" accept="audio/*" onChange={handleFileUpload} disabled={uploading || recording} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              <button disabled={uploading || recording} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border border-white/10 transition-colors hover:bg-white/5 disabled:opacity-50" style={{ color: "var(--color-text-primary)" }}>
                <Upload size={18} /> Upload Audio File
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 flex items-center justify-center h-[280px]" style={{ background: "var(--color-card)" }}>
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : samples.map(s => (
          <div key={s.id} className="rounded-2xl p-5 border border-white/10 flex flex-col justify-between" style={{ background: "var(--color-card)" }}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-semibold truncate pr-2" style={{ color: "var(--color-text-primary)" }}>{s.label}</h3>
                <button onClick={() => deleteSample(s.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
              <audio src={s.storage_url} controls className="w-full h-10 rounded-lg opacity-90" />
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <span>ID: {s.id.slice(0, 8)}...</span>
              <span>{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsageTab() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserUsage().then(setData).catch((err) => setError(err.message || "Failed to load usage")).finally(() => setLoading(false));
  }, []);

  const monthLabel = data ? new Date(data.usage.month).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Usage & Limits</h2>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
        Usage resets on the 1st of every month {monthLabel && `(${monthLabel})`}. Free tier limits apply.
      </p>

      {loading && <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-gray-500" size={32} /></div>}
      
      {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium">{error}</div>}

      {data && !loading && (
        <div className="p-7 rounded-2xl border border-white/10 space-y-8" style={{ background: "var(--color-card)" }}>
          <UsageBar label="Transcription (Speech-to-Text)" used={data.usage.transcription_seconds_used} total={data.limits.transcription_seconds} unit="minutes" />
          <UsageBar label="Translation (Characters)" used={data.usage.translation_characters_used} total={data.limits.translation_characters} unit="chars" />

          <div className="mt-8 p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
            <h3 className="text-sm font-semibold mb-3 text-indigo-400">Free Plan Limits</h3>
            <ul className="text-sm space-y-2 pl-4 list-disc" style={{ color: "var(--color-text-secondary)" }}>
              <li>30 minutes of transcription per month</li>
              <li>50,000 characters of translation per month</li>
              <li>Unlimited exports (SRT, VTT, ASS, MP4 burn-in)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageBar({ used, total, label, unit }: { used: number; total: number; label: string; unit: string }) {
  const pct = Math.min((used / total) * 100, 100);
  const isDanger = pct >= 90;
  const barColor = isDanger ? "#ef4444" : pct >= 75 ? "#f97316" : "var(--color-primary)";

  const formatValue = (val: number, unit: string) => {
    if (unit === "minutes") { const m = Math.floor(val / 60); const s = Math.round(val % 60); return `${m}m ${s}s`; }
    if (unit === "chars") return val >= 1000 ? `${(val / 1000).toFixed(1)}k chars` : `${val} chars`;
    return `${val} ${unit}`;
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</span>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
          {formatValue(used, unit)} / {formatValue(total, unit)}
          <span className="ml-2 font-bold" style={{ color: barColor }}>({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden bg-black/20 border border-white/5">
        <div className="h-full rounded-full transition-all duration-700 ease-out shadow-sm" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      {isDanger && <p className="text-xs text-red-500 mt-2 font-medium">⚠ You are near your monthly limit.</p>}
    </div>
  );
}
