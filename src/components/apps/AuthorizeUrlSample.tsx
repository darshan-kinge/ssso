"use client";

import { useEffect, useState } from "react";

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function codeChallengeS256(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

interface AuthorizeUrlSampleProps {
  authOrigin: string;
  clientId: string;
  redirectUri: string;
  clientType: "public" | "confidential";
}

export function AuthorizeUrlSample({
  authOrigin,
  clientId,
  redirectUri,
  clientType,
}: AuthorizeUrlSampleProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const base = `${authOrigin}/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=dev`;

      if (clientType === "confidential") {
        if (!cancelled) setUrl(base);
        return;
      }

      const verifier = generateCodeVerifier();
      const challenge = await codeChallengeS256(verifier);
      if (!cancelled) {
        setUrl(
          `${base}&code_challenge=${challenge}&code_challenge_method=S256`
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authOrigin, clientId, redirectUri, clientType]);

  if (!url) {
    return <p className="mt-3 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider animate-pulse">Building sample URL…</p>;
  }

  return (
    <div className="mt-4">
      <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
        {clientType === "public"
          ? "Sample Authorize URL (PKCE S256)"
          : "Sample Authorize URL (Confidential)"}
      </span>
      <p className="mt-1.5 p-2.5 rounded border border-zinc-850 bg-zinc-950/50 break-all font-mono text-[11px] text-zinc-400 select-all leading-normal">
        {url}
      </p>
    </div>
  );
}
