"use client";

import { useEffect, useState } from "react";
import { getUserUsage } from "@/lib/api";

interface UsageData {
  usage: {
    transcription_seconds_used: number;
    translation_characters_used: number;
    month: string;
  };
  limits: {
    transcription_seconds: number;
    translation_characters: number;
  };
}

function UsageBar({ used, total, label, unit }: { used: number; total: number; label: string; unit: string }) {
  const pct = Math.min((used / total) * 100, 100);
  const isWarning = pct >= 75;
  const isDanger = pct >= 90;

  const barColor = isDanger
    ? "#ef4444"
    : isWarning
    ? "#f97316"
    : "var(--color-primary)";

  return (
    <div style={{ marginBottom: "28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{label}</span>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
          {formatValue(used, unit)} / {formatValue(total, unit)}
          <span
            style={{
              marginLeft: "8px",
              fontWeight: 700,
              color: barColor,
            }}
          >
            ({pct.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div
        style={{
          height: "10px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: "999px",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 8px ${barColor}66`,
          }}
        />
      </div>
      {isDanger && (
        <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "6px" }}>
          ⚠ You are near your monthly limit. Usage resets on the 1st of each month.
        </p>
      )}
    </div>
  );
}

function formatValue(val: number, unit: string): string {
  if (unit === "minutes") {
    const m = Math.floor(val / 60);
    const s = Math.round(val % 60);
    return `${m}m ${s}s`;
  }
  if (unit === "chars") {
    return val >= 1000 ? `${(val / 1000).toFixed(1)}k chars` : `${val} chars`;
  }
  return `${val} ${unit}`;
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserUsage()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load usage"))
      .finally(() => setLoading(false));
  }, []);

  const monthLabel = data
    ? new Date(data.usage.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "6px" }}>
          Monthly Usage {monthLabel && <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>— {monthLabel}</span>}
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
          Usage resets on the 1st of every month. Free tier limits apply.
        </p>
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "48px",
            color: "var(--color-text-muted)",
          }}
        >
          Loading usage…
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "#ef4444",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="card glass" style={{ padding: "32px", borderRadius: "var(--radius-lg)" }}>
          <UsageBar
            label="Transcription (Speech-to-Text)"
            used={data.usage.transcription_seconds_used}
            total={data.limits.transcription_seconds}
            unit="minutes"
          />
          <UsageBar
            label="Translation (Characters)"
            used={data.usage.translation_characters_used}
            total={data.limits.translation_characters}
            unit="chars"
          />

          {/* Free plan info */}
          <div
            style={{
              marginTop: "8px",
              padding: "16px",
              background: "rgba(99, 102, 241, 0.07)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
              Free Plan Limits
            </p>
            <ul
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
                paddingLeft: "16px",
                lineHeight: 1.8,
              }}
            >
              <li>30 minutes of transcription per month</li>
              <li>50,000 characters of translation per month</li>
              <li>Unlimited exports (SRT, VTT, ASS, MP4 burn-in)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
