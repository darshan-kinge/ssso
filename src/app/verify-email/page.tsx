import { Suspense } from "react";
import { VerifyEmailContent } from "@/components/auth/VerifyEmailContent";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
