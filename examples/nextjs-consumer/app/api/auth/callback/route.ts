import { NextResponse } from "next/server";

/**
 * Template: copy into your Next.js consumer app.
 * Exchanges OAuth code using SSSO_CLIENT_SECRET (server-only).
 */
export async function POST(request: Request) {
  const { code, redirect_uri } = await request.json();

  if (!code || !redirect_uri) {
    return NextResponse.json(
      { error: "code and redirect_uri required" },
      { status: 400 }
    );
  }

  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL?.replace(/\/$/, "");
  const clientId = process.env.NEXT_PUBLIC_SSSO_CLIENT_ID;
  const clientSecret = process.env.SSSO_CLIENT_SECRET;

  if (!authUrl || !clientId || !clientSecret) {
    return NextResponse.json({ error: "Misconfigured" }, { status: 503 });
  }

  const res = await fetch(`${authUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
