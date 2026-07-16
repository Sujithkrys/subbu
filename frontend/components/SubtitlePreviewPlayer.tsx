"use client";

import { useState, useRef, useEffect } from "react";
import type { Segment, SubtitleStyle } from "@/lib/types";

interface SubtitlePreviewPlayerProps {
  videoUrl: string | null;
  segments: Segment[];
  style?: Partial<SubtitleStyle> | null;
}

export default function SubtitlePreviewPlayer({
  videoUrl,
  segments,
  style,
}: SubtitlePreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  // Find the current subtitle segment
  const currentSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  const subtitleFont = style?.font || "Arial";
  const subtitleColor = style?.color || "#FFFFFF";
  const subtitlePosition = style?.position || "bottom";

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { top: "10%", bottom: "auto" },
    center: { top: "50%", transform: "translateX(-50%) translateY(-50%)" },
    bottom: { bottom: "12%", top: "auto" },
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="animate-fade-in">
      <div
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "#000",
          aspectRatio: "16/9",
        }}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.paused ? video.play() : video.pause();
              }
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-muted)",
              fontSize: "1rem",
            }}
          >
            No video loaded
          </div>
        )}

        {/* Subtitle overlay */}
        {currentSegment && (
          <div
            className="animate-fade-in"
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: "85%",
              textAlign: "center",
              pointerEvents: "none",
              ...positionStyles[subtitlePosition],
            }}
          >
            <span
              style={{
                fontFamily: subtitleFont,
                color: subtitleColor,
                fontSize: "clamp(0.9rem, 2.5vw, 1.4rem)",
                fontWeight: 700,
                padding: "6px 16px",
                borderRadius: "6px",
                background: "rgba(0,0,0,0.7)",
                display: "inline-block",
                lineHeight: 1.5,
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {currentSegment.text}
            </span>
          </div>
        )}

        {/* Play overlay */}
        {videoUrl && !isPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
              cursor: "pointer",
            }}
            onClick={() => videoRef.current?.play()}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              ▶
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {videoUrl && duration > 0 && (
        <div style={{ marginTop: "12px" }}>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            style={{
              width: "100%",
              accentColor: "var(--color-primary)",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
