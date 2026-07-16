"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const isAnonymous = user && !user.email;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Account Info Card */}
      <div
        className="card glass"
        style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px" }}>
          Account Information
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Row label="Account Type" value={isAnonymous ? "Guest (Anonymous)" : "Registered"} />
          <Row label="Email" value={user?.email || "—"} />
          <Row label="User ID" value={user?.id?.slice(0, 16) + "..."} />
          <Row
            label="Member Since"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          />
        </div>
      </div>

      {/* Guest upgrade prompt */}
      {isAnonymous && (
        <div
          className="card"
          style={{
            padding: "24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-primary)",
            background: "rgba(99, 102, 241, 0.05)",
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>
            🔒 Save your work permanently
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
            You are currently using Subbu as a guest. Create a free account to save your projects and subtitles permanently.
          </p>
          <button className="btn-primary" onClick={() => router.push("/signup")}>
            Create Free Account
          </button>
        </div>
      )}

      {/* Style Presets shortcut */}
      <div
        className="card glass"
        style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
          Subtitle Style Presets
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
          Customise the look and feel of your subtitles across all projects.
        </p>
        <button className="btn-secondary" onClick={() => router.push("/styles")}>
          Open Style Gallery →
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{value}</span>
    </div>
  );
}
