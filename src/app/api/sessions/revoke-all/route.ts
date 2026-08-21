import { z } from "zod";
import {
  getAuthenticatedUser,
  requireWorkspaceRole,
} from "@/lib/auth/request";
import {
  revokeAllSessionsForUser,
  revokeOtherSessionsForUser,
} from "@/lib/auth/sessions-mgmt";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { logAudit } from "@/lib/security/audit";
import { isMultiTenantEnabled } from "@/lib/config/deployment";

const bodySchema = z.object({
  exceptCurrent: z.boolean().optional().default(true),
});

export const POST = withAuthRoute(async (request) => {
  const auth = request.headers.get("authorization");

  let userId: string;
  let email: string;
  let workspaceId: string | undefined;

  if (isMultiTenantEnabled()) {
    const ctx = await requireWorkspaceRole(auth, "viewer");
    userId = ctx.user._id.toString();
    email = ctx.user.email;
    workspaceId = ctx.workspaceId!;
  } else {
    const { user } = await getAuthenticatedUser(auth);
    userId = user._id.toString();
    email = user.email;
  }

  let exceptCurrent = true;
  const text = await request.text();
  if (text) {
    const parsed = bodySchema.safeParse(JSON.parse(text));
    if (parsed.success) {
      exceptCurrent = parsed.data.exceptCurrent;
    }
  }

  const revokedCount = exceptCurrent
    ? await revokeOtherSessionsForUser(userId, workspaceId)
    : await revokeAllSessionsForUser(userId, workspaceId);

  await logAudit({
    action: "session.revoke_all",
    request,
    success: true,
    userId,
    email,
    workspaceId,
    meta: { revokedCount, exceptCurrent },
  });

  return jsonOk({
    success: true,
    revokedCount,
    exceptCurrent,
  });
});
