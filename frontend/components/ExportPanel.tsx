"use client";

import type { ExportFormat } from "@/lib/types";

interface ExportPanelProps {
  onExport: (format: ExportFormat, burnIn: boolean) => void;
  isExporting?: boolean;
  downloads?: { format: string; url: string; created_at: string }[];
}

const EXPORT_OPTIONS: {
  format: ExportFormat;
  label: string;
  icon: string;
  description: string;
  burnIn: boolean;
}[] = [
  {
    format: "srt",
    label: "SRT",
    icon: "📄",
    description: "SubRip format — most compatible",
    burnIn: false,
  },
  {
    format: "vtt",
    label: "WebVTT",
    icon: "🌐",
    description: "Web-optimized subtitle format",
    burnIn: false,
  },
  {
    format: "ass",
    label: "ASS",
    icon: "🎨",
    description: "Styled subtitles with animations",
    burnIn: false,
  },
  {
    format: "burned_mp4",
    label: "Burned MP4",
    icon: "🎬",
    description: "Subtitles burned into the video",
    burnIn: true,
  },
];

export default function ExportPanel({
  onExport,
  isExporting = false,
  downloads = [],
}: ExportPanelProps) {
  return (
    <div className="animate-fade-in">
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "16px",
          color: "var(--color-text-secondary)",
        }}
      >
        Export Subtitles
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {EXPORT_OPTIONS.map((opt) => (
          <button
            key={opt.format}
            className="card glass-hover"
            onClick={() => onExport(opt.format, opt.burnIn)}
            disabled={isExporting}
            style={{
              cursor: isExporting ? "not-allowed" : "pointer",
              opacity: isExporting ? 0.6 : 1,
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
              {opt.icon}
            </div>
            <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px" }}>
              {opt.label}
            </p>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.8rem",
              }}
            >
              {opt.description}
            </p>
          </button>
        ))}
      </div>

      {/* Download links for completed exports */}
      {downloads.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h4
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "12px",
              color: "var(--color-text-secondary)",
            }}
          >
            Downloads Ready
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {downloads.map((dl, i) => (
              <a
                key={i}
                href={dl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card glass-hover"
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                  📥 {dl.format.toUpperCase()}
                </span>
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.8rem",
                  }}
                >
                  {new Date(dl.created_at).toLocaleString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
