"use client";

import type { Project } from "@/lib/types";

interface ProjectTableProps {
  projects: Project[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onFavorite: (id: string, isFav: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (project: Project) => void;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onNavigate: (id: string) => void;
}

export default function ProjectTable({
  projects,
  selectedIds,
  onSelect,
  onSelectAll,
  onFavorite,
  onDuplicate,
  onDelete,
  onDownload,
  sortField,
  sortOrder,
  onSort,
  onNavigate,
}: ProjectTableProps) {
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

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getSourceLang = (p: Project) => {
    const asr = p.transcripts?.find((t) => t.source === "asr");
    return asr ? asr.language.toUpperCase() : "—";
  };

  const getTargetLangs = (p: Project) => {
    const translated = p.transcripts?.filter((t) => t.source === "translated") || [];
    if (translated.length === 0) return "—";
    return translated.map((t) => t.language.toUpperCase()).join(", ");
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
            <th style={{ padding: "12px 16px", width: "40px" }}>
              <input
                type="checkbox"
                checked={projects.length > 0 && selectedIds.length === projects.length}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th style={{ padding: "12px 16px", cursor: "pointer" }} onClick={() => onSort("title")}>
              Title {renderSortIcon("title")}
            </th>
            <th style={{ padding: "12px 16px", cursor: "pointer" }} onClick={() => onSort("status")}>
              Status {renderSortIcon("status")}
            </th>
            <th style={{ padding: "12px 16px" }}>Source Lang</th>
            <th style={{ padding: "12px 16px" }}>Target Langs</th>
            <th style={{ padding: "12px 16px", cursor: "pointer" }} onClick={() => onSort("duration_seconds")}>
              Duration {renderSortIcon("duration_seconds")}
            </th>
            <th style={{ padding: "12px 16px", cursor: "pointer" }} onClick={() => onSort("created_at")}>
              Date {renderSortIcon("created_at")}
            </th>
            <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              style={{
                borderBottom: "1px solid var(--color-border)",
                background: selectedIds.includes(project.id) ? "rgba(255,255,255,0.05)" : "transparent",
              }}
              className="table-row-hover"
            >
              <td style={{ padding: "12px 16px" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(project.id)}
                  onChange={(e) => onSelect(project.id, e.target.checked)}
                />
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    style={{ background: "none", border: "none", cursor: "pointer", color: project.is_favorite ? "#F59E0B" : "var(--color-text-muted)" }}
                    onClick={() => onFavorite(project.id, !project.is_favorite)}
                  >
                    {project.is_favorite ? "★" : "☆"}
                  </button>
                  <span
                    style={{ fontWeight: 600, cursor: "pointer", color: "var(--color-text-primary)" }}
                    onClick={() => onNavigate(project.id)}
                  >
                    {project.title || "Untitled Project"}
                  </span>
                </div>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <span className={`badge ${getStatusColor(project.status)}`}>{project.status}</span>
              </td>
              <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{getSourceLang(project)}</td>
              <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{getTargetLangs(project)}</td>
              <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>
                {project.duration_seconds
                  ? `${Math.floor(project.duration_seconds / 60)}:${String(Math.floor(project.duration_seconds % 60)).padStart(2, "0")}`
                  : "—"}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>
                {new Date(project.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                {project.status === "ready" && (
                  <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={() => onDownload(project)}>
                    Download
                  </button>
                )}
                <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={() => onNavigate(project.id)}>
                  Edit
                </button>
                <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={() => onDuplicate(project.id)}>
                  Clone
                </button>
                <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem", color: "#ef4444" }} onClick={() => onDelete(project.id)}>
                  Del
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
          No projects found matching the criteria.
        </div>
      )}
    </div>
  );
}
