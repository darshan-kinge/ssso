import type { Metadata } from "next";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";
import { SetupBanner } from "@/components/SetupBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse — OneAuth demo app",
  description:
    "Real-world SaaS example: projects, protected APIs, SSO with OneAuth",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          <SetupBanner />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
