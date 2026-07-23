"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [preEditorCollapsed, setPreEditorCollapsed] = useState(false);
  const [wasInEditor, setWasInEditor] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const isEditor = pathname?.startsWith("/project");
    
    if (isEditor && !wasInEditor) {
      setPreEditorCollapsed(collapsed);
      setCollapsed(true);
      setWasInEditor(true);
    } else if (!isEditor && wasInEditor) {
      setCollapsed(preEditorCollapsed);
      setWasInEditor(false);
    }
  }, [pathname, collapsed, wasInEditor, preEditorCollapsed]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}
