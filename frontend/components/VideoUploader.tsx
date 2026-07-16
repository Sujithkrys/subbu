"use client";

import { useState, useCallback } from "react";

interface VideoUploaderProps {
  uploadUrl: string | null;
  onUploadComplete: () => void;
  onUploadError: (error: string) => void;
}

export default function VideoUploader({
  uploadUrl,
  onUploadComplete,
  onUploadError,
}: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadUrl) return;

    setUploading(true);
    setProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploading(false);
          onUploadComplete();
        } else {
          setUploading(false);
          onUploadError(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        onUploadError("Upload failed. Please try again.");
      });

      xhr.send(file);
    } catch (err) {
      setUploading(false);
      onUploadError("Upload failed. Please try again.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-fade-in">
      {/* Drop zone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${
            dragActive ? "var(--color-primary)" : "var(--color-border)"
          }`,
          borderRadius: "var(--radius-lg)",
          padding: "48px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          background: dragActive
            ? "rgba(99,102,241,0.08)"
            : "var(--color-bg-tertiary)",
        }}
        onClick={() =>
          !file && document.getElementById("video-input")?.click()
        }
      >
        <input
          id="video-input"
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {!file ? (
          <>
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "16px",
                opacity: dragActive ? 1 : 0.7,
                transition: "opacity 0.3s",
              }}
            >
              📤
            </div>
            <p style={{ fontWeight: 600, fontSize: "1.05rem", marginBottom: "8px" }}>
              {dragActive
                ? "Drop your video here"
                : "Drag & drop your video here"}
            </p>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
              }}
            >
              or click to browse · MP4, MOV, AVI · Max 500MB
            </p>
          </>
        ) : (
          <div>
            <div
              style={{
                fontSize: "2rem",
                marginBottom: "12px",
              }}
            >
              🎥
            </div>
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>{file.name}</p>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
                marginBottom: "16px",
              }}
            >
              {formatFileSize(file.size)}
            </p>

            {uploading ? (
              <div>
                {/* Progress bar */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    borderRadius: "4px",
                    background: "var(--color-bg-primary)",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      borderRadius: "4px",
                      background: "var(--gradient-primary)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    color: "var(--color-accent-light)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  Uploading... {progress}%
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  style={{ padding: "8px 20px", fontSize: "0.9rem" }}
                >
                  Change File
                </button>
                <button
                  className="btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  style={{ padding: "8px 24px", fontSize: "0.9rem" }}
                >
                  Upload Video
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
