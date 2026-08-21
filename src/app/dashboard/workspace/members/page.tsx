import { redirect } from "next/navigation";

// Unified routing: all dashboard views live at /dashboard?tab=<name>
export default function WorkspaceMembersPage() {
  redirect("/dashboard?tab=members");
}
