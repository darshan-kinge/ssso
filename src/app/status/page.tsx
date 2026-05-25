import Link from "next/link";

async function getHealth() {
  const base = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/health`, {
      cache: "no-store",
    });
    return res.json();
  } catch {
    return { status: "error", message: "Cannot reach API" };
  }
}

export default async function StatusPage() {
  const health = await getHealth();

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">System status</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Live values from <code>/api/health</code>
      </p>

      <pre className="mt-8 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs">
        {JSON.stringify(health, null, 2)}
      </pre>

      <Link href="/" className="mt-8 inline-block text-sm text-[var(--accent)]">
        ← Home
      </Link>
    </main>
  );
}
