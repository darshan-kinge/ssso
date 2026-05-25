import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { SetupBanner } from "@/components/SetupBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneAuth SDK Demo",
  description: "Full example: @oneauth/react, @oneauth/core, @oneauth/node",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          <SetupBanner />
          <Navbar />
          <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
