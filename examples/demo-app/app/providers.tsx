"use client";

import { AuthProvider } from "@oneauth/react";
import { getPublicEnv } from "@/lib/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const { authUrl, clientId, redirectUri } = getPublicEnv();

  return (
    <AuthProvider
      config={{
        authUrl,
        clientId,
        redirectUri,
        usePkce: true,
      }}
      callbackApiUrl="/api/auth/callback"
      onAuthenticated={() => {
        if (typeof window !== "undefined") {
          const dest = sessionStorage.getItem("oneauth_demo_return") ?? "/dashboard";
          sessionStorage.removeItem("oneauth_demo_return");
          if (window.location.pathname === "/callback") {
            window.location.href = dest;
          }
        }
      }}
    >
      {children}
    </AuthProvider>
  );
}
