import type { Metadata } from "next";
import { getPublicConfig } from "@/lib/config";
import "./globals.css";

export function generateMetadata(): Metadata {
  const { app } = getPublicConfig();
  return {
    title: app.name,
    description: app.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
