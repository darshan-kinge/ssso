import { getPublicConfig } from "@/lib/config";

/** Where to send the user after login/signup (client-side). */
export function getPostAuthPath(
  hasWorkspaces: boolean,
  oauthReturn: string | null,
  options?: { tenantHost?: boolean }
): string {
  if (oauthReturn) return oauthReturn;

  if (options?.tenantHost) {
    return "/";
  }

  const { deployment } = getPublicConfig();
  if (deployment.saas) {
    return hasWorkspaces ? "/dashboard" : "/dashboard/workspace/new";
  }
  return "/account";
}
