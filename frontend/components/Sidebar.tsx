"use client";

import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  projectId: string;
  projectTitle?: string;
}

const navItems = [
  { label: "Upload", icon: "📤", section: "upload" },
  { label: "Transcript", icon: "📝", section: "transcript" },
  { label: "Translate", icon: "🌐", section: "translate" },
  { label: "Style", icon: "🎨", section: "style" },
  { label: "Preview", icon: "🖥️", section: "preview" },
  { label: "Export", icon: "📥", section: "export" },
];

export default function Sidebar({ projectId, projectTitle }: SidebarProps) {
  const router = useRouter();

  const scrollToSection = (section: string) => {
    const el = document.getElementById(`section-${section}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside
      className="glass"
      style={{
        width: "220px",
        minHeight: "calc(100vh - 64px)",
        padding: "24px 12px",
        borderRight: "1px solid var(--color-border)",
        position: "sticky",
        top: "64px",
        flexShrink: 0,
      }}
    >
      {/* Back to dashboard */}
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          padding: "8px 12px",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.85rem",
          width: "100%",
          marginBottom: "8px",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        ← Dashboard
      </button>

      {/* Project title */}
      <div
        style={{
          padding: "8px 12px",
          marginBottom: "16px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "16px",
        }}
      >
        <p
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {projectTitle || "Untitled Project"}
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => (
          <button
            key={item.section}
            onClick={() => scrollToSection(item.section)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              textAlign: "left",
              width: "100%",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-bg-hover)";
              e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
