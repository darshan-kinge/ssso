import { type ReactNode } from "react";
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
export declare function AuthProvider({ config, callbackApiUrl, autoHandleCallback, onAuthenticated, children, }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextValue;
//# sourceMappingURL=context.d.ts.map