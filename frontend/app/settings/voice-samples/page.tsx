"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, Upload, Trash2, Loader2, Play, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

type VoiceSample = {
  id: string;
  storage_url: string;
  label: string;
  created_at: string;
};

export default function VoiceSamplesPage() {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<VoiceSample[]>("/voice-samples");
      setSamples(res || []);
    } catch (err: any) {
      setError("Failed to load voice samples");
    } finally {
      setLoading(false);
    }
  };

  const uploadSample = async (blob: Blob, label: string = "My voice") => {
    try {
      setUploading(true);
      setError("");
      
      const formData = new FormData();
      formData.append("file", blob, "sample.webm");
      formData.append("label", label);

      await apiFetch("/voice-samples", {
        method: "POST",
        body: formData
      });
      
      await loadSamples();
    } catch (err: any) {
      setError(err.message || "Failed to upload voice sample");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic check
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Max 10MB.");
        return;
      }
      await uploadSample(file, file.name.split('.')[0] || "Uploaded sample");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        uploadSample(blob, `Recorded voice ${new Date().toLocaleDateString()}`);
      };
      
      mediaRecorder.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  const deleteSample = async (id: string) => {
    try {
      await apiFetch(`/voice-samples/${id}`, { method: "DELETE" });
      setSamples(samples.filter(s => s.id !== id));
    } catch (err) {
      setError("Failed to delete sample");
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Voice Models</h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Record or upload reference voices to clone and dub your projects. You can reuse these models across all your videos.
        </p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload/Record Card */}
        <div className="rounded-xl p-5 border flex flex-col items-center justify-center text-center transition-colors" style={{ background: "var(--color-card)", borderColor: "var(--color-border-theme)" }}>
          <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ background: "var(--color-input-bg)" }}>
            <Mic size={24} style={{ color: "var(--color-text-secondary)" }} />
          </div>
          <h3 className="font-semibold mb-1">Add new voice model</h3>
          <p className="text-xs mb-5" style={{ color: "var(--color-text-secondary)" }}>Please provide a clean 30-60 second sample.</p>
          
          <div className="w-full space-y-2">
            <button 
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: recording ? "rgba(239,68,68,0.15)" : "var(--color-accent)", color: recording ? "#ef4444" : "white" }}
            >
              {uploading ? (
                <><Loader2 size={16} className="animate-spin" /> Uploading...</>
              ) : recording ? (
                <><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Stop Recording</>
              ) : (
                <><Mic size={16} /> Record Audio</>
              )}
            </button>
            
            <div className="relative">
              <input type="file" accept="audio/*" onChange={handleFileUpload} disabled={uploading || recording} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              <button disabled={uploading || recording} className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm border transition-colors hover:bg-black/5 disabled:opacity-50" style={{ borderColor: "var(--color-border-theme)", color: "var(--color-text-primary)" }}>
                <Upload size={16} /> Upload Audio File
              </button>
            </div>
          </div>
        </div>

        {/* Existing Samples */}
        {samples.map(s => (
          <div key={s.id} className="rounded-xl p-4 border flex flex-col justify-between" style={{ background: "var(--color-card)", borderColor: "var(--color-border-theme)" }}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-sm truncate pr-2">{s.label}</h3>
                <button onClick={() => deleteSample(s.id)} className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-red-500/70 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <audio src={s.storage_url} controls className="w-full h-8" />
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs" style={{ borderColor: "var(--color-border-theme)", color: "var(--color-text-secondary)" }}>
              <span>ID: {s.id.slice(0, 8)}...</span>
              <span>{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
