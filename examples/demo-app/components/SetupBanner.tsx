import { isConfigured } from "@/lib/config";

export function SetupBanner() {
  if (isConfigured()) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
      Copy <code className="rounded bg-black/30 px-1">.env.example</code> to{" "}
      <code className="rounded bg-black/30 px-1">.env.local</code> and register
      this app in OneAuth at{" "}
      <code className="rounded bg-black/30 px-1">/apps</code> with redirect{" "}
      <code className="rounded bg-black/30 px-1">
        http://localhost:3001/callback
      </code>
    </div>
  );
}
