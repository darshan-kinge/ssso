import Link from "next/link";
import { getPublicConfig } from "@/lib/config";

export default function HomePage() {
  const { app, urls } = getPublicConfig();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
        {app.name}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{app.tagline}</h1>
      <p className="mt-4 text-[var(--muted)]">{app.description}</p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-center text-sm font-medium text-white transition hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-center text-sm font-medium transition hover:border-zinc-600"
        >
          Create account
        </Link>
        <Link
          href="/account"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-center text-sm font-medium transition hover:border-zinc-600"
        >
          My account
        </Link>
        <Link
          href="/apps"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-center text-sm font-medium transition hover:border-zinc-600"
        >
          My apps
        </Link>
        <Link
          href="/status"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-center text-sm font-medium transition hover:border-zinc-600"
        >
          Status
        </Link>
      </div>

      <p className="mt-12 text-xs text-[var(--muted)]">
        Auth URL: {urls.authBase}
        <br />
        Customize branding in{" "}
        <code className="rounded bg-[var(--card)] px-1 py-0.5">
          oneauth.config.ts
        </code>
      </p>
    </main>
  );
}
