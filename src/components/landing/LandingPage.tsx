"use client";

import Link from "next/link";
import { useState } from "react";

interface LandingConfig {
  app: { name: string; tagline: string; description: string; supportEmail?: string };
  urls: { authBase: string; platformBase?: string };
  deployment: { tenantDomainSuffix: string; saas: boolean };
}

const FEATURES = [
  {
    icon: "⬡",
    title: "Multi-Tenant SSO",
    desc: "Every workspace gets its own subdomain with isolated users, sessions, and OAuth clients — out of the box.",
    accent: "#FFD93D",
  },
  {
    icon: "⬡",
    title: "PKCE & OAuth 2.0",
    desc: "Industry-standard authorization code flow with PKCE enforcement for public clients. No shortcuts.",
    accent: "#FF6B6B",
  },
  {
    icon: "⬡",
    title: "Custom Branding",
    desc: "White-label auth pages per workspace — logo, colors, typography, background. Your product, your look.",
    accent: "#C4B5FD",
  },
  {
    icon: "⬡",
    title: "Team Collaboration",
    desc: "Invite team members with role-based access (owner, admin, member) and manage them per workspace.",
    accent: "#FFD93D",
  },
  {
    icon: "⬡",
    title: "Audit Logs",
    desc: "Tamper-evident audit trail for logins, token issuance, and admin actions. Compliance ready.",
    accent: "#FF6B6B",
  },
  {
    icon: "⬡",
    title: "Open Source SDK",
    desc: "Drop-in React and Node.js SDKs. Self-host on your infrastructure, keep full control of your data.",
    accent: "#C4B5FD",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your workspace",
    desc: "Sign up and provision a workspace with your own auth subdomain in under 2 minutes.",
  },
  {
    num: "02",
    title: "Register your apps",
    desc: "Add OAuth clients — SPAs, mobile apps, or server apps — and configure redirect URIs.",
  },
  {
    num: "03",
    title: "Send users to your domain",
    desc: "Point your apps to your tenant URL. Users sign in on your branded auth page, tokens come back to you.",
  },
];

const PRICING = [
  {
    plan: "Starter",
    price: "Free",
    note: "Forever",
    accent: "#FFD93D",
    features: [
      "1 workspace",
      "Up to 3 OAuth apps",
      "1,000 MAU",
      "Custom branding",
      "PKCE + OAuth 2.0",
      "Community support",
    ],
    cta: "Get started free",
    href: "/signup",
    primary: false,
  },
  {
    plan: "Pro",
    price: "₹999",
    note: "per month",
    accent: "#FF6B6B",
    features: [
      "Unlimited workspaces",
      "Unlimited OAuth apps",
      "Unlimited MAU",
      "Custom branding per workspace",
      "Audit logs & retention",
      "Team collaboration",
      "Priority email support",
    ],
    cta: "Start Pro trial",
    href: "/signup?plan=pro",
    primary: true,
  },
];

