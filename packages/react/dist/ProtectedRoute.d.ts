import { type ReactNode } from "react";
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
export declare function ProtectedRoute({ children, fallback, unauthenticated, autoLogin, }: ProtectedRouteProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProtectedRoute.d.ts.map