"use client";

import type { ActivityLogEntry } from "@/lib/types";

export default function ActivityFeed({ activities }: { activities: ActivityLogEntry[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="card glass" style={{ padding: "24px", height: "100%" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Recent Activity</h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>No recent activity.</p>
      </div>
    );
  }

  const formatAction = (activity: ActivityLogEntry) => {
    switch (activity.action) {
      case "project_created":
        return "Created project";
      case "transcription_completed":
        return `Transcribed video${activity.details?.language ? ` in ${activity.details.language}` : ""}`;
      case "translation_completed":
        return `Translated to ${activity.details?.language || "a new language"}`;
      case "project_deleted":
        return `Deleted project "${activity.details?.title || "Untitled"}"`;
      case "project_duplicated":
        return "Duplicated project";
      case "project_favorited":
        return "Favorited project";
      case "project_unfavorited":
        return "Unfavorited project";
      default:
        return activity.action;
    }
  };

  const getIcon = (action: string) => {
    if (action.includes("created") || action.includes("duplicated")) return "✨";
    if (action.includes("transcri")) return "🎙️";
    if (action.includes("translat")) return "🌐";
    if (action.includes("delet")) return "🗑️";
    if (action.includes("favorit")) return "★";
    return "📝";
  };

  return (
    <div className="card glass" style={{ padding: "24px", height: "100%" }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>Recent Activity</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {activities.map((act) => (
          <div key={act.id} style={{ display: "flex", gap: "12px", alignItems: "start" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              {getIcon(act.action)}
            </div>
            <div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", lineHeight: 1.4 }}>
                {formatAction(act)}
                {act.projects?.title && !act.action.includes("deleted") && (
                  <span style={{ fontWeight: 600 }}> · {act.projects.title}</span>
                )}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {new Date(act.created_at).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
