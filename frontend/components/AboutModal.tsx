"use client";

import { useState } from "react";
import { Info, X, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AboutModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-xl transition-transform hover:scale-105"
        style={{ background: "#0a2540", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Info size={18} />
        About Subbu
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-0">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
              style={{ background: "var(--color-bg-theme)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-theme)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--color-border-theme)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white shadow-sm" style={{ background: "var(--color-accent)" }}>
                    సు
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Subbu</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6 scrollbar-hide">
                <p className="mb-4 text-[15px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>Subbu</strong> is a next-generation AI video localization platform. It automatically transcribes, translates, and elegantly styles captions for videos while offering seamless AI voice dubbing for true multilingual reach.
                </p>
                <p className="mb-6 text-[15px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  This is an early build. Here's exactly what's real right now.
                </p>

                <div className="mb-8 rounded-xl p-4 text-sm leading-relaxed" style={{ background: "var(--color-card)", border: "1px solid var(--color-border-theme)", color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>Note:</strong> For exploration purposes, this application is operating in a bypassed Guest Mode. You have full access to generate subtitles, translate, and clone voices using a shared demonstration account.
                </div>

                <div className="mb-8">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    WHAT'S WORKING
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {[
                      "Lightning-fast transcription using advanced ASR models",
                      "Instant translation into 10+ major Indian languages",
                      "Dynamic subtitle styling with customizable presets and animations",
                      "AI voice cloning and audio dubbing via Sarvam & ElevenLabs",
                      "Live video preview with perfectly synchronized captions",
                      "Serverless background video rendering with burned-in subtitles",
                      "Real-time dashboard tracking video projects and generation metrics"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span className="text-[15px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    STILL BUILDING
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {[
                      "Advanced interactive timeline editor for manual subtitle corrections",
                      "Custom brand kit management for one-click styling",
                      "Multi-user team accounts with role-based access control",
                      "Automated vocabulary dictionaries for industry-specific jargon"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 opacity-60">
                        <Clock size={18} className="mt-0.5 shrink-0" style={{ color: "var(--color-text-secondary)" }} />
                        <span className="text-[15px] leading-snug" style={{ color: "var(--color-text-secondary)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
