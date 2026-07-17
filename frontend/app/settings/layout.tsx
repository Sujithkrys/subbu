"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAnon, setIsAnon] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "Guest User");
      setIsAnon(data.user?.is_anonymous || false);
    });
  }, []);

  const tabs = [
    { label: "Account", href: "/settings" },
    { label: "Usage", href: "/settings/usage" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "6px" }}>Settings</h1>
          {userEmail && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
              Signed in as <strong style={{ color: "var(--color-text-primary)" }}>{userEmail}</strong>
            </p>
          )}
        </div>

        {/* Action Button */}
        <div>
          {isAnon ? (
            <button
              onClick={() => router.push("/signup")}
              style={{
                background: "rgba(124, 58, 237, 0.1)", // primary purple tint
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "var(--color-primary)",
                borderRadius: "var(--radius-md)",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124, 58, 237, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)";
              }}
            >
              Create Account
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                borderRadius: "var(--radius-md)",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "32px",
        }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: active ? 700 : 500,
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                borderBottom: active ? "2px solid var(--color-primary)" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
