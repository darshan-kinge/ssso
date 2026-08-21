import { AuthError } from "@/lib/auth/errors";
import { isWorkspaceCollaborationEnabled } from "@/lib/config/deployment";

export function assertWorkspaceCollaborationEnabled(): void {
  if (!isWorkspaceCollaborationEnabled()) {
    throw new AuthError(
      "Workspace collaboration is not enabled",
      503,
      "feature_disabled"
    );
  }
}
