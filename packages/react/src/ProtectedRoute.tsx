"use client";

import { useEffect, type ReactNode } from "react";
import { useAuth } from "./context.js";

export interface ProtectedRouteProps {
  children: ReactNode;
  /** Shown while checking session */
  fallback?: ReactNode;
  /** Shown when not authenticated */
  unauthenticated?: ReactNode;
  /**
   * Redirect to OneAuth when unauthenticated.
   * Default: true if `unauthenticated` is omitted, false if you provide custom UI.
   */
  autoLogin?: boolean;
}

export function ProtectedRoute({
  children,
  fallback = null,
  unauthenticated,
  autoLogin,
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, login } = useAuth();
  const shouldAutoLogin = autoLogin ?? unauthenticated === undefined;

  useEffect(() => {
    if (!loading && !isAuthenticated && shouldAutoLogin) {
      login();
    }
  }, [loading, isAuthenticated, shouldAutoLogin, login]);

  if (loading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    if (unauthenticated !== undefined) {
      return <>{unauthenticated}</>;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
