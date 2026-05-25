"use client";
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { useAuth } from "./context.js";
export function ProtectedRoute({ children, fallback = null, unauthenticated, autoLogin, }) {
    const { loading, isAuthenticated, login } = useAuth();
    const shouldAutoLogin = autoLogin ?? unauthenticated === undefined;
    useEffect(() => {
        if (!loading && !isAuthenticated && shouldAutoLogin) {
            login();
        }
    }, [loading, isAuthenticated, shouldAutoLogin, login]);
    if (loading) {
        return _jsx(_Fragment, { children: fallback });
    }
    if (!isAuthenticated) {
        if (unauthenticated !== undefined) {
            return _jsx(_Fragment, { children: unauthenticated });
        }
        return _jsx(_Fragment, { children: fallback });
    }
    return _jsx(_Fragment, { children: children });
}
