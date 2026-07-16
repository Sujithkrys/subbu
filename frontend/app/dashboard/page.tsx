"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listProjects, createProject } from "@/lib/api";
import type { Project } from "@/lib/types";
import JobStatusBadge from "@/components/JobStatusBadge";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data.projects);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const project = await createProject({ title: newTitle });
      router.push(`/project/${project.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "badge-success";
      case "transcribing":
      case "translating":
        return "badge-processing";
      case "failed":
        return "badge-error";
      default:
        return "badge-info";
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div
        className="animate-fade-in"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>
            My Projects
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="btn-secondary"
            onClick={() => router.push("/settings")}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            ⚙️ Settings
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span style={{ fontSize: "1.2rem" }}>+</span>
            New Project
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card glass animate-fade-in"
            style={{ width: "100%", maxWidth: "440px", padding: "32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
              Create New Project
            </h2>
            <input
              className="input"
              placeholder="Project title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
              >
                {creating ? "Creating..." : "Create & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card animate-shimmer"
              style={{ height: "180px" }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div
          className="card animate-fade-in"
          style={{
            textAlign: "center",
            padding: "80px 40px",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "16px",
            }}
          >
            🎬
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "8px" }}>
            No projects yet
          </h2>
          <p
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "24px",
              fontSize: "0.95rem",
            }}
          >
            Create your first project to get started with AI subtitle generation.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Create Your First Project
          </button>
        </div>
      )}

      {/* Project Grid */}
      {!loading && projects.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {projects.map((project, i) => (
            <button
              key={project.id}
              className="card glass-hover animate-fade-in"
              style={{
                animationDelay: `${i * 0.05}s`,
                animationFillMode: "both",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
              onClick={() => router.push(`/project/${project.id}`)}
            >
              {/* Thumbnail placeholder */}
              <div
                style={{
                  height: "120px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--gradient-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  marginBottom: "16px",
                }}
              >
                🎥
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "4px" }}>
                    {project.title || "Untitled Project"}
                  </h3>
                  <p
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {new Date(project.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {project.duration_seconds
                      ? ` · ${Math.floor(project.duration_seconds / 60)}:${String(Math.floor(project.duration_seconds % 60)).padStart(2, "0")}`
                      : ""}
                  </p>
                </div>
                <span className={`badge ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
