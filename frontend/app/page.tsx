"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// ── 1. LandingHero Component ────────────────────────────────────────────────
function LandingHero({ onGetStarted }: { onGetStarted: () => void }) {
  const [subTitleWordIndex, setSubTitleWordIndex] = useState(0);
  const words = [
    { text: "తెలుగు", color: "#FF7E67" },
    { text: "Hindi", color: "#6366f1" },
    { text: "தமிழ்", color: "#22d3ee" },
    { text: "ಕನ್ನಡ", color: "#10b981" },
    { text: "English", color: "#a855f7" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSubTitleWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        padding: "100px 24px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      {/* Visual background elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 75%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 75%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div className="badge badge-info" style={{ marginBottom: "24px", fontSize: "0.85rem", padding: "6px 16px" }}>
        🚀 Built for Content Creators in India
      </div>

      <h1
        style={{
          fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          maxWidth: "900px",
          marginBottom: "20px",
        }}
      >
        Auto-Generate Subtitles in{" "}
        <span
          style={{
            color: words[subTitleWordIndex].color,
            transition: "color 0.5s ease",
            display: "inline-block",
            minWidth: "180px",
          }}
        >
          {words[subTitleWordIndex].text}
        </span>
      </h1>

      <p
        style={{
          fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
          color: "var(--color-text-secondary)",
          maxWidth: "680px",
          lineHeight: 1.6,
          marginBottom: "40px",
        }}
      >
        Upload your video, automatically transcribe with Whisper, and translate into 10+ Indic scripts. Brand them with animations and export in one click.
      </p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: "60px" }}>
        <button
          className="btn-primary"
          onClick={onGetStarted}
          style={{ padding: "16px 36px", fontSize: "1.1rem", boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)" }}
        >
          Get Started Free →
        </button>
        <a
          href="#how-it-works"
          className="btn-secondary"
          style={{ padding: "16px 36px", fontSize: "1.1rem", display: "inline-flex", alignItems: "center" }}
        >
          See How it Works
        </a>
      </div>

      {/* Hero Video Mockup Frame */}
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: "760px",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          padding: "8px",
          boxShadow: "var(--shadow-glow)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "16/9",
            background: "#16162a",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: "10%",
          }}
        >
          {/* Mock Video Graphic */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop') center/cover no-repeat",
              opacity: 0.8,
            }}
          />

          {/* Subtitles Animating Overlay */}
          <div
            style={{
              zIndex: 2,
              background: "rgba(0,0,0,0.75)",
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#FF7E67",
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <span>సబ్‌జెన్‌తో నిమిషాల్లో ఉపశీర్షికలను సృష్టించండి ✨</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 2. HowItWorks Component ──────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: "01", icon: "📤", title: "Upload Video", desc: "Drag & drop your files securely." },
    { num: "02", icon: "🎤", title: "Transcribe", desc: "Whisper processes speech to text." },
    { num: "03", icon: "🌐", title: "Translate", desc: "Translate into 10+ Indian scripts." },
    { num: "04", icon: "📥", title: "Style & Export", desc: "Burn in or export SRT/VTT/ASS." }
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: "80px 24px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "12px" }}>How it Works</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>Create professional multi-lingual subtitles in 4 simple steps</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            className="card glass-hover"
            style={{
              padding: "32px 24px",
              position: "relative",
              textAlign: "center",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "16px",
                right: "20px",
                fontSize: "1.5rem",
                fontWeight: 800,
                opacity: 0.1,
                fontFamily: "monospace",
              }}
            >
              {step.num}
            </span>
            <div
              style={{
                fontSize: "2.2rem",
                marginBottom: "16px",
                height: "60px",
                width: "60px",
                background: "var(--gradient-card)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              {step.icon}
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>{step.title}</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 3. LanguageShowcase Component ────────────────────────────────────────────
function LanguageShowcase() {
  const translations: Record<string, { name: string; text: string }> = {
    english: { name: "English", text: "Welcome to SubGen. Translate video subtitles in your language." },
    telugu: { name: "Telugu (తెలుగు)", text: "సబ్‌జెన్‌కు స్వాగతం. మీ భాషలో వీడియో ఉపశీర్షికలను అనువదించండి." },
    hindi: { name: "Hindi (हिन्दी)", text: "सबजेन में आपका स्वागत है। अपनी भाषा में वीडियो उपशीर्षक का अनुवाद करें।" },
    tamil: { name: "Tamil (தமிழ்)", text: "சப்ஜெனுக்கு உங்களை வரவேற்கிறோம். உங்கள் மொழியில் வீடியோ வசனங்களை மொழிபெயர்க்கவும்." },
    kannada: { name: "Kannada (ಕನ್ನಡ)", text: "ಸಬ್‌ಜೆನ್‌ಗೆ ಸುಸ್ವಾಗತ. ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ವೀಡಿಯೊ ಉಪಶೀರ್ಷಿಕೆಗಳನ್ನು ಅನುವಾದಿಸಿ." },
    malayalam: { name: "Malayalam (മലയാളം)", text: "സബ്‌ജെനിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ സ്വന്തം ഭാഷയിൽ വീഡിയോ സബ്‌ടൈറ്റിലുകൾ വിവർത്തനം ചെയ്യുക." },
  };

  const [activeLang, setActiveLang] = useState("telugu");

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "12px" }}>Indic Script Showcase</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>Native Indic font stacks guarantee rendering accuracy with no broken characters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Toggles */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            {Object.keys(translations).map((key) => (
              <button
                key={key}
                onClick={() => setActiveLang(key)}
                className={activeLang === key ? "btn-primary" : "btn-secondary"}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.9rem",
                  borderRadius: "30px",
                }}
              >
                {translations[key].name}
              </button>
            ))}
          </div>

          {/* Preview Box */}
          <div
            className="card glass"
            style={{
              padding: "40px 24px",
              textAlign: "center",
              minHeight: "180px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border-hover)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <p
              style={{
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                lineHeight: 1.6,
                wordBreak: "break-word",
              }}
            >
              {translations[activeLang].text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 4. StyleShowcase Component ───────────────────────────────────────────────
function StyleShowcase() {
  const [stylePreset, setStylePreset] = useState("karaoke");

  const presets = [
    {
      id: "minimal",
      name: "Minimal",
      font: "Inter",
      color: "#CBD5E1",
      bg: "transparent",
      style: { fontSize: "0.95rem", opacity: 0.8 },
    },
    {
      id: "bold",
      name: "Bold Pop",
      font: "Impact, Inter",
      color: "#FF7E67",
      bg: "rgba(0, 0, 0, 0.9)",
      style: { fontSize: "1.4rem", fontWeight: "900" },
    },
    {
      id: "classic",
      name: "Classic Outline",
      font: "Arial",
      color: "#FFFFFF",
      bg: "rgba(0,0,0,0.75)",
      style: { fontSize: "1.1rem", border: "1px solid #000" },
    },
    {
      id: "karaoke",
      name: "Karaoke Spotlight",
      font: "Inter",
      color: "#FFFFFF",
      bg: "rgba(0,0,0,0.8)",
      style: { fontSize: "1.15rem", fontWeight: "700" },
    },
  ];

  return (
    <section style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "12px" }}>Dynamic Subtitle Styles</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>Choose from pre-packaged custom subtitle presets</p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setStylePreset(p.id)}
            className={stylePreset === p.id ? "btn-primary" : "btn-secondary"}
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Styled Mockup */}
      <div
        style={{
          background: "#16162a",
          aspectRatio: "21/9",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          paddingBottom: "6%",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop') center/cover",
            opacity: 0.6,
          }}
        />

        {/* Subtitle preview elements based on style */}
        <div
          style={{
            zIndex: 10,
            padding: stylePreset === "minimal" ? "4px" : "8px 20px",
            borderRadius: "6px",
            background: presets.find((p) => p.id === stylePreset)?.bg,
            fontFamily: presets.find((p) => p.id === stylePreset)?.font,
            color: presets.find((p) => p.id === stylePreset)?.color,
            boxShadow: stylePreset === "minimal" ? "none" : "0 4px 12px rgba(0,0,0,0.3)",
            textAlign: "center",
            display: "inline-block",
            lineHeight: 1.4,
            ...presets.find((p) => p.id === stylePreset)?.style,
          }}
        >
          {stylePreset === "karaoke" ? (
            <span>
              Create <span style={{ color: "#10B981" }}>highly</span> engageable subtitles...
            </span>
          ) : stylePreset === "bold" ? (
            <span>POP STYLE SUBTITLES!</span>
          ) : stylePreset === "minimal" ? (
            <span>Simple gray text subtitles</span>
          ) : (
            <span>Classic layout text overlay</span>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 5. DemoPreview Component ─────────────────────────────────────────────────
function DemoPreview() {
  const [showSubtitles, setShowSubtitles] = useState(true);

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "16px" }}>Experience the Transformation</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "40px" }}>Toggle to see the before and after comparison of subtitle rendering</p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <button
            className={showSubtitles ? "btn-primary" : "btn-secondary"}
            onClick={() => setShowSubtitles(!showSubtitles)}
            style={{ padding: "10px 24px", fontSize: "0.9rem" }}
          >
            {showSubtitles ? "Show Raw Video" : "Show Subtitled Video"}
          </button>
        </div>

        <div
          style={{
            position: "relative",
            aspectRatio: "16/9",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            background: "#000",
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            src="https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-video-with-her-smartphone-41484-large.mp4"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {showSubtitles && (
            <div
              style={{
                position: "absolute",
                bottom: "12%",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0, 0, 0, 0.75)",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "clamp(0.85rem, 2vw, 1.15rem)",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                textAlign: "center",
                maxWidth: "85%",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              సబ్‌జెన్‌తో వీడియోలను నిమిషాల్లో ప్రొఫెషనల్‌గా అనువదించండి 🚀
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 6. PricingSection Component ──────────────────────────────────────────────
export function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section id="pricing" style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "12px" }}>Simple, Transparent Pricing</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>Get full access during our public beta program</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="card glass"
          style={{
            maxWidth: "400px",
            width: "100%",
            padding: "48px 32px",
            borderRadius: "var(--radius-lg)",
            border: "2px solid var(--color-primary)",
            boxShadow: "var(--shadow-glow)",
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "var(--gradient-primary)",
              color: "white",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            PUBLIC BETA
          </div>

          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "16px" }}>Free Tier</h3>
          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "3rem", fontWeight: 800 }}>$0</span>
            <span style={{ color: "var(--color-text-secondary)" }}> / month</span>
          </div>

          <ul
            style={{
              textAlign: "left",
              color: "var(--color-text-secondary)",
              fontSize: "0.92rem",
              listStyle: "none",
              padding: 0,
              marginBottom: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <li>✨ 30 minutes of video ASR transcription per month</li>
            <li>🌐 50,000 translation characters per month</li>
            <li>🎨 Access to all styling presets (Classic, Pop, Karaoke)</li>
            <li>⚡ Ultra-fast transcription powered by Groq Whisper</li>
            <li>📥 Export in SRT, WebVTT, ASS, and burned MP4 formats</li>
          </ul>

          <button
            className="btn-primary"
            onClick={onGetStarted}
            style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
          >
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
}

// ── 7. FAQSection Component ──────────────────────────────────────────────────
function FAQSection() {
  const faqs = [
    {
      q: "Which Indian languages are supported?",
      a: "We currently support Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Urdu, and Assamese.",
    },
    {
      q: "How accurate is the transcription?",
      a: "We use Groq's Whisper Large v3 model which delivers state-of-the-art accuracy for Indian languages and handles accents beautifully.",
    },
    {
      q: "Can I edit the transcripts manually?",
      a: "Yes! We provide an interactive inline Transcript Editor to fix typos or adjust timings manually.",
    },
    {
      q: "What subtitle export formats do you support?",
      a: "You can download subtitles as raw text files in SRT, WebVTT, or ASS formats, or choose to burn the styled subtitles directly into the video.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "40px" }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="card"
                style={{ padding: "20px", cursor: "pointer", transition: "all 0.2s ease" }}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600 }}>{faq.q}</h3>
                  <span style={{ fontSize: "1.2rem", color: "var(--color-primary-light)" }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </div>
                {isOpen && (
                  <p
                    style={{
                      marginTop: "12px",
                      color: "var(--color-text-secondary)",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── 8. Footer Component ──────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer
      style={{
        padding: "48px 24px",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-secondary)",
        fontSize: "0.85rem",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        <div>
          <h4 style={{ color: "var(--color-text-primary)", fontWeight: 700, marginBottom: "12px", fontSize: "1rem" }}>
            SubGen
          </h4>
          <p style={{ maxWidth: "250px", lineHeight: 1.5 }}>
            Automated Indian language subtitling powered by high-performance artificial intelligence.
          </p>
        </div>
        <div style={{ display: "flex", gap: "48px" }}>
          <div>
            <h5 style={{ color: "var(--color-text-primary)", fontWeight: 600, marginBottom: "12px" }}>Product</h5>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><a href="#how-it-works" style={{ transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "white"} onMouseLeave={(e) => e.currentTarget.style.color = ""}>Features</a></li>
              <li><a href="#pricing" style={{ transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "white"} onMouseLeave={(e) => e.currentTarget.style.color = ""}>Pricing</a></li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: "var(--color-text-primary)", fontWeight: 600, marginBottom: "12px" }}>Legal</h5>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><a href="#" style={{ transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "white"} onMouseLeave={(e) => e.currentTarget.style.color = ""}>Privacy Policy</a></li>
              <li><a href="#" style={{ transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "white"} onMouseLeave={(e) => e.currentTarget.style.color = ""}>Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "40px", borderTop: "1px solid var(--color-border)", paddingTop: "24px" }}>
        © {new Date().getFullYear()} SubGen. All rights reserved.
      </div>
    </footer>
  );
}

// ── Main Page Layout ─────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }}>
      <LandingHero onGetStarted={handleGetStarted} />
      <HowItWorks />
      <LanguageShowcase />
      <StyleShowcase />
      <DemoPreview />
      <PricingSection onGetStarted={handleGetStarted} />
      <FAQSection />
      <Footer />
    </div>
  );
}
