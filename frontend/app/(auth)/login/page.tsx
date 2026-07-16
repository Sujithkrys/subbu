"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
  };

  const handleSkip = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setError("Anonymous sign-in failed. Please register or enter password.");
      setLoading(false);
      return;
    }

    router.push(redirect);
  };

  return (
    <div
      className="card glass animate-fade-in"
      style={{
        width: "100%",
        maxWidth: "420px",
        padding: "40px",
        position: "relative",
      }}
    >
      <button
        onClick={handleSkip}
        disabled={loading}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          padding: "6px 12px",
          fontSize: "0.8rem",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.color = "var(--color-text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.color = "var(--color-text-secondary)";
        }}
      >
        Skip ➔
      </button>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            margin: "0 auto 16px",
          }}
        >
          🎬
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Welcome Back</h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginTop: "8px",
            fontSize: "0.9rem",
          }}
        >
          Sign in to your SubGen account
        </p>
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: "100%", padding: "12px", fontSize: "1rem" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          marginTop: "24px",
          color: "var(--color-text-secondary)",
          fontSize: "0.9rem",
        }}
      >
        Don&apos;t have an account?{" "}
        <button
          onClick={() => router.push("/signup")}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-primary-light)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "inherit",
          }}
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        padding: "24px",
      }}
    >
      <Suspense
        fallback={
          <div
            className="card glass"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--color-border)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin-slow 0.8s linear infinite",
                margin: "0 auto",
              }}
            />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
