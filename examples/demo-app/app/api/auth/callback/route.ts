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
  const clientId = process.env.NEXT_PUBLIC_SSSO_CLIENT_ID;
  const clientSecret = process.env.SSSO_CLIENT_SECRET;

  if (!authUrl || !clientId) {
    return NextResponse.json(
      { error: "Missing SSSO env vars", code: "misconfigured" },
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
      { error: "code_verifier or SSSO_CLIENT_SECRET required" },
      { status: 400 }
    );
  }

  const tokenUrl = new URL(`${authUrl}/api/oauth/token`);
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (tokenUrl.hostname.endsWith(".localhost")) {
    requestHeaders["Host"] = tokenUrl.host;
    tokenUrl.hostname = "127.0.0.1";
  }

  const res = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
