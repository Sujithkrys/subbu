"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Play, RefreshCw, AlertTriangle, Upload, Search } from "lucide-react";
import { listProjects, getDashboardMetrics, createProject } from "@/lib/api";
import { createClient } from "@/lib/supabaseClient";

const LANGS: Record<string, string> = { te: "Telugu", hi: "Hindi", en: "English", ta: "Tamil", ml: "Malayalam", kn: "Kannada", bn: "Bengali", mr: "Marathi", gu: "Gujarati" };

function DashboardContent() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [userName, setUserName] = useState("Creator");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        
        if (user?.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user?.email) {
          setUserName(user.email.split("@")[0]);
        }
        
        const [projectsRes, metricsRes] = await Promise.all([
          listProjects(),
          getDashboardMetrics()
        ]);
        
        setProjects(projectsRes.projects || []);
        setMetrics(metricsRes.metrics || {});
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);



  const shown = projects.filter((p) => (p.title || "Untitled").toLowerCase().includes(q.toLowerCase()));

  const statusMeta = (status: string) => {
    switch(status) {
      case "ready": return { label: "Ready", color: "var(--color-green-theme)", Icon: Play };
      case "failed": return { label: "Failed — retry", color: "var(--color-red-theme)", Icon: AlertTriangle };
      default: return { label: "Processing", color: "var(--color-amber-theme)", Icon: RefreshCw };
    }
  };

  const getUpdatedAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  const extractLangs = (project: any) => {
    if (!project.transcripts) return [];
    return Array.from(new Set(project.transcripts.map((t: any) => t.language)));
  };

  if (loading) {
    return <main className="flex-1 p-6 flex items-center justify-center"><p style={{color: "var(--color-text-secondary)"}}>Loading...</p></main>;
  }

  const totalVideos = metrics?.total_videos || 0;
  const totalMins = Math.round(metrics?.total_minutes || 0);
  const totalLangs = metrics?.distinct_languages || 0;
  const storageGB = ((metrics?.storage_bytes || 0) / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--color-bg-theme)" }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Good evening, {userName}</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{projects.length} projects · {totalLangs} languages</p>
        </div>
        <button 
          onClick={() => router.push("/project")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]" 
          style={{ background: "var(--color-pill)", color: "var(--color-pill-text)" }}
        >
          <Upload size={16} /> Upload video
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Videos", totalVideos], 
          ["Minutes captioned", totalMins], 
          ["Languages", totalLangs], 
          ["Storage", `${storageGB} GB`]
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl p-4 transition-transform hover:scale-[1.02]" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}>
            <p className="mb-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{l}</p>
            <p className="text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Your projects</h2>
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects"
            className="w-full rounded-xl py-2 pl-9 pr-3 text-sm outline-none"
            style={{ background: "var(--color-input-bg)", border: "1px solid var(--color-border-theme)", color: "var(--color-text-primary)" }}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>No projects found. Ready to caption your first video?</p>
          <button 
            onClick={() => router.push("/project")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium" 
            style={{ background: "var(--color-pill)", color: "var(--color-pill-text)" }}
          >
            <Upload size={16} /> Upload video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const m = statusMeta(p.status);
            const langs = extractLangs(p) as string[];
            return (
              <button
                key={p.id} onClick={() => router.push(`/project?id=${p.id}`)}
                className="rounded-2xl p-3 text-left transition-transform hover:scale-[1.01]"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)" }}
              >
                <div className="mb-3 flex h-28 items-center justify-center rounded-xl overflow-hidden relative" style={{ background: "var(--color-accent-soft)" }}>
                  <m.Icon size={24} style={{ color: m.color, zIndex: 2 }} />
                </div>
                <p className="mb-2 text-sm font-medium truncate">{p.title || "Untitled"}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ color: m.color, background: `${m.color}22` }}>{m.label}</span>
                  {langs.length > 0 && (
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
                      {langs.map((l) => LANGS[l] || l).join(" · ")}
                    </span>
                  )}
                  <span className="ml-auto text-[11px]" style={{ color: "var(--color-text-muted)" }}>{getUpdatedAgo(p.created_at)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}


    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center" style={{color: "var(--color-text-secondary)"}}>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
