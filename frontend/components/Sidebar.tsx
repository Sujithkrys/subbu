"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Clapperboard, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mostRecentProjectId, setMostRecentProjectId] = useState<string | null>(null);
  const handleEditorClick = () => {
    router.push("/project");
  };

  // Hide sidebar on editor pages, login, signup, home
  const hideSidebar = pathname?.startsWith("/project/") || pathname === "/" || pathname === "/login" || pathname === "/signup";
  if (hideSidebar) return null;

  const currentMenu = pathname?.startsWith("/settings") ? "settings" : "dashboard";

  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, go: () => router.push("/dashboard") },
    { id: "editor", label: "Editor", icon: Clapperboard, go: handleEditorClick },
    { id: "settings", label: "Settings", icon: SettingsIcon, go: () => router.push("/settings") },
  ];

  return (
    <aside className="flex w-56 flex-col px-4 py-6" style={{ background: "var(--color-rail)", borderRight: "1px solid var(--color-border-theme)" }}>
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-semibold text-white" style={{ background: "var(--color-accent)" }}>సు</div>
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Subbu</span>
      </div>
      <nav className="space-y-1">
        {items.map(({ id, label, icon: Icon, go }) => (
          <button
            key={id}
            onClick={go}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
            style={currentMenu === id ? { background: "var(--color-accent)", color: "#FFF" } : { color: "var(--color-text-secondary)" }}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl p-4" style={{ background: "var(--color-accent-soft)" }}>
        <p className="mb-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Creator plan</p>
        <p className="mb-3 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>Higher caption quotas — coming soon.</p>
        <button className="w-full rounded-lg py-2 text-xs font-medium text-white transition-transform hover:scale-[1.02]" style={{ background: "var(--color-accent)" }}>Join waitlist</button>
      </div>
    </aside>
  );
}
