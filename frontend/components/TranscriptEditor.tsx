"use client";

import { useState, useEffect } from "react";
import type { Segment } from "@/lib/types";

interface TranscriptEditorProps {
  initialSegments: Segment[];
  onSave: (segments: Segment[]) => Promise<void>;
}

export default function TranscriptEditor({
  initialSegments,
  onSave,
}: TranscriptEditorProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when initialSegments updates
  useEffect(() => {
    setSegments(JSON.parse(JSON.stringify(initialSegments)));
  }, [initialSegments]);

  const handleTextChange = (index: number, text: string) => {
    const updated = [...segments];
    updated[index].text = text;
    setSegments(updated);
  };

  const handleTimeChange = (index: number, field: "start" | "end", val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const updated = [...segments];
    updated[index][field] = num;
    setSegments(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      // Sort segments chronologically before saving just in case
      const sorted = [...segments].sort((a, b) => a.start - b.start);
      await onSave(sorted);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const filteredSegments = segments.map((seg, originalIdx) => ({
    seg,
    originalIdx,
  })).filter(({ seg }) =>
    seg.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card glass animate-fade-in" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>✏️ Manual Subtitle Editor</h3>
        <div style={{ display: "flex", gap: "12px", flex: 1, justifySelf: "end", maxWidth: "450px" }}>
          <input
            type="text"
            className="input"
            placeholder="Search segments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px", fontSize: "0.85rem" }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ padding: "8px 20px", fontSize: "0.85rem", flexShrink: 0 }}
          >
            {saving ? "Saving..." : success ? "✓ Saved" : "Save Edits"}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "12px" }}>{error}</p>
      )}

      {/* Editor list */}
      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingRight: "6px",
        }}
      >
        {filteredSegments.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }}>
            No matching segments found
          </p>
        ) : (
          filteredSegments.map(({ seg, originalIdx }) => (
            <div
              key={originalIdx}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.02)",
                padding: "10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Timing input controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "95px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", width: "30px" }}>Start</span>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={seg.start}
                    onChange={(e) => handleTimeChange(originalIdx, "start", e.target.value)}
                    style={{ padding: "3px 6px", fontSize: "0.75rem", textAlign: "center" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", width: "30px" }}>End</span>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={seg.end}
                    onChange={(e) => handleTimeChange(originalIdx, "end", e.target.value)}
                    style={{ padding: "3px 6px", fontSize: "0.75rem", textAlign: "center" }}
                  />
                </div>
              </div>

              {/* Text editing textarea */}
              <textarea
                className="input"
                value={seg.text}
                onChange={(e) => handleTextChange(originalIdx, e.target.value)}
                rows={2}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "0.88rem",
                  resize: "vertical",
                  lineHeight: 1.4,
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
