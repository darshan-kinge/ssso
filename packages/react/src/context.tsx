"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SssoClient, type SssoConfig, type SssoUser, type WorkspacePublicConfig } from "@ssso/core";

export interface AuthContextValue {
  user: SssoUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (state?: string) => void;
  logout: () => void;
  getWorkspaceConfig: () => Promise<WorkspacePublicConfig>;
  client: SssoClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  config: SssoConfig;
  /**
   * Your backend route that exchanges the code (recommended for production).
   * Example: `/api/auth/callback`
   */
  callbackApiUrl?: string;
  /**
   * Exchange code on callback. Default: true when callbackApiUrl or clientSecret is set.
   */
  autoHandleCallback?: boolean;
  onAuthenticated?: (user: SssoUser, accessToken: string) => void;
  children: ReactNode;
}

export function AuthProvider({
  config,
  callbackApiUrl,
  autoHandleCallback,
  onAuthenticated,
  children,
}: AuthProviderProps) {
  const client = useMemo(
    () => new SssoClient(config),
    [
      config.authUrl,
      config.clientId,
      config.redirectUri,
      config.storageKey,
      config.stateKey,
    ]
  );
  const [user, setUser] = useState<SssoUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncFromStorage = useCallback(() => {
    const t = client.getToken();
    setToken(t);
    setUser(client.getUser());
  }, [client]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const shouldAuto =
        autoHandleCallback ??
        Boolean(
          (callbackApiUrl || config.clientSecret) &&
            typeof window !== "undefined"
        );

      if (shouldAuto && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.has("code")) {
          try {
            const result = callbackApiUrl
              ? await client.handleCallbackViaApi(
                  window.location.search,
                  callbackApiUrl
                )
              : await client.handleCallback(window.location.search);
            if (cancelled) return;
            setToken(result.accessToken);
            setUser(result.user);
            onAuthenticated?.(result.user, result.accessToken);
            const url = new URL(window.location.href);
            url.searchParams.delete("code");
            url.searchParams.delete("state");
            window.history.replaceState({}, "", url.pathname + url.search);
          } catch (e) {
            if (!cancelled) {
              setError(e instanceof Error ? e.message : "Callback failed");
            }
          }
        }
      }

      if (!cancelled) {
        syncFromStorage();
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [
    client,
    callbackApiUrl,
    config.clientSecret,
    autoHandleCallback,
    onAuthenticated,
    syncFromStorage,
  ]);

  const login = useCallback(
    (state?: string) => {
      void client.login(state);
    },
    [client]
  );

  const logout = useCallback(() => {
    client.logout();
    setToken(null);
    setUser(null);
    setError(null);
  }, [client]);

  const getWorkspaceConfig = useCallback(() => {
    return client.getWorkspaceConfig();
  }, [client]);

  const value: AuthContextValue = {
    user,
    token,
    loading,
    error,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
    getWorkspaceConfig,
    client,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