export function LandingPage({ config }: { config: LandingConfig }) {
  const { app, deployment } = config;
  const appUrl = config.urls.platformBase ?? config.urls.authBase;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFDF5] font-[Space_Grotesk,system-ui,sans-serif]">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b-2 border-black bg-[#FFFDF5]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-black uppercase tracking-tight text-black">
            {app.name}
          </span>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-bold text-black/70">
            <a href="#features" className="hover:text-black transition">Features</a>
            <a href="#how-it-works" className="hover:text-black transition">How it works</a>
            <a href="#pricing" className="hover:text-black transition">Pricing</a>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href={`${appUrl}/login`}
              className="text-sm font-bold text-black/70 hover:text-black transition px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href={`${appUrl}/signup`}
              className="border-2 border-black bg-[#FFD93D] px-4 py-1.5 text-sm font-black text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#FF6B6B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
            >
              Get started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden border-2 border-black bg-white px-2 py-1 font-black text-xs uppercase"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t-2 border-black bg-[#FFFDF5] px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm font-bold" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm font-bold" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="block text-sm font-bold" onClick={() => setMenuOpen(false)}>Pricing</a>
            <div className="flex gap-3 pt-2 border-t border-black/10">
              <Link href={`${appUrl}/login`} className="text-sm font-bold underline">Sign in</Link>
              <Link href={`${appUrl}/signup`} className="border-2 border-black bg-[#FFD93D] px-3 py-1 text-sm font-black">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b-2 border-black bg-[#FFFDF5]">
        {/* Grid bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right,rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,.04) 1px,transparent 1px)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-[#C4B5FD] px-3 py-1 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase tracking-widest text-black">
                Open-source · Self-hostable · OAuth 2.0
              </span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight text-black leading-[0.95] mb-6">
              Auth infra
              <br />
              <span className="bg-[#FFD93D] border-b-4 border-black px-1">for your SaaS.</span>
            </h1>

            <p className="text-lg sm:text-xl font-medium text-black/70 max-w-2xl leading-relaxed mb-10">
              Give every workspace its own branded SSO subdomain. Register OAuth apps, manage teams, and ship auth in hours — not weeks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`${appUrl}/signup`}
                className="inline-block border-2 border-black bg-[#FF6B6B] px-8 py-3 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFD93D] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 text-center"
              >
                Start for free →
              </Link>
              <a
                href="#how-it-works"
                className="inline-block border-2 border-black bg-white px-8 py-3 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#C4B5FD] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 text-center"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Code card */}
          <div className="mt-16 border-2 border-black bg-[#0F1117] shadow-[6px_6px_0px_0px_#000] max-w-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] border border-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD93D] border border-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#A8E6CF] border border-white/20" />
              <span className="ml-2 text-[10px] font-mono text-white/30">oauth-flow.ts</span>
            </div>
            <pre className="p-5 text-[11px] sm:text-xs font-mono leading-relaxed overflow-x-auto text-left">
              <code>
                <span className="text-[#C4B5FD]">{"// Your app redirects users to your tenant auth URL\n"}</span>
                <span className="text-white">{"const authUrl = "}</span>
                <span className="text-[#FFD93D]">{`"https://acme.${deployment.tenantDomainSuffix}/authorize"\n`}</span>
                <span className="text-white">{"  + "}</span>
                <span className="text-[#A8E6CF]">{"\"?client_id=\" + clientId\n"}</span>
                <span className="text-white">{"  + "}</span>
                <span className="text-[#A8E6CF]">{"\"&redirect_uri=\" + redirectUri\n"}</span>
                <span className="text-white">{"  + "}</span>
                <span className="text-[#A8E6CF]">{"\"&code_challenge=\" + pkceChallenge;\n\n"}</span>
                <span className="text-[#C4B5FD]">{"// User signs in → you get back a short-lived code\n"}</span>
                <span className="text-white">{"const { access_token } = await "}</span>
                <span className="text-[#FF6B6B]">{"exchangeCode"}</span>
                <span className="text-white">{"(code, verifier);"}</span>
              </code>
            </pre>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap gap-3">
            {["OAuth 2.0", "PKCE", "JWT", "Space Grotesk UI", "Open Source"].map((b) => (
              <span
                key={b}
                className="border border-black/30 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black/60"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="border-b-2 border-black bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Everything you need</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Built for production.
              <br />
              <span className="text-black/40">No compromises.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group border-2 border-black bg-[#FFFDF5] p-6 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all duration-150"
              >
                <div
                  className="mb-4 w-10 h-10 flex items-center justify-center border-2 border-black text-lg font-black"
                  style={{ backgroundColor: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-black mb-2">{f.title}</h3>
                <p className="text-sm font-medium text-black/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-b-2 border-black bg-[#FFFDF5]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Simple setup</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Ship auth in 3 steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-black/10 z-0 -translate-x-4" />
                )}
                <div className="relative border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-black text-sm font-black mb-4"
                    style={{ backgroundColor: ["#FFD93D", "#FF6B6B", "#C4B5FD"][i] }}
                  >
                    {s.num}
                  </span>
                  <h3 className="text-base font-black uppercase tracking-tight text-black mb-2">{s.title}</h3>
                  <p className="text-sm font-medium text-black/60 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Domain example */}
          <div className="mt-12 border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000] max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-3">Your tenant auth URL</p>
            <code className="text-sm font-mono font-bold text-black">
              https://
              <span className="bg-[#FFD93D] border border-black px-1">your-workspace</span>
              .{deployment.tenantDomainSuffix}
            </code>
            <p className="mt-2 text-xs font-medium text-black/50">
              Fully isolated, custom-branded, ready for your users.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" className="border-b-2 border-black bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Simple pricing</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              No surprises.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
            {PRICING.map((p) => (
              <div
                key={p.plan}
                className="border-2 border-black bg-[#FFFDF5] p-8 shadow-[4px_4px_0px_0px_#000] flex flex-col"
                style={p.primary ? { backgroundColor: "#FFFDF5", borderWidth: "3px" } : {}}
              >
                <div
                  className="inline-block border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider mb-4 self-start"
                  style={{ backgroundColor: p.accent }}
                >
                  {p.plan}
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-black text-black">{p.price}</span>
                  <span className="ml-2 text-sm font-bold text-black/50">{p.note}</span>
                </div>
                <ul className="mt-6 space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-medium text-black/70">
                      <span className="text-black font-black mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className="mt-8 block border-2 border-black py-2.5 text-center text-sm font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
                  style={{ backgroundColor: p.accent }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs font-bold text-black/40">
            All plans include self-hosting option. No per-seat pricing. No hidden fees.
          </p>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="border-b-2 border-black bg-[#FFD93D]">
        <div className="mx-auto max-w-6xl px-6 py-16 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Ready to ship auth?
            </h2>
            <p className="mt-1 text-sm font-bold text-black/60">
              Get a workspace live in under 5 minutes. No credit card required.
            </p>
          </div>
          <Link
            href={`${appUrl}/signup`}
            className="shrink-0 inline-block border-2 border-black bg-black px-8 py-3 text-sm font-black uppercase tracking-wider text-[#FFD93D] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-[#FF6B6B] hover:text-black active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100"
          >
            Create free workspace →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-[#FFFDF5] border-black">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <span className="text-base font-black uppercase tracking-tight text-black">{app.name}</span>
              <p className="mt-2 text-xs font-medium text-black/50 leading-relaxed max-w-[180px]">
                Open-source auth infrastructure for SaaS products.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-3">Product</p>
              <ul className="space-y-2">
                <li><a href="#features" className="text-xs font-bold text-black/60 hover:text-black transition">Features</a></li>
                <li><a href="#pricing" className="text-xs font-bold text-black/60 hover:text-black transition">Pricing</a></li>
                <li><Link href={`${appUrl}/status`} className="text-xs font-bold text-black/60 hover:text-black transition">Status</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-3">Account</p>
              <ul className="space-y-2">
                <li><Link href={`${appUrl}/signup`} className="text-xs font-bold text-black/60 hover:text-black transition">Sign up</Link></li>
                <li><Link href={`${appUrl}/login`} className="text-xs font-bold text-black/60 hover:text-black transition">Sign in</Link></li>
                <li><Link href={`${appUrl}/dashboard`} className="text-xs font-bold text-black/60 hover:text-black transition">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-3">Support</p>
              <ul className="space-y-2">
                {app.supportEmail && (
                  <li><a href={`mailto:${app.supportEmail}`} className="text-xs font-bold text-black/60 hover:text-black transition">{app.supportEmail}</a></li>
                )}
                <li><Link href={`${appUrl}/login`} className="text-xs font-bold text-black/60 hover:text-black transition">Developer docs</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t-2 border-black/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider">
              © {new Date().getFullYear()} {app.name}. Open source.
            </p>
            <p className="text-[10px] font-mono text-black/30">
              Powered by OAuth 2.0 + PKCE + JWT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
