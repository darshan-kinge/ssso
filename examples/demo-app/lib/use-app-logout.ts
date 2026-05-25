"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@oneauth/react";

/** Sign out of this app and leave protected pages. */
export function useAppLogout() {
  const { logout } = useAuth();
  const router = useRouter();

  return () => {
    logout();
    router.push("/");
    router.refresh();
  };
}
