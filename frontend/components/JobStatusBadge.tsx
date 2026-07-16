"use client";

import { useEffect, useState } from "react";
import { getProjectStatus } from "@/lib/api";
import type { Job } from "@/lib/types";

interface JobStatusBadgeProps {
  projectId: string;
  onStatusUpdate?: (jobs: Job[], projectStatus: string) => void;
  pollInterval?: number;
}

export default function JobStatusBadge({
  projectId,
  onStatusUpdate,
  pollInterval = 3000,
}: JobStatusBadgeProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const status = await getProjectStatus(projectId);
        setJobs(status.jobs);
        setError(null);
        onStatusUpdate?.(status.jobs, status.project_status);

        // Stop polling if all jobs are done or failed
        const hasActiveJobs = status.jobs.some(
          (j) => j.status === "queued" || j.status === "processing"
        );
        if (!hasActiveJobs) {
          clearInterval(intervalId);
        }
      } catch (err) {
        setError("Failed to fetch status");
      }
    };

    poll(); // Initial poll
    intervalId = setInterval(poll, pollInterval);

    return () => clearInterval(intervalId);
  }, [projectId, pollInterval]);

  if (error) {
    return (
      <span className="badge badge-error" style={{ fontSize: "0.75rem" }}>
        ⚠ {error}
      </span>
    );
  }

  if (jobs.length === 0) return null;

  // Show the most recent active job
  const activeJob = jobs.find(
    (j) => j.status === "processing" || j.status === "queued"
  );
  const latestJob = activeJob || jobs[0];

  const getJobLabel = (type: string) => {
    switch (type) {
      case "transcribe":
        return "Transcribing";
      case "translate":
        return "Translating";
      case "render":
        return "Exporting";
      default:
        return type;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "done":
        return "badge-success";
      case "processing":
        return "badge-processing";
      case "queued":
        return "badge-info";
      case "failed":
        return "badge-error";
      default:
        return "badge-info";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span className={`badge ${getStatusBadgeClass(job.status)}`}>
            {job.status === "processing" && (
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  border: "2px solid currentColor",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin-slow 0.8s linear infinite",
                }}
              />
            )}
            {getJobLabel(job.type)} · {job.status}
          </span>

          {/* Progress bar for active jobs */}
          {(job.status === "processing" || job.status === "queued") && (
            <div
              style={{
                flex: 1,
                height: "6px",
                borderRadius: "3px",
                background: "var(--color-bg-primary)",
                overflow: "hidden",
                maxWidth: "200px",
              }}
            >
              <div
                style={{
                  width: `${job.progress}%`,
                  height: "100%",
                  borderRadius: "3px",
                  background: "var(--gradient-primary)",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          )}

          {job.status === "processing" && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                fontWeight: 500,
              }}
            >
              {Math.round(job.progress)}%
            </span>
          )}

          {job.error && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#ef4444",
              }}
            >
              {job.error}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
