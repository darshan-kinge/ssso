import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { AppsManager } from "@/components/apps/AppsManager";

export default function AppsPage() {
  const { app } = getPublicConfig();

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">{app.name} applications</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Register client apps for SSO (Phase 2).
      </p>
      <div className="mt-8">
        <AppsManager />
      </div>
      <Link
        href="/account"
        className="mt-8 inline-block text-sm text-[var(--accent)] hover:underline"
      >
        ← Account
      </Link>
    </main>
  );
}
