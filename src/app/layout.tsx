import type { Metadata } from "next";
import "./globals.css";

// CLEAN REBUILD - STABILIZED TYPOGRAPHY v1.0.1

export const metadata: Metadata = {
  title: "AI Train Traffic Control",
  description: "AI-Powered Indian Railway Traffic Control — Simulation & Real-Time Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
