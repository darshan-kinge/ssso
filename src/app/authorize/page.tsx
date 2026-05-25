import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { getPublicConfig } from "@/lib/config";
import { isAuthError } from "@/lib/auth/errors";
import {
  parseAuthorizeParams,
  completeAuthorization,
} from "@/lib/oauth/authorize";
import { buildAuthorizeQuery } from "@/lib/oauth/params";
import { validateOAuthClient } from "@/lib/oauth/apps";
import { assertAuthorizePkceForApp } from "@/lib/oauth/pkce-policy";
import { getUserFromRefreshCookie } from "@/lib/oauth/session-user";
import { AuthorizePanel } from "@/components/oauth/AuthorizePanel";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}

export default async function AuthorizePage({ searchParams }: PageProps) {
  const { app: brand } = getPublicConfig();
  const raw = await searchParams;
  const query = toSearchParams(raw);

  if (!isDbConfigured()) {
    return (
      <ErrorShell
        title="Not configured"
        message="Set MONGODB_URI and secrets in .env.local"
      />
    );
  }

  try {
    requireAuthSecrets();
    await connectDb();
  } catch {
    return (
      <ErrorShell
        title="Misconfigured"
        message="JWT_SECRET and REFRESH_PEPPER must be at least 32 characters."
      />
    );
  }

  let oauthParams;
  try {
    oauthParams = parseAuthorizeParams(query);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const code =
      msg === "unsupported_response_type"
        ? "Only response_type=code is supported"
        : msg === "unsupported_code_challenge_method"
          ? "Only code_challenge_method=S256 is supported"
          : "Missing or invalid OAuth parameters (client_id, redirect_uri, response_type=code)";
    return <ErrorShell title="Invalid request" message={code} />;
  }

  let app;
  try {
    app = await validateOAuthClient(
      oauthParams.client_id,
      oauthParams.redirect_uri
    );
    assertAuthorizePkceForApp(app, oauthParams);
  } catch (err) {
    const message = isAuthError(err)
      ? err.message
      : err instanceof Error
        ? err.message
        : "Unknown application";
    return <ErrorShell title="Application error" message={message} />;
  }

  const user = await getUserFromRefreshCookie();
  if (user) {
    const redirectUrl = await completeAuthorization(user, oauthParams);
    redirect(redirectUrl);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-6 text-sm text-[var(--muted)]">{brand.name}</p>
      <AuthorizePanel
        brandName={brand.name}
        appName={app.name}
        params={oauthParams}
      />
      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Request: <code className="rounded bg-[var(--card)] px-1">/authorize?{buildAuthorizeQuery(oauthParams)}</code>
      </p>
      <Link
        href="/"
        className="mt-6 text-center text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Home
      </Link>
    </main>
  );
}

function ErrorShell({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-xl font-semibold text-red-400">{title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
      <Link href="/" className="mt-8 text-sm text-[var(--accent)] hover:underline">
        ← Home
      </Link>
    </main>
  );
}
