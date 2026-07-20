"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Upload, Play, Check, AlertCircle, Loader2 } from "lucide-react";
import { uploadVoiceSample, startCloning, getCloneStatus, getClones } from "@/lib/api";

const CLONE_LANGS: Record<string, string> = {
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  bn: "Bengali",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  en: "English"
};

export default function CloningPanel({
  projectId,
  hasVoiceSample,
  onSampleUploaded,
  onPreviewChange,
  onClonesChange
}: {
  projectId: string;
  hasVoiceSample: boolean;
  onSampleUploaded: () => void;
  onPreviewChange: (lang: string | null) => void;
  onClonesChange: (clones: Record<string, any>) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [clones, setClones] = useState<Record<string, any>>({});
  
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  
  useEffect(() => {
    fetchClones();
  }, [projectId]);

  const fetchClones = async () => {
    try {
      const res = await getClones(projectId);
      const cloneMap: Record<string, any> = {};
      res.forEach((c: any) => { cloneMap[c.language] = c; });
      setClones(cloneMap);
      onClonesChange(cloneMap);
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRecordedBlob(e.target.files[0]);
    }
  };

  const uploadSample = async () => {
    if (!recordedBlob) return;
    setUploading(true);
    try {
      const file = new File([recordedBlob], "voice_sample.webm", { type: "audio/webm" });
      await uploadVoiceSample(projectId, file);
      onSampleUploaded();
    } catch (err) {
      console.error("Failed to upload voice sample", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCloneStart = async (lang: string) => {
    if (!consentGiven) return;
    
    
    const newClones = { ...clones, [lang]: { ...clones[lang], status: "cloning" } };
    setClones(newClones);
    onClonesChange(newClones);
    
    try {
      await startCloning(projectId, lang);
      pollStatus(lang);
    } catch (err) {
      console.error(err);
      const failedClones = { ...clones, [lang]: { ...clones[lang], status: "failed" } };
      setClones(failedClones);
      onClonesChange(failedClones);
    }
  };

  const pollStatus = async (lang: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await getCloneStatus(projectId, lang);
        setClones(prev => {
          const newClones = { ...prev, [lang]: res };
          onClonesChange(newClones);
          return newClones;
        });
        if (res.status === "ready" || res.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
  };

  if (!hasVoiceSample) {
    return (
      <div className="flex-1 space-y-4 px-1 pb-10 mt-4 animate-fade-in">
        <div className="rounded-xl p-4 text-center" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}>
          <Mic size={32} className="mx-auto mb-3" style={{ color: "var(--color-text-secondary)" }} />
          <p className="mb-2 text-sm font-medium">Record or upload a voice sample</p>
          <p className="mb-4 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            Please provide a clean 30-60 second voice sample to enable cloning.
          </p>
          
          {recordedBlob ? (
            <div className="space-y-3">
              <audio src={URL.createObjectURL(recordedBlob)} controls className="w-full h-8" />
              <div className="flex gap-2">
                <button onClick={() => setRecordedBlob(null)} className="flex-1 rounded-lg py-1.5 text-xs border" style={{ borderColor: "var(--color-border-theme)" }}>Retake</button>
                <button onClick={uploadSample} disabled={uploading} className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-opacity disabled:opacity-50" style={{ background: "var(--color-accent)", color: "white" }}>
                  {uploading ? "Uploading..." : "Save Sample"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={recording ? stopRecording : startRecording}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors"
                style={{ background: recording ? "rgba(239,68,68,0.15)" : "var(--color-accent)", color: recording ? "#ef4444" : "white" }}
              >
                {recording ? <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Stop Recording</span> : <><Mic size={14} /> Record Audio</>}
              </button>
              
              <div className="relative">
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <button className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs border transition-colors hover:bg-black/5" style={{ borderColor: "var(--color-border-theme)", color: "var(--color-text-primary)" }}>
                  <Upload size={14} /> Upload Audio File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 pb-10 mt-4 animate-fade-in">
      {Object.entries(CLONE_LANGS).map(([code, name]) => {
        const clone = clones[code] || { status: "not_started" };
        const isExpanded = expandedLang === code;
        
        return (
          <div key={code} className="rounded-xl overflow-hidden transition-all" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}>
            <div 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => {
                if (clone.status === "not_started" || clone.status === "failed") {
                  setExpandedLang(isExpanded ? null : code);
                  setConsentGiven(false);
                }
              }}
            >
              <div>
                <p className="text-xs font-medium">{name}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                  {clone.status === "not_started" && <span style={{ color: "var(--color-text-secondary)" }}>Not started</span>}
                  {clone.status === "cloning" && <span className="flex items-center gap-1" style={{ color: "var(--color-accent)" }}><Loader2 size={10} className="animate-spin" /> Cloning...</span>}
                  {clone.status === "ready" && <span className="flex items-center gap-1 text-green-500"><Check size={10} /> Ready</span>}
                  {clone.status === "failed" && <span className="flex items-center gap-1 text-red-500"><AlertCircle size={10} /> Failed</span>}
                </div>
              </div>
              
              {clone.status === "ready" && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onPreviewChange(code); }}
                  className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: "var(--color-accent)" }}
                >
                  <Play size={14} />
                </button>
              )}
            </div>
            
            {isExpanded && (clone.status === "not_started" || clone.status === "failed") && (
              <div className="px-3 pb-3 pt-1 border-t animate-fade-in" style={{ borderColor: "var(--color-border-theme)" }}>
                <label className="flex items-start gap-2 mb-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="peer appearance-none w-3.5 h-3.5 rounded-sm border checked:bg-current transition-colors"
                      style={{ borderColor: "var(--color-border-theme)", color: "var(--color-accent)" }}
                    />
                    <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                  </div>
                  <span className="text-[10px] leading-tight select-none" style={{ color: "var(--color-text-secondary)" }}>
                    I consent to cloning this voice for {name} dubbing. I own this voice or have permission to clone it.
                  </span>
                </label>
                
                <button 
                  onClick={() => handleCloneStart(code)}
                  disabled={!consentGiven}
                  className="w-full py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
                  style={{ background: "var(--color-accent)", color: "white" }}
                >
                  Start cloning
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
