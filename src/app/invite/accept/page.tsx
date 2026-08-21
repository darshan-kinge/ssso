import { Suspense } from "react";
import Link from "next/link";
import { AcceptInviteContent } from "@/components/workspace/AcceptInviteContent";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function AcceptInvitePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-lg px-6 py-16">
        <Suspense
          fallback={
            <p className="text-sm text-[var(--muted)]">Loading invitation…</p>
          }
        >
          <AcceptInviteContent />
        </Suspense>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          ← Home
        </Link>
      </main>
    </>
  );
}
