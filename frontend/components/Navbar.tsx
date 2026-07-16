"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  return (
    <nav className="glass" style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: "0 24px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid var(--color-border)",
    }}>
      {/* Logo */}
      <button
        onClick={() => router.push(user ? "/dashboard" : "/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "var(--gradient-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}>
          🎬
        </div>
        <span style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}>
          <span className="gradient-text">Sub</span>
          <span style={{ color: "var(--color-text-primary)" }}>Gen</span>
        </span>
      </button>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {user ? (
          <>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-secondary"
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                background: pathname === "/dashboard" ? "var(--color-bg-hover)" : undefined,
              }}
            >
              Dashboard
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--gradient-primary)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                {user.email?.[0]?.toUpperCase() || "U"}
              </button>
              {menuOpen && (
                <div
                  className="glass animate-fade-in"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    minWidth: "220px",
                    borderRadius: "var(--radius-md)",
                    padding: "8px",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div style={{
                    padding: "8px 12px",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.8rem",
                    borderBottom: "1px solid var(--color-border)",
                    marginBottom: "4px",
                  }}>
                    {user.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.9rem",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : !isAuthPage ? (
          <>
            <button
              onClick={() => router.push("/login")}
              className="btn-secondary"
              style={{ padding: "8px 20px", fontSize: "0.9rem" }}
            >
              Log In
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="btn-primary"
              style={{ padding: "8px 20px", fontSize: "0.9rem" }}
            >
              Sign Up
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
