"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Clapperboard, Settings as SettingsIcon, PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();

  // Hide sidebar entirely on login, signup, and home.
  // We NO LONGER hide it on the editor page (/project).
  const hideSidebar = pathname === "/" || pathname === "/login" || pathname === "/signup";
  if (hideSidebar) return null;

  const currentMenu = pathname?.startsWith("/settings") ? "settings" 
    : pathname?.startsWith("/project") ? "editor" 
    : "dashboard";

  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, go: () => router.push("/dashboard") },
    { id: "editor", label: "Editor", icon: Clapperboard, go: () => router.push("/project") },
  ];

  return (
    <aside
      className={`flex flex-col py-4 transition-[width] duration-150 ${collapsed ? "w-16 px-2" : "w-56 px-4"}`}
      style={{ background: "var(--color-rail)", borderRight: "1px solid var(--color-border-theme)" }}
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="mb-8 flex h-9 w-9 items-center justify-center self-center rounded-xl text-base font-semibold text-white transition-transform hover:scale-105"
          style={{ background: "var(--color-accent)" }}
          title="Expand sidebar"
        >
          సు
        </button>
      ) : (
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-semibold text-white" style={{ background: "var(--color-accent)" }}>సు</div>
            <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Subbu</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--color-text-secondary)" }}
            title="Collapse sidebar"
          >
            <PanelLeft size={18} />
          </button>
        </div>
      )}

      <nav className="space-y-1">
        {items.map(({ id, label, icon: Icon, go }) => (
          <button
            key={id}
            onClick={go}
            title={collapsed ? label : undefined}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
            style={currentMenu === id ? { background: "var(--color-accent)", color: "#FFF" } : { color: "var(--color-text-secondary)" }}
          >
            <Icon size={17} />
            {!collapsed && label}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="mt-auto mb-4 rounded-2xl p-4" style={{ background: "var(--color-accent-soft)" }}>
          <p className="mb-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Creator plan</p>
          <p className="mb-3 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>Higher caption quotas — coming soon.</p>
          <button className="w-full rounded-lg py-2 text-xs font-medium text-white transition-transform hover:scale-[1.02]" style={{ background: "var(--color-accent)" }}>Join waitlist</button>
        </div>
      )}
      {collapsed && <div className="mt-auto" />}

      <div className="pt-3 mt-3" style={{ borderTop: "1px solid var(--color-border-theme)" }}>
        <button
          onClick={() => router.push("/settings")}
          title={collapsed ? "Settings" : undefined}
          className={`flex w-full items-center rounded-xl py-2.5 text-sm transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
          style={currentMenu === "settings" ? { background: "var(--color-accent)", color: "#FFF" } : { color: "var(--color-text-secondary)" }}
        >
          <SettingsIcon size={17} />
          {!collapsed && "Settings"}
        </button>
      </div>
    </aside>
  );
}
