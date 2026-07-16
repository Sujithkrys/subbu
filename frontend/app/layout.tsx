import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SubGen — AI Subtitle Generator",
  description:
    "Generate AI-powered subtitles for your videos. Translate into Telugu, Hindi, Tamil, and all major Indian languages. Export as SRT, VTT, ASS, or burned-in MP4.",
  keywords: [
    "subtitle generator",
    "AI subtitles",
    "video translation",
    "Indian languages",
    "Telugu subtitles",
    "Hindi subtitles",
    "Tamil subtitles",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;500;700&family=Noto+Sans+Tamil:wght@400;500;700&family=Noto+Sans+Telugu:wght@400;500;700&family=Noto+Sans+Kannada:wght@400;500;700&family=Noto+Sans+Malayalam:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main
          style={{
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
