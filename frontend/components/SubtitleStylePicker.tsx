"use client";

import { STYLE_PRESETS, type StylePreset } from "@/lib/types";

interface SubtitleStylePickerProps {
  selectedPreset: StylePreset | null;
  onSelectPreset: (preset: StylePreset) => void;
  onCustomStyle?: (style: {
    font: string;
    color: string;
    position: string;
    animation_type: string | null;
  }) => void;
}

export default function SubtitleStylePicker({
  selectedPreset,
  onSelectPreset,
}: SubtitleStylePickerProps) {
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
        Subtitle Style
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {STYLE_PRESETS.map((preset) => {
          const isSelected = selectedPreset?.name === preset.name;
          return (
            <button
              key={preset.name}
              onClick={() => onSelectPreset(preset)}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${
                  isSelected ? "var(--color-primary)" : "var(--color-border)"
                }`,
                background: isSelected
                  ? "rgba(99,102,241,0.1)"
                  : "var(--color-bg-tertiary)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.3s ease",
              }}
            >
              {/* Preview strip */}
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "rgba(0,0,0,0.6)",
                  marginBottom: "12px",
                  fontFamily: preset.font,
                  color: preset.color,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Sample subtitle text
              </div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "2px", color: "var(--color-text-primary)" }}>
                {preset.name}
              </p>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                }}
              >
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
