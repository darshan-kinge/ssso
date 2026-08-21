"use client";

import { useState } from "react";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-semibold transition-all duration-150 ${
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
      }`}
    >
      {copied ? "✓ Copied!" : label}
    </button>
  );
}
