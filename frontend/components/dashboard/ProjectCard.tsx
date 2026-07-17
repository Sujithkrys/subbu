"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  onFavorite: (id: string, isFav: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (project: Project) => void;
}

export default function ProjectCard({
  project,
  onFavorite,
  onDuplicate,
  onDelete,
  onDownload,
}: ProjectCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setMenuOpen(false);
    action();
  };

  return (
    <div
      className="card glass-hover animate-fade-in"
      style={{ cursor: "pointer", position: "relative" }}
      onClick={() => router.push(`/project/${project.id}`)}
      onMouseLeave={() => setMenuOpen(false)}
    >
      {/* Thumbnail placeholder */}
      <div
        style={{
          height: "140px",
          borderRadius: "var(--radius-sm)",
          background: "var(--gradient-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          marginBottom: "16px",
          position: "relative",
        }}
      >
        🎥
        {/* Favorite button */}
        <button
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: project.is_favorite ? "#F59E0B" : "#FFF",
            fontSize: "1.1rem",
            transition: "all 0.2s ease",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(project.id, !project.is_favorite);
          }}
          title={project.is_favorite ? "Unfavorite" : "Favorite"}
        >
          {project.is_favorite ? "★" : "☆"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1, paddingRight: "8px" }}>
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              marginBottom: "4px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={project.title || "Untitled Project"}
          >
            {project.title || "Untitled Project"}
          </h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginBottom: "8px" }}>
            {new Date(project.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {project.duration_seconds
              ? ` · ${Math.floor(project.duration_seconds / 60)}:${String(Math.floor(project.duration_seconds % 60)).padStart(2, "0")}`
              : ""}
          </p>
          <span className={`badge ${getStatusColor(project.status)}`}>{project.status}</span>
        </div>

        {/* 3-dot menu */}
        <div style={{ position: "relative" }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-secondary)",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              className="card"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px",
                zIndex: 10,
                minWidth: "140px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
              }}
            >
              {project.status === "ready" && (
                <button
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--color-text-primary)", cursor: "pointer", fontSize: "0.85rem" }}
                  onClick={(e) => handleAction(e, () => onDownload(project))}
                >
                  📥 Download
                </button>
              )}
              <button
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--color-text-primary)", cursor: "pointer", fontSize: "0.85rem" }}
                onClick={(e) => handleAction(e, () => router.push(`/project/${project.id}`))}
              >
                ✏️ Edit
              </button>
              <button
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--color-text-primary)", cursor: "pointer", fontSize: "0.85rem" }}
                onClick={(e) => handleAction(e, () => onDuplicate(project.id))}
              >
                📋 Duplicate
              </button>
              <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }}></div>
              <button
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem" }}
                onClick={(e) => handleAction(e, () => onDelete(project.id))}
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
