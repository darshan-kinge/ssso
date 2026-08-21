import { Suspense } from "react";
import { ResetPasswordContent } from "@/components/auth/ResetPasswordContent";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { getResolvedTenantWorkspace } from "@/lib/workspace/request-context";

export default async function ResetPasswordPage() {
  const tenantWorkspace = isMultiTenantEnabled()
    ? await getResolvedTenantWorkspace()
    : null;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <main className="w-full max-w-md rounded-none border-4 border-[var(--border)] bg-[var(--card)] p-8 shadow-[10px_10px_0px_0px_var(--border)] rotate-1 text-center">
            <p className="text-sm font-black uppercase tracking-wider text-[var(--foreground)] animate-pulse">Loading…</p>
          </main>
        </div>
      }
    >
      <ResetPasswordContent tenantWorkspace={tenantWorkspace} />
    </Suspense>
  );
}
