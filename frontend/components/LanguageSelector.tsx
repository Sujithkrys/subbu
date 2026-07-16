"use client";

import { SUPPORTED_LANGUAGES } from "@/lib/types";

interface LanguageSelectorProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  onTranslate: () => void;
  isTranslating?: boolean;
}

export default function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
  onTranslate,
  isTranslating = false,
}: LanguageSelectorProps) {
  return (
    <div className="animate-fade-in">
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "16px",
          color: "var(--color-text-secondary)",
        }}
      >
        Translation
      </h3>
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Source language */}
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
              marginBottom: "6px",
              fontWeight: 500,
            }}
          >
            From
          </label>
          <select
            className="input"
            value={sourceLanguage}
            onChange={(e) => onSourceChange(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            <option value="">Auto-detect</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Arrow */}
        <div
          style={{
            fontSize: "1.3rem",
            color: "var(--color-text-muted)",
            paddingBottom: "8px",
          }}
        >
          →
        </div>

        {/* Target language */}
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
              marginBottom: "6px",
              fontWeight: 500,
            }}
          >
            To
          </label>
          <select
            className="input"
            value={targetLanguage}
            onChange={(e) => onTargetChange(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            <option value="" disabled>
              Select language...
            </option>
            {SUPPORTED_LANGUAGES.filter((l) => l.code !== sourceLanguage).map(
              (lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* Translate button */}
        <button
          className="btn-primary"
          onClick={onTranslate}
          disabled={!targetLanguage || isTranslating}
          style={{
            padding: "12px 24px",
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
          }}
        >
          {isTranslating ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin-slow 0.8s linear infinite",
                }}
              />
              Translating...
            </span>
          ) : (
            "🌐 Translate"
          )}
        </button>
      </div>
    </div>
  );
}
