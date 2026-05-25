import { NextResponse } from "next/server";

/** Server-side or PKCE code exchange */
export async function POST(request: Request) {
  const { code, redirect_uri, code_verifier } = await request.json();

  if (!code || !redirect_uri) {
    return NextResponse.json(
      { error: "code and redirect_uri required" },
      { status: 400 }
    );
  }

  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL?.replace(/\/$/, "");
  const clientId = process.env.NEXT_PUBLIC_ONEAUTH_CLIENT_ID;
  const clientSecret = process.env.ONEAUTH_CLIENT_SECRET;

  if (!authUrl || !clientId) {
    return NextResponse.json(
      { error: "Missing OneAuth env vars", code: "misconfigured" },
      { status: 503 }
    );
  }

  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri,
  };

  if (code_verifier) {
    body.code_verifier = code_verifier;
  } else if (clientSecret) {
    body.client_secret = clientSecret;
  } else {
    return NextResponse.json(
      { error: "code_verifier or ONEAUTH_CLIENT_SECRET required" },
      { status: 400 }
    );
  }

  const res = await fetch(`${authUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
