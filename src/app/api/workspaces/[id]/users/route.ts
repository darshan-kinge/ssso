import { getAuthenticatedPlatformUser } from "@/lib/auth/request";
import { requireMembership } from "@/lib/workspace/service";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { EndUser } from "@/lib/models/EndUser";
import { Session } from "@/lib/models/Session";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId } = await context.params;
    const { user } = await getAuthenticatedPlatformUser(
      request.headers.get("authorization")
    );
    await requireMembership(user._id.toString(), workspaceId, "admin");

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10)));
    const search = url.searchParams.get("search")?.toLowerCase().trim() ?? "";

    const query = search
      ? { workspaceId, email: { $regex: search, $options: "i" } }
      : { workspaceId };

    const total = await EndUser.countDocuments(query);
    const endUsers = await EndUser.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("-passwordHash")
      .lean();

    // Fetch last seen from sessions
    const userIds = endUsers.map((u) => u._id);
    const sessions = await Session.find({
      userId: { $in: userIds },
      sessionType: "end_user",
    })
      .sort({ expiresAt: -1 })
      .select("userId expiresAt")
      .lean();

    const lastSeenMap = new Map<string, string>();
    for (const s of sessions) {
      const uid = s.userId.toString();
      if (!lastSeenMap.has(uid)) {
        lastSeenMap.set(uid, (s.expiresAt as Date).toISOString());
      }
    }

    const users = endUsers.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      isVerified: u.isVerified,
      disabled: (u as typeof u & { disabled?: boolean }).disabled ?? false,
      externalId: u.externalId ?? null,
      createdAt: (u as typeof u & { createdAt?: Date }).createdAt?.toISOString() ?? null,
      lastSeenAt: lastSeenMap.get(u._id.toString()) ?? null,
    }));

    return jsonOk({ users, total, page, pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}
