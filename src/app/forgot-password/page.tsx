import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { getResolvedTenantWorkspace } from "@/lib/workspace/request-context";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const tenantWorkspace = isMultiTenantEnabled()
    ? await getResolvedTenantWorkspace()
    : null;

  return <ForgotPasswordForm tenantWorkspace={tenantWorkspace} />;
}
