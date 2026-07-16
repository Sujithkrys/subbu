"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { STYLE_PRESETS, type StylePreset } from "@/lib/types";

export default function StylePresetsPage() {
  const [defaultPreset, setDefaultPreset] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("subgen_default_preset");
    if (saved) {
      setDefaultPreset(saved);
    }
  }, []);

  const handleSetDefault = (presetName: string) => {
    localStorage.setItem("subgen_default_preset", presetName);
    setDefaultPreset(presetName);
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>🎨 Style Preset Gallery</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Select your preferred default style preset for new subtitle generation projects.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {STYLE_PRESETS.map((preset) => {
          const isDefault = defaultPreset === preset.name;
          return (
            <div
              key={preset.name}
              className="card glass"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                border: isDefault ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                boxShadow: isDefault ? "var(--shadow-glow)" : "var(--shadow-card)",
                transition: "all 0.3s ease",
              }}
            >
              {/* Sample subtitle render box */}
              <div
                style={{
                  height: "120px",
                  background: "#0c0c14",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  padding: "12px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.4,
                  }}
                />
                <span
                  style={{
                    zIndex: 2,
                    fontFamily: preset.font,
                    color: preset.color,
                    fontSize: preset.name === "Bold Pop" ? "1.4rem" : "1rem",
                    fontWeight: 700,
                    background: preset.name === "Classic" ? "rgba(0,0,0,0.8)" : preset.name === "Bold Pop" ? "rgba(0,0,0,0.9)" : "transparent",
                    padding: preset.name === "Classic" || preset.name === "Bold Pop" ? "6px 14px" : "0",
                    borderRadius: "4px",
                    textAlign: "center",
                    display: "inline-block",
                  }}
                >
                  {preset.name === "Karaoke" ? (
                    <span>
                      Highlight <span style={{ color: "#10B981" }}>words</span> in sync
                    </span>
                  ) : (
                    "Sample Subtitle Preview"
                  )}
                </span>
              </div>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "4px" }}>{preset.name}</h3>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  marginBottom: "24px",
                  flex: 1,
                }}
              >
                {preset.description}
              </p>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => handleSetDefault(preset.name)}
                  className={isDefault ? "btn-primary" : "btn-secondary"}
                  style={{ flex: 1, padding: "8px", fontSize: "0.85rem" }}
                  disabled={isDefault}
                >
                  {isDefault ? "✓ Active Default" : "Set as Default"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
