import { Suspense } from "react";
import { ResetPasswordContent } from "@/components/auth/ResetPasswordContent";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
