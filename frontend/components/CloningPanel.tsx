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
  const [clones, setClones] = useState<Record<string, any>>({});
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Record<string, string>>({});
  
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

  const handleCloneStart = async (lang: string) => {
    if (!consentGiven) return;
    
    const newClones = { ...clones, [lang]: { ...clones[lang], status: "cloning" } };
    setClones(newClones);
    onClonesChange(newClones);
    
    try {
      const speaker = selectedSpeakers[lang] || "anushka";
      await startCloning(projectId, lang, speaker);
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

  return (
    <div className="flex-1 space-y-4 px-1 pb-10 mt-4 animate-fade-in">
      {/* Consent Checkbox */}
      <div className="rounded-xl border p-3.5 transition-colors" style={{ background: "var(--color-card)", borderColor: "var(--color-border-theme)" }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-500" 
          />
          <span className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            I consent to using the voice in this video to generate synthesized audio. I confirm I have the rights to use this voice.
          </span>
        </label>
      </div>

      {/* Languages List */}
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
                      I consent to generating audio for {name} dubbing using the selected speaker voice.
                    </span>
                  </label>
                  
                  <div className="mb-3">
                    <label className="block text-[10px] mb-1 font-medium" style={{ color: "var(--color-text-secondary)" }}>Speaker Voice (Gender Match)</label>
                    <select 
                      value={selectedSpeakers[code] || "anushka"}
                      onChange={(e) => setSelectedSpeakers({ ...selectedSpeakers, [code]: e.target.value })}
                      className="w-full text-xs rounded-lg p-2 bg-transparent border appearance-none outline-none focus:ring-1 focus:ring-purple-500"
                      style={{ borderColor: "var(--color-border-theme)", color: "var(--color-text-primary)" }}
                    >
                      <optgroup label="Male Voices">
                        <option value="abhilash">Abhilash (Male)</option>
                        <option value="aditya">Aditya (Male)</option>
                        <option value="hitesh">Hitesh (Male)</option>
                        <option value="rahul">Rahul (Male)</option>
                        <option value="rohan">Rohan (Male)</option>
                      </optgroup>
                      <optgroup label="Female Voices">
                        <option value="anushka">Anushka (Female)</option>
                        <option value="manisha">Manisha (Female)</option>
                        <option value="vidya">Vidya (Female)</option>
                        <option value="ritu">Ritu (Female)</option>
                        <option value="priya">Priya (Female)</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => handleCloneStart(code)}
                    disabled={!consentGiven}
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
