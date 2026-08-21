"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth/api-client";
import { setStoredAccessToken } from "@/lib/auth/client";
import { getPublicConfig } from "@/lib/config";
import {
  buildTenantAuthUrl,
  buildTenantHostLabel,
} from "@/lib/workspace/tenant-url";
import {
  normalizeSlugInput,
  slugifyWorkspaceName,
} from "@/lib/workspace/slug-utils";

type SlugStatus = "idle" | "checking" | "available" | "unavailable";

export function WorkspaceOnboardingForm() {
  const router = useRouter();
  const { deployment, app } = getPublicConfig();
  const suffix = deployment.tenantDomainSuffix;

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugReason, setSlugReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    name: string;
    slug: string;
    tenantUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugifyWorkspaceName(name));
    }
  }, [name, slugTouched]);

  const checkSlug = useCallback(async (value: string) => {
    const normalized = normalizeSlugInput(value);
    if (normalized.length < 2) {
      setSlugStatus("idle");
      setSlugReason(null);
      return;
    }
    setSlugStatus("checking");
    const res = await authFetch(
      `/api/workspaces/check-slug?slug=${encodeURIComponent(normalized)}`
    );
    if (!res.ok) {
      setSlugStatus("unavailable");
      setSlugReason("Could not verify subdomain");
      return;
    }
    const data = await res.json();
    if (data.available) {
      setSlugStatus("available");
      setSlugReason(null);
    } else {
      setSlugStatus("unavailable");
      setSlugReason(data.reason ?? "Unavailable");
    }
  }, []);

  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus("idle");
      return;
    }
    const t = setTimeout(() => void checkSlug(slug), 400);
    return () => clearTimeout(t);
  }, [slug, checkSlug]);

  const previewHost =
    slug.length >= 2
      ? buildTenantHostLabel(slug, suffix)
      : `your-workspace.${suffix}`;
  const previewUrl =
    slug.length >= 2 ? buildTenantAuthUrl(slug, suffix) : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (slugStatus !== "available") {
      setError(slugReason ?? "Choose an available subdomain");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: normalizeSlugInput(slug),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create workspace");
        return;
      }

      const workspaceId = data.workspace.id as string;
      const activateRes = await authFetch(
        `/api/workspaces/${workspaceId}/activate`,
        { method: "POST" }
      );
      const activateData = await activateRes.json();
      if (!activateRes.ok) {
        setError(activateData.error ?? "Workspace created but activation failed");
        return;
      }

      if (activateData.accessToken) {
        setStoredAccessToken(activateData.accessToken);
      }
      localStorage.setItem("ssso_active_workspace", workspaceId);

      const tenantUrl = buildTenantAuthUrl(data.workspace.slug, suffix);
      setCreated({
        name: data.workspace.name,
        slug: data.workspace.slug,
        tenantUrl,
      });
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  // Step indicator helper
  const steps = [
    { n: 1, label: "Welcome" },
    { n: 2, label: "Subdomain" },
  ];

  if (step === 3 && created) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
            ✓ Workspace Ready
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{created.name}</h2>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
            Your users sign in at this tenant URL:
          </p>
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-800 select-all">
            {created.tenantUrl}
          </p>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
          Register OAuth apps on the platform dashboard, then point authorize
          requests to the tenant host above.
        </p>
        <button
          type="button"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
          className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Open dashboard →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step === s.n ? "text-indigo-700" : step > s.n ? "text-slate-400" : "text-slate-400"}`}>
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                step === s.n
                  ? "bg-indigo-600 text-white"
                  : step > s.n
                    ? "bg-slate-200 text-slate-500"
                    : "border-2 border-slate-200 text-slate-400"
              }`}>
                {step > s.n ? "✓" : s.n}
              </span>
              <span className={`text-xs font-semibold ${step === s.n ? "text-slate-900" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-slate-200 mx-1" />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Welcome to {app.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Let&apos;s set up your workspace to get started.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 leading-relaxed">
            Create a workspace to get a dedicated auth subdomain for your
            applications. You manage apps and team members on the platform
            dashboard; end users sign in on your tenant host.
          </div>
          <ul className="space-y-2">
            {[
              "Platform: register apps, secrets, and team",
              "Tenant: OAuth authorize + login for your users",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Create workspace →
          </button>
        </div>
      )}

      {step === 2 && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Name your workspace</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pick a display name and a unique subdomain.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Workspace name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Acme Corp"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Subdomain
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(normalizeSlugInput(e.target.value));
                  }}
                  required
                  placeholder="acme"
                  className="min-w-0 flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none font-medium"
                  aria-describedby="slug-hint"
                />
                <span className="shrink-0 text-slate-400 font-mono text-xs">.{suffix}</span>
              </div>
              <p id="slug-hint" className="mt-1.5 text-xs">
                {slugStatus === "checking" && <span className="text-slate-400">Checking availability…</span>}
                {slugStatus === "available" && (
                  <span className="text-emerald-600 font-semibold">✓ Subdomain is available</span>
                )}
                {slugStatus === "unavailable" && (
                  <span className="text-red-600 font-semibold">{slugReason}</span>
                )}
                {slugStatus === "idle" && slug.length > 0 && slug.length < 2 && (
                  <span className="text-slate-400">At least 2 characters</span>
                )}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 mb-1">
              Preview Host
            </p>
            <p className="font-mono text-sm text-slate-700 font-semibold select-all">{previewHost}</p>
            {previewUrl && (
              <p className="mt-0.5 break-all font-mono text-[11px] text-slate-400">
                {previewUrl}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !name.trim() ||
                slugStatus !== "available"
              }
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating…" : "Create workspace"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
