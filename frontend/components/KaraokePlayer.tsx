"use client";

import { useState, useEffect, useRef } from "react";
import type { Segment, WordTimestamp } from "@/lib/types";

interface KaraokePlayerProps {
  segments: Segment[];
  /** Current playback time in seconds (pass from a video player or manual slider) */
  currentTime?: number;
  /** Optional: show a built-in demo time slider when no external player is provided */
  showDemoControls?: boolean;
}

export default function KaraokePlayer({
  segments,
  currentTime: externalTime,
  showDemoControls = false,
}: KaraokePlayerProps) {
  const [demoTime, setDemoTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = segments.length > 0 ? segments[segments.length - 1].end : 60;

  // Use external time if provided, otherwise use demo time
  const currentTime = externalTime ?? demoTime;

  // Demo playback ticker
  useEffect(() => {
    if (!showDemoControls) return;
    if (playing) {
      intervalRef.current = setInterval(() => {
        setDemoTime((t) => {
          if (t >= totalDuration) {
            setPlaying(false);
            return 0;
          }
          return t + 0.1;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, showDemoControls, totalDuration]);

  // Find the active segment
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  // Highlight a word if it has word timestamps
  const renderSegmentText = (seg: Segment) => {
    if (!seg.words || seg.words.length === 0) {
      // No word timestamps — render plain text
      return <span style={{ color: "var(--color-text-primary)" }}>{seg.text}</span>;
    }

    return (
      <>
        {seg.words.map((w: WordTimestamp, i: number) => {
          const isActive = currentTime >= w.start && currentTime <= w.end;
          const isPast = currentTime > w.end;

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 2px",
                transition: "all 0.12s ease",
                color: isActive
                  ? "#10B981"
                  : isPast
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(255,255,255,0.85)",
                fontWeight: isActive ? 800 : 500,
                textShadow: isActive ? "0 0 12px rgba(16,185,129,0.7)" : "none",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                transformOrigin: "bottom center",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </>
    );
  };

  const hasWordData = segments.some((s) => s.words && s.words.length > 0);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.7)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        border: "1px solid rgba(16,185,129,0.2)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#10B981" }}>
          🎤 Karaoke Preview
        </p>
        {!hasWordData && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              background: "rgba(255,255,255,0.05)",
              padding: "3px 8px",
              borderRadius: "999px",
            }}
          >
            Enable word timestamps for word-by-word highlight
          </span>
        )}
      </div>

      {/* Subtitle display area */}
      <div
        style={{
          background: "#0a0a14",
          borderRadius: "var(--radius-md)",
          minHeight: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 32px",
          textAlign: "center",
          marginBottom: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient orb */}
        <div
          style={{
            position: "absolute",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <p
          style={{
            fontSize: "1.4rem",
            fontWeight: 600,
            lineHeight: 1.6,
            fontFamily: "Inter, 'Noto Sans Devanagari', 'Noto Sans Telugu', sans-serif",
            zIndex: 1,
            position: "relative",
          }}
        >
          {activeSegment ? renderSegmentText(activeSegment) : (
            <span style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
              {segments.length === 0 ? "No transcript available" : "…"}
            </span>
          )}
        </p>
      </div>

      {/* Demo Controls */}
      {showDemoControls && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
          <button
            onClick={() => setPlaying(!playing)}
            style={{
              background: playing ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              border: `1px solid ${playing ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
              borderRadius: "var(--radius-sm)",
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: playing ? "#ef4444" : "#10B981",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.1}
            value={demoTime}
            onChange={(e) => { setDemoTime(parseFloat(e.target.value)); setPlaying(false); }}
            style={{ flex: 1, accentColor: "#10B981" }}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", minWidth: "60px", textAlign: "right" }}>
            {demoTime.toFixed(1)}s / {totalDuration.toFixed(0)}s
          </span>
        </div>
      )}
    </div>
  );
}
