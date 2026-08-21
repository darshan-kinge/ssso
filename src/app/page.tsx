import Link from "next/link";
import { getPublicConfig } from "@/lib/config";

export default function HomePage() {
  const { app, urls, deployment } = getPublicConfig();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-indigo-600">
              {app.name}
            </span>
            {deployment.saas && (
              <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider">
                SaaS Edition
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/status"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Status
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="mx-auto max-w-4xl px-6 py-20 flex-grow flex flex-col justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {deployment.saas
              ? "Multi-tenant single sign-on for your SaaS applications"
              : app.tagline}
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
            {deployment.saas
              ? "Create a developer workspace with its own dedicated subdomain, manage OAuth client configurations from a clean central dashboard, and isolate end-user sessions."
              : app.description}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-md hover:bg-indigo-500 hover:shadow-lg active:scale-98 transition-all duration-150"
            >
              Create Account
            </Link>
            {deployment.saas ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950 transition-all duration-150"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/apps"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950 transition-all duration-150"
              >
                Manage My Apps
              </Link>
            )}
          </div>
        </div>

        {/* Multi-Tenant Features Grid */}
        {deployment.saas && (
          <div className="mt-20">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
              Developer Workflow
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                  01
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">Custom Subdomains</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Instantly provision a workspace with a tenant subdomain.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                  02
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">OAuth Credentials</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Create apps, manage scopes, redirect URLs, and rotate client secrets.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                  03
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">Isolated Tenants</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Users sign in securely on dedicated tenant scopes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>
            {deployment.saas ? "Platform URL" : "Auth URL"}:{" "}
            <code className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-700">
              {deployment.saas ? urls.platformBase : urls.authBase}
            </code>
          </p>
          <p>
            Branding configured in{" "}
            <code className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-700">
              ssso.config.ts
            </code>
          </p>
        </div>
      </footer>
    </main>
  );
}
