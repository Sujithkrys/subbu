"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { getUserSettings, updateUserSettings } from "@/lib/api";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    
    // Load current theme
    getUserSettings().then(res => {
      if (res?.theme) setTheme(res.theme as "dark" | "light");
    }).catch(err => {
      // fallback to DOM
      const current = document.documentElement.getAttribute("data-theme");
      if (current) setTheme(current as "dark" | "light");
    });
  }, []);

  const isAnonymous = user && !user.email;

  const handleThemeChange = async (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    setIsSavingTheme(true);
    try {
      await updateUserSettings(newTheme);
    } catch (err) {
      console.error("Failed to save theme", err);
    } finally {
      setIsSavingTheme(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", margin: "0 auto", padding: "40px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "16px" }}>Settings</h1>
      
      {/* Appearance Info Card */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border-theme)",
          padding: "24px",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>
          Appearance
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: "1rem" }}>Theme</div>
            <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Select your preferred interface theme.</div>
          </div>
          
          <div style={{ display: "flex", background: "var(--color-track)", padding: "4px", borderRadius: "8px", gap: "4px" }}>
            <button
              onClick={() => handleThemeChange("dark")}
              style={{
                background: theme === "dark" ? "var(--color-pill)" : "transparent",
                color: theme === "dark" ? "var(--color-pill-text)" : "var(--color-text-primary)",
                padding: "8px 24px",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Dark
            </button>
            <button
              onClick={() => handleThemeChange("light")}
              style={{
                background: theme === "light" ? "var(--color-pill)" : "transparent",
                color: theme === "light" ? "var(--color-pill-text)" : "var(--color-text-primary)",
                padding: "8px 24px",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Light
            </button>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border-theme)",
          padding: "24px",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px" }}>
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
          style={{
            background: "var(--color-card)",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid var(--color-accent)",
          }}
        >
          <h3 style={{ fontWeight: 600, marginBottom: "8px" }}>
            🔒 Save your work permanently
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
            You are currently using Subbu as a guest. Create a free account to save your projects and subtitles permanently.
          </p>
          <button style={{
            background: "var(--color-accent)",
            color: "#FFF",
            padding: "10px 24px",
            borderRadius: "8px",
            border: "none",
            fontWeight: 500,
            cursor: "pointer"
          }} onClick={() => router.push("/signup")}>
            Create Free Account
          </button>
        </div>
      )}
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
        padding: "12px 0",
        borderBottom: "1px solid var(--color-border-theme)",
      }}
    >
      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{value}</span>
    </div>
  );
}
