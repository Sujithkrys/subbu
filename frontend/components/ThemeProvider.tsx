"use client";

import { useEffect, useState } from "react";
import { getUserSettings } from "@/lib/api";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Fetch theme from Supabase on mount
    async function fetchTheme() {
      try {
        const settings = await getUserSettings();
        if (settings?.theme) {
          setTheme(settings.theme as "dark" | "light");
          document.documentElement.setAttribute("data-theme", settings.theme);
        }
      } catch (err) {
        // Not authenticated yet, fallback to dark
        document.documentElement.setAttribute("data-theme", "dark");
      }
    }
    fetchTheme();
  }, []);

  return <>{children}</>;
}
