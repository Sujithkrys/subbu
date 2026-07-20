"use client";

import { useState, useEffect } from "react";
import { Play, Check, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { startCloning, getCloneStatus, getClones, apiFetch } from "@/lib/api";
import Link from "next/link";

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

type VoiceSample = { id: string; storage_url: string; label: string };

export default function CloningPanel({
  projectId,
  onPreviewChange,
  onClonesChange
}: {
  projectId: string;
  hasVoiceSample: boolean; // unused now but kept for backwards compat with parent if needed
  onSampleUploaded: () => void;
  onPreviewChange: (lang: string | null) => void;
  onClonesChange: (clones: Record<string, any>) => void;
}) {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  const [loadingSamples, setLoadingSamples] = useState(true);
  
  const [clones, setClones] = useState<Record<string, any>>({});
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  
  useEffect(() => {
    fetchClones();
    fetchSamples();
  }, [projectId]);

  const fetchSamples = async () => {
    try {
      setLoadingSamples(true);
      const res = await apiFetch<VoiceSample[]>("/voice-samples");
      setSamples(res || []);
      if (res && res.length > 0) {
        setSelectedSampleId(res[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSamples(false);
    }
  };

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

  const handleCloneStart = async (lang: string) => {
    if (!consentGiven || !selectedSampleId) return;
    
    const newClones = { ...clones, [lang]: { ...clones[lang], status: "cloning" } };
    setClones(newClones);
    onClonesChange(newClones);
    
    try {
      await startCloning(projectId, lang, selectedSampleId);
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

  if (loadingSamples) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  if (samples.length === 0) {
    return (
      <div className="flex-1 space-y-4 px-1 pb-10 mt-4 animate-fade-in">
        <div className="rounded-xl p-6 text-center" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}>
          <p className="mb-4 text-sm font-medium">No Voice Models Found</p>
          <p className="mb-6 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            You need to add a reference voice sample before you can clone and dub videos.
          </p>
          <Link href="/settings/voice-samples" className="inline-block rounded-lg px-4 py-2 text-xs font-medium transition-opacity" style={{ background: "var(--color-accent)", color: "white" }}>
            Manage Voice Samples
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 pb-10 mt-4 animate-fade-in">
      {/* Sample Selector */}
      <div className="px-1">
        <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>Select Voice Model</label>
        <select 
          value={selectedSampleId}
          onChange={(e) => setSelectedSampleId(e.target.value)}
          className="w-full text-sm rounded-lg p-2.5 outline-none border transition-colors focus:border-purple-500"
          style={{ background: "var(--color-input-bg)", color: "var(--color-text-primary)", borderColor: "var(--color-border-theme)" }}
        >
          {samples.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {Object.entries(CLONE_LANGS).map(([code, name]) => {
          const clone = clones[code] || { status: "not_started" };
          const isExpanded = expandedLang === code;
          
          return (
            <div key={code} className="rounded-xl overflow-hidden transition-all" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}>
              <div className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => {
                  if (clone.status === "not_started" || clone.status === "failed") {
                    setExpandedLang(isExpanded ? null : code);
                    setConsentGiven(false);
                  }
                }}
              >
                <p className="text-[13px] font-bold">{name}</p>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {clone.status === "not_started" && <span style={{ color: "var(--color-text-secondary)" }}>Not started</span>}
                    {clone.status === "cloning" && <span className="flex items-center gap-1" style={{ color: "var(--color-accent)" }}><Loader2 size={12} className="animate-spin" /> Cloning...</span>}
                    {clone.status === "ready" && (
                      <div className="flex items-center gap-1.5 text-green-500">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPreviewChange(code); }}
                          className="hover:opacity-70 transition-opacity"
                          style={{ color: "var(--color-accent)" }}
                        >
                          <Play size={13} fill="currentColor" />
                        </button>
                        <span>Ready</span>
                      </div>
                    )}
                    {clone.status === "failed" && <span className="flex items-center gap-1 text-red-500"><AlertCircle size={12} /> Failed</span>}
                  </div>
                  <ChevronDown 
                    size={14} 
                    style={{ color: "var(--color-text-secondary)" }}
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
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
                    disabled={!consentGiven || !selectedSampleId}
                    className="w-full rounded-lg py-2 text-xs font-medium transition-opacity disabled:opacity-50"
                    style={{ background: "var(--color-accent)", color: "white" }}
                  >
                    Start Cloning
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
