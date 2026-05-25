import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { AuthForm } from "@/components/auth/AuthForm";
import { getOAuthReturnPath } from "@/components/oauth/OAuthReturn";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { app } = getPublicConfig();
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  const oauthReturn = getOAuthReturnPath(params);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Create your {app.name} account</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        One account for all your projects.
      </p>
      <AuthForm mode="signup" oauthReturn={oauthReturn} />
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link
          href={oauthReturn ? `/login?${params.toString()}` : "/login"}
          className="text-[var(--accent)] hover:underline"
        >
          Sign in
        </Link>
      </p>
      <Link
        href="/"
        className="mt-4 text-center text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Home
      </Link>
    </main>
  );
}
