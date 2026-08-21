import { redirect } from "next/navigation";

export default function LegacyAppsPage() {
  redirect("/dashboard?tab=apps");
}
