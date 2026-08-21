import { redirect } from "next/navigation";

// Unified routing: all dashboard views live at /dashboard?tab=<name>
export default function WorkspaceUsersPage() {
  redirect("/dashboard?tab=users");
}
