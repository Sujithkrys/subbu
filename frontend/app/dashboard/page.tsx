"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listProjects, getDashboardMetrics, toggleFavorite, deleteProject, duplicateProject } from "@/lib/api";
import type { Project, DashboardMetricsResponse } from "@/lib/types";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import ProjectCard from "@/components/dashboard/ProjectCard";
import ProjectTable from "@/components/dashboard/ProjectTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // URL State via searchParams
  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const langFilter = searchParams.get("lang") || "all";
  const favoritesOnly = searchParams.get("fav") === "true";
  const viewMode = (searchParams.get("view") as "grid" | "table") || "grid";
  const sortField = searchParams.get("sort") || "created_at";
  const sortOrder = (searchParams.get("order") as "asc" | "desc") || "desc";

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`/dashboard?${params.toString()}`);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projData, metricData] = await Promise.all([
        listProjects(),
        getDashboardMetrics(),
      ]);
      setProjects(projData.projects);
      setMetrics(metricData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { createProject } = await import("@/lib/api");
      const project = await createProject({ title: newTitle });
      router.push(`/project/${project.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  // Actions
  const handleFavorite = async (id: string, isFav: boolean) => {
    // optimistic update
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, is_favorite: isFav } : p)));
    try {
      await toggleFavorite(id, isFav);
      const metricData = await getDashboardMetrics();
      setMetrics(metricData);
    } catch (err) {
      console.error(err);
      // revert
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, is_favorite: !isFav } : p)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteProject(id);
      const metricData = await getDashboardMetrics();
      setMetrics(metricData);
    } catch (err) {
      console.error(err);
      loadData(); // reload on error
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newProj = await duplicateProject(id);
      router.push(`/project/${newProj.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate project.");
    }
  };

  const handleDownload = async (project: Project) => {
    // Download the latest export, or fallback to VTT if we can generate it client-side
    // Currently, we just download the latest export url
    const latestExport = project.exports?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (latestExport && latestExport.url) {
      window.open(latestExport.url, "_blank");
    } else {
      alert("No exports available for this project yet. Please go to the project page to export.");
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} projects?`)) return;
    for (const id of selectedIds) {
      try {
        await deleteProject(id);
      } catch (err) {
        console.error("Failed to delete", id, err);
      }
    }
    setSelectedIds([]);
    loadData();
  };

  const handleBulkDownload = async () => {
    const zip = new JSZip();
    let added = 0;
    
    // We only process selected projects that have exports
    for (const id of selectedIds) {
      const p = projects.find(x => x.id === id);
      if (!p) continue;
      
      const latestExport = p.exports?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      if (latestExport && latestExport.url) {
        try {
          const res = await fetch(latestExport.url);
          const blob = await res.blob();
          const ext = latestExport.format === 'burned_mp4' ? 'mp4' : latestExport.format;
          zip.file(`${p.title || 'Untitled'}_${p.id.slice(0, 8)}.${ext}`, blob);
          added++;
        } catch (err) {
          console.error("Failed to fetch export for zip", p.title, err);
        }
      }
    }
    
    if (added === 0) {
      alert("None of the selected projects have downloadable exports.");
      return;
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "subbu_exports.zip");
  };

  // Filter & Sort Logic
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.title?.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (favoritesOnly) {
      result = result.filter((p) => p.is_favorite);
    }
    if (langFilter !== "all") {
      result = result.filter((p) => {
        // check if any transcript matches this language
        return p.transcripts?.some((t) => t.language === langFilter);
      });
    }

    result.sort((a, b) => {
      let aVal: any = a.created_at;
      let bVal: any = b.created_at;

      if (sortField === "title") {
        aVal = (a.title || "").toLowerCase();
        bVal = (b.title || "").toLowerCase();
      } else if (sortField === "duration_seconds") {
        aVal = a.duration_seconds || 0;
        bVal = b.duration_seconds || 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [projects, searchQuery, statusFilter, langFilter, favoritesOnly, sortField, sortOrder]);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Overview Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        <MetricCard label="Total Videos" value={metrics?.metrics.total_videos} loading={loading} />
        <MetricCard label="Minutes Processed" value={metrics?.metrics.total_minutes ? Math.round(metrics.metrics.total_minutes) : 0} loading={loading} />
        <MetricCard label="Languages Used" value={metrics?.metrics.distinct_languages} loading={loading} />
        <MetricCard
          label="Storage Used"
          value={metrics?.metrics.storage_bytes ? (metrics.metrics.storage_bytes / (1024 * 1024)).toFixed(1) + " MB" : "0 MB"}
          loading={loading}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>My Projects</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* View Toggle moved from filters */}
              <div style={{ display: "flex", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-sm)", padding: "4px" }}>
                <button
                  onClick={() => updateParam("view", "grid")}
                  style={{
                    padding: "6px 12px",
                    background: viewMode === "grid" ? "var(--color-border)" : "transparent",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: viewMode === "grid" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    fontWeight: viewMode === "grid" ? 600 : 400,
                  }}
                >
                  Grid
                </button>
                <button
                  onClick={() => updateParam("view", "table")}
                  style={{
                    padding: "6px 12px",
                    background: viewMode === "table" ? "var(--color-border)" : "transparent",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: viewMode === "table" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    fontWeight: viewMode === "table" ? 600 : 400,
                  }}
                >
                  Table
                </button>
              </div>
              <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>+</span> New Project
              </button>
            </div>
          </div>

          <DashboardFilters
            searchQuery={searchQuery}
            onSearchChange={(q) => updateParam("q", q)}
            statusFilter={statusFilter}
            onStatusChange={(s) => updateParam("status", s)}
            langFilter={langFilter}
            onLangChange={(l) => updateParam("lang", l)}
            favoritesOnly={favoritesOnly}
            onFavoritesToggle={() => updateParam("fav", favoritesOnly ? null : "true")}
            sortField={sortField}
            onSortChange={(f) => updateParam("sort", f)}
            sortOrder={sortOrder}
            onSortOrderChange={() => updateParam("order", sortOrder === "asc" ? "desc" : "asc")}
          />

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {[1, 2, 3].map((i) => <div key={i} className="card animate-shimmer" style={{ height: "180px" }} />)}
            </div>
          ) : filteredProjects.length === 0 && projects.length === 0 ? (
            <div className="card animate-fade-in" style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎬</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "8px" }}>No projects yet</h2>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
                Upload your first video to get started with AI subtitle generation.
              </p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>Upload Your First Video</button>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {filteredProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onFavorite={handleFavorite}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <ProjectTable
              projects={filteredProjects}
              selectedIds={selectedIds}
              onSelect={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
              onSelectAll={(checked) => setSelectedIds(checked ? filteredProjects.map(p => p.id) : [])}
              onFavorite={handleFavorite}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onDownload={handleDownload}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={(f) => {
                if (sortField === f) {
                  updateParam("order", sortOrder === "asc" ? "desc" : "asc");
                } else {
                  updateParam("sort", f);
                  updateParam("order", "asc");
                }
              }}
              onNavigate={(id) => router.push(`/project/${id}`)}
            />
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && viewMode === "table" && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-primary)",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            padding: "16px 24px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            zIndex: 50,
            animation: "slide-up 0.3s ease",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
            {selectedIds.length} selected
          </span>
          <div style={{ width: "1px", height: "24px", background: "var(--color-border)" }} />
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-secondary" onClick={handleBulkDownload}>
              📥 Download Zip
            </button>
            <button
              className="btn-secondary"
              style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
              onClick={handleBulkDelete}
            >
              🗑️ Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}
        >
          <div className="card glass animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "32px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Create New Project</h2>
            <input className="input" placeholder="Project title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={creating || !newTitle.trim()}>{creating ? "Creating..." : "Create & Upload"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, loading }: { label: string; value: any; loading: boolean }) {
  return (
    <div className="card glass" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
      {loading ? (
        <div className="animate-shimmer" style={{ height: "36px", width: "60%", borderRadius: "4px" }} />
      ) : (
        <span style={{ fontSize: "2rem", fontWeight: 700 }}>{value !== undefined && value !== null ? value : "—"}</span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
