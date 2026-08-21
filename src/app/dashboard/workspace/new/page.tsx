import Link from "next/link";
import { redirect } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { getRefreshCookie } from "@/lib/auth/cookies";
import { WorkspaceOnboardingForm } from "@/components/workspace/WorkspaceOnboardingForm";

export default async function NewWorkspacePage() {
  const { deployment, app } = getPublicConfig();

  if (!deployment.saas) {
    redirect("/apps");
  }

  // Redirect to login if unauthenticated
  const token = await getRefreshCookie("platform");
  if (!token) {
    redirect("/login");
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-6">
      <div className="mb-8 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">Create Workspace</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Set up your {app.name} tenant subdomain and start building SSO.
        </p>
      </div>
      <div>
        <WorkspaceOnboardingForm />
      </div>
      <Link
        href="/dashboard"
        className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300 transition-colors"
      >
        ← Dashboard
      </Link>
    </main>
  );
}
