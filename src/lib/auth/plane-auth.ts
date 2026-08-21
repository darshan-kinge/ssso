import { headers } from "next/headers";
import { loginUser, signupUser } from "@/lib/auth/service";
import { loginEndUser, signupEndUser } from "@/lib/end-user/service";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { HEADER_PLANE } from "@/lib/workspace/headers";
import { AuthError } from "./errors";
import type { LoginInput, SignupInput } from "@/lib/validators/auth";

async function resolveTenantWorkspace() {
  const { getResolvedTenantWorkspace } = await import(
    "@/lib/workspace/request-context"
  );
  const ws = await getResolvedTenantWorkspace();
  if (!ws) {
    throw new AuthError("Unknown tenant workspace", 404, "tenant_not_found");
  }
  return ws;
}

export async function signupForRequestPlane(
  input: SignupInput,
  device: string,
  oauthReturn?: string | null
) {
  if (!isMultiTenantEnabled()) {
    return signupUser(input, device, oauthReturn);
  }

  const h = await headers();
  const plane = h.get(HEADER_PLANE);

  if (plane === "tenant") {
    const workspace = await resolveTenantWorkspace();
    return signupEndUser(workspace, input, device, oauthReturn);
  }

  return signupUser(input, device, oauthReturn);
}


export async function loginForRequestPlane(input: LoginInput, device: string) {
  if (!isMultiTenantEnabled()) {
    return loginUser(input, device);
  }

  const h = await headers();
  const plane = h.get(HEADER_PLANE);

  if (plane === "tenant") {
    const workspace = await resolveTenantWorkspace();
    return loginEndUser(workspace, input, device);
  }

  return loginUser(input, device);
}
