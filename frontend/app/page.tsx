"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Guest mode: Bypass landing page and go straight to dashboard
    router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--color-text-secondary)" }}>
      Redirecting to dashboard...
    </div>
  );
}
