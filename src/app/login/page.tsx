import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { AuthForm } from "@/components/auth/AuthForm";
import { getOAuthReturnPath } from "@/components/oauth/OAuthReturn";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { app } = getPublicConfig();
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  const oauthReturn = getOAuthReturnPath(params);
  const resetSuccess = raw.reset === "success";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Sign in to {app.name}</h1>
      {resetSuccess && (
        <p className="mt-2 text-sm text-[var(--accent)]">
          Password updated. Sign in with your new password.
        </p>
      )}
      <p className="mt-2 text-sm text-[var(--muted)]">
        {oauthReturn
          ? "Sign in to continue to the requesting application."
          : `Use your ${app.name} account across all connected apps.`}
      </p>
      <AuthForm mode="login" oauthReturn={oauthReturn} />
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        No account?{" "}
        <Link
          href={oauthReturn ? `/signup?${params.toString()}` : "/signup"}
          className="text-[var(--accent)] hover:underline"
        >
          Sign up
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
