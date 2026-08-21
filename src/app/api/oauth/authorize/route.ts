import { getOAuthSubjectFromRefreshCookie } from "@/lib/oauth/subject";
import {
  parseAuthorizeParams,
  completeAuthorization,
} from "@/lib/oauth/authorize";
import { validateOAuthClient } from "@/lib/oauth/apps";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError } from "@/lib/auth/errors";
import { jsonOk } from "@/lib/api/response";
import { getResolvedTenantWorkspace } from "@/lib/workspace/request-context";
import { isMultiTenantEnabled } from "@/lib/config/deployment";

/** Complete OAuth authorize step for the current auth-domain session. */
export const POST = withAuthRoute(async (request) => {
  const body = await request.json();
  const search = new URLSearchParams();

  for (const key of [
    "client_id",
    "redirect_uri",
    "response_type",
    "state",
    "code_challenge",
    "code_challenge_method",
  ]) {
    const val = body[key];
    if (val) search.set(key, String(val));
  }

  let params;
  try {
    params = parseAuthorizeParams(search);
  } catch {
    throw new AuthError("Invalid authorize request", 400, "invalid_request");
  }

  const tenantWorkspace = isMultiTenantEnabled()
    ? await getResolvedTenantWorkspace()
    : null;

  await validateOAuthClient(
    params.client_id,
    params.redirect_uri,
    tenantWorkspace?._id.toString()
  );

  const subject = await getOAuthSubjectFromRefreshCookie(
    tenantWorkspace?._id.toString()
  );
  if (!subject) {
    throw new AuthError("Not signed in", 401, "login_required");
  }

  const redirectUrl = await completeAuthorization(subject, params);
  return jsonOk({ redirectUrl });
});
