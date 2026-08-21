import { redirect } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { getRefreshCookie } from "@/lib/auth/cookies";
import { SaasDashboard } from "@/components/dashboard/SaasDashboard";

export default async function DashboardPage() {
  const { deployment } = getPublicConfig();

  if (!deployment.saas) {
    redirect("/apps");
  }

  // Redirect to login if unauthenticated (layout also guards, belt-and-suspenders)
  const token = await getRefreshCookie("platform");
  if (!token) {
    redirect("/login");
  }

  return <SaasDashboard />;
}
