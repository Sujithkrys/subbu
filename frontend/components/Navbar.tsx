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
            {pathname !== "/dashboard" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-secondary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  border: "none",
                  background: "transparent",
                }}
              >
                Dashboard
              </button>
            )}
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
                    marginBottom: "8px",
                  }}>
                    {user.email || "Guest User"}
                  </div>
                  
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/settings");
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      color: "var(--color-text-primary)",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <span>⚙️</span> Settings
                  </button>

                  <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />

                  <button
                    onClick={() => {
                      if (user.is_anonymous) {
                        setMenuOpen(false);
                        router.push("/signup");
                      } else {
                        handleSignOut();
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      color: user.is_anonymous ? "var(--color-primary)" : "#ef4444",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.9rem",
                      fontWeight: user.is_anonymous ? 600 : 400,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = user.is_anonymous 
                        ? "rgba(124, 58, 237, 0.1)" // assuming purple/primary color
                        : "rgba(239, 68, 68, 0.1)";
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {user.is_anonymous ? "Sign Up / Log In" : "Sign Out"}
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
