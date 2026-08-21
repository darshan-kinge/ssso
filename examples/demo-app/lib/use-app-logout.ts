"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@ssso/react";
import { getPublicEnv } from "./config";

/** Sign out of this app and leave protected pages. */
export function useAppLogout() {
  const { logout } = useAuth();
  const router = useRouter();
  const env = getPublicEnv();

  return () => {
    logout();

    if (typeof window !== "undefined") {
      const redirectUrl = window.location.origin;
      const ssoLogoutUrl = `${env.authUrl}/api/auth/logout?redirect_uri=${encodeURIComponent(redirectUrl)}`;
      window.location.href = ssoLogoutUrl;
    } else {
      router.push("/");
      router.refresh();
    }
  };
}

