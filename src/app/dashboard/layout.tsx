import { redirect } from "next/navigation";
import { getRefreshCookie } from "@/lib/auth/cookies";
import { DashboardLayoutShell } from "./DashboardLayoutShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect all dashboard routes on the server side
  const token = await getRefreshCookie("platform");
  if (!token) {
    redirect("/login");
  }

  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}
