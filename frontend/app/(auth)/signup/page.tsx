"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
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
        <div
          className="card glass animate-fade-in"
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(34,197,94,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 16px",
            }}
          >
            ✓
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
            Check your email
          </h2>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
              marginBottom: "24px",
            }}
          >
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account.
          </p>
          <button
            className="btn-secondary"
            onClick={() => router.push("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
      <div
        className="card glass animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "40px",
        }}
      >
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
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Create Account</h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              marginTop: "8px",
              fontSize: "0.9rem",
            }}
          >
            Start generating AI subtitles for free
          </p>
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="signup-email"
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
              id="signup-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="signup-password"
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
              id="signup-password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="signup-confirm"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              className="input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account..." : "Create Account"}
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
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary-light)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "inherit",
            }}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
