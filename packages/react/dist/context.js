"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { SssoClient } from "@ssso/core";
const AuthContext = createContext(null);
export function AuthProvider({ config, callbackApiUrl, autoHandleCallback, onAuthenticated, children, }) {
    const client = useMemo(() => new SssoClient(config), [
        config.authUrl,
        config.clientId,
        config.redirectUri,
        config.storageKey,
        config.stateKey,
    ]);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const syncFromStorage = useCallback(() => {
        const t = client.getToken();
        setToken(t);
        setUser(client.getUser());
    }, [client]);
    useEffect(() => {
        let cancelled = false;
        async function init() {
            const shouldAuto = autoHandleCallback ??
                Boolean((callbackApiUrl || config.clientSecret) &&
                    typeof window !== "undefined");
            if (shouldAuto && typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                if (params.has("code")) {
                    try {
                        const result = callbackApiUrl
                            ? await client.handleCallbackViaApi(window.location.search, callbackApiUrl)
                            : await client.handleCallback(window.location.search);
                        if (cancelled)
                            return;
                        setToken(result.accessToken);
                        setUser(result.user);
                        onAuthenticated?.(result.user, result.accessToken);
                        const url = new URL(window.location.href);
                        url.searchParams.delete("code");
                        url.searchParams.delete("state");
                        window.history.replaceState({}, "", url.pathname + url.search);
                    }
                    catch (e) {
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
    const login = useCallback((state) => {
        void client.login(state);
    }, [client]);
    const logout = useCallback(() => {
        client.logout();
        setToken(null);
        setUser(null);
        setError(null);
    }, [client]);
    const getWorkspaceConfig = useCallback(() => {
        return client.getWorkspaceConfig();
    }, [client]);
    const value = {
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
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
