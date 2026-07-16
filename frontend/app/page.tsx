"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Background gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "-100px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "100px",
          right: "-200px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Hero Section */}
      <section
        className="animate-fade-in"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "85vh",
          textAlign: "center",
          padding: "60px 24px",
          position: "relative",
        }}
      >
        {/* Badge */}
        <div
          className="badge badge-info"
          style={{
            marginBottom: "24px",
            fontSize: "0.8rem",
          }}
        >
          <span style={{ fontSize: "10px" }}>●</span>
          AI-Powered Subtitles for Indian Languages
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "800px",
            marginBottom: "24px",
          }}
        >
          Generate{" "}
          <span className="gradient-text">AI Subtitles</span>
          <br />
          in Seconds
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "1.2rem",
            color: "var(--color-text-secondary)",
            maxWidth: "600px",
            lineHeight: 1.6,
            marginBottom: "40px",
          }}
        >
          Upload your video, get instant transcription, translate into Telugu,
          Hindi, Tamil, and 10+ Indian languages. Style and export with one
          click.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="btn-primary"
            onClick={() => router.push("/signup")}
            style={{ padding: "14px 36px", fontSize: "1.05rem" }}
          >
            Get Started Free →
          </button>
          <button
            className="btn-secondary"
            onClick={() => router.push("/login")}
            style={{ padding: "14px 36px", fontSize: "1.05rem" }}
          >
            Log In
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          How It Works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: "📤",
              title: "Upload Video",
              desc: "Drag and drop your video file. We support MP4, MOV, AVI, and more.",
            },
            {
              icon: "🎤",
              title: "AI Transcription",
              desc: "Groq's Whisper Large v3 generates accurate transcripts in seconds.",
            },
            {
              icon: "🌐",
              title: "Translate",
              desc: "Powered by Gemini API — translate into Telugu, Hindi, Tamil, and more.",
            },
            {
              icon: "🎨",
              title: "Style Subtitles",
              desc: "Choose from premium presets or customize fonts, colors, and animations.",
            },
            {
              icon: "🖥️",
              title: "Live Preview",
              desc: "See your styled subtitles overlaid on the video in real time.",
            },
            {
              icon: "📥",
              title: "Export",
              desc: "Download as SRT, VTT, ASS, or get subtitles burned into your video.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="card glass-hover animate-fade-in"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationFillMode: "both",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "16px",
                  width: "52px",
                  height: "52px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--gradient-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Languages Section */}
      <section
        style={{
          padding: "60px 24px 100px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "32px",
          }}
        >
          Supported Languages
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          {[
            "English",
            "Hindi",
            "Telugu",
            "Tamil",
            "Kannada",
            "Malayalam",
            "Bengali",
            "Marathi",
            "Gujarati",
            "Punjabi",
            "Odia",
            "Urdu",
            "Assamese",
          ].map((lang) => (
            <span
              key={lang}
              className="badge badge-info"
              style={{ fontSize: "0.85rem", padding: "6px 16px" }}
            >
              {lang}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
