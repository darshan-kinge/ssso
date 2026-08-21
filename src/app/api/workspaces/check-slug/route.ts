import { connectDb } from "@/lib/db/mongoose";
import { Workspace } from "@/lib/models/Workspace";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import {
  normalizeSlugInput,
  validateWorkspaceSlug,
} from "@/lib/workspace/slug";

export const GET = withAuthRoute(async (request) => {
  const url = new URL(request.url);
  const raw = url.searchParams.get("slug") ?? "";
  const slug = normalizeSlugInput(raw);

  const validation = validateWorkspaceSlug(slug);
  if (!validation.valid) {
    return jsonOk({ slug, available: false, reason: validation.message });
  }

  await connectDb();
  const taken = await Workspace.exists({ slug });
  return jsonOk({
    slug,
    available: !taken,
    reason: taken ? "This subdomain is already taken" : null,
  });
});
