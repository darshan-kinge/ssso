import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { AccountPanel } from "@/components/auth/AccountPanel";

export default function AccountPage() {
  const { app } = getPublicConfig();

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">{app.name} account</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Manage your profile, active sessions, and connected applications.
      </p>
      <div className="mt-8">
        <AccountPanel />
      </div>
      <div className="mt-8 flex justify-center gap-4 text-sm">
        <Link href="/apps" className="text-[var(--accent)] hover:underline">
          Manage apps
        </Link>
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--foreground)]">
          Home
        </Link>
      </div>
    </main>
  );
}
