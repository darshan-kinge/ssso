import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/request";
import {
  revokeAllSessionsForUser,
  revokeOtherSessionsForUser,
} from "@/lib/auth/sessions-mgmt";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { logAudit } from "@/lib/security/audit";

const bodySchema = z.object({
  exceptCurrent: z.boolean().optional().default(true),
});

export const POST = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedUser(
    request.headers.get("authorization")
  );

  let exceptCurrent = true;
  const text = await request.text();
  if (text) {
    const parsed = bodySchema.safeParse(JSON.parse(text));
    if (parsed.success) {
      exceptCurrent = parsed.data.exceptCurrent;
    }
  }

  const userId = user._id.toString();
  const revokedCount = exceptCurrent
    ? await revokeOtherSessionsForUser(userId)
    : await revokeAllSessionsForUser(userId);

  await logAudit({
    action: "session.revoke_all",
    request,
    success: true,
    userId,
    email: user.email,
    meta: { revokedCount, exceptCurrent },
  });

  return jsonOk({
    success: true,
    revokedCount,
    exceptCurrent,
  });
});
