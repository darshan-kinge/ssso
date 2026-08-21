import type React from "react";

interface ResolvedTheme {
  themeClass: string; // "theme-neo-brutalist" | "theme-simple" | "theme-custom"
  outerStyle: React.CSSProperties;
  cardClass: string;
}

export function resolveThemeSettings(settings?: {
  logoUrl?: string | null;
  primaryColor?: string | null;
  themeType?: string | null;
  backgroundImageUrl?: string | null;
  backgroundColor?: string | null;
  customCardBg?: string | null;
  customCardBorder?: string | null;
  customCardText?: string | null;
  customButtonBg?: string | null;
  customButtonText?: string | null;
} | null): ResolvedTheme {
  const themeType = settings?.themeType || "neo-brutalist";

  if (themeType === "simple-bg") {
    const outerStyle: React.CSSProperties = {
      "--tenant-primary": settings?.primaryColor || "#3B82F6",
      "--background": settings?.backgroundColor || "#F9FAFB",
      "--foreground": "#1F2937",
      "--border": "#E5E7EB",
      "--card": "#FFFFFF",
      "--accent": settings?.primaryColor || "#3B82F6",
      "--theme-font": "'Plus Jakarta Sans', system-ui, sans-serif",
    } as React.CSSProperties & { [key: string]: string };

    if (settings?.backgroundImageUrl) {
      outerStyle.backgroundImage = `url("${settings.backgroundImageUrl}")`;
      outerStyle.backgroundSize = "cover";
      outerStyle.backgroundPosition = "center";
    }

    return {
      themeClass: "theme-simple",
      outerStyle,
      cardClass: "auth-card w-full max-w-md p-8 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl",
    };
  }

  if (themeType === "custom-colors") {
    const outerStyle: React.CSSProperties = {
      "--tenant-primary": settings?.customButtonBg || settings?.primaryColor || "#3B82F6",
      "--background": settings?.backgroundColor || "#F9FAFB",
      "--foreground": settings?.customCardText || "#1F2937",
      "--border": settings?.customCardBorder || "#E5E7EB",
      "--card": settings?.customCardBg || "#FFFFFF",
      "--accent": settings?.customButtonBg || settings?.primaryColor || "#3B82F6",
      "--accent-text": settings?.customButtonText || "#FFFFFF",
      "--theme-font": "'Outfit', system-ui, sans-serif",
    } as React.CSSProperties & { [key: string]: string };

    if (settings?.backgroundImageUrl) {
      outerStyle.backgroundImage = `url("${settings.backgroundImageUrl}")`;
      outerStyle.backgroundSize = "cover";
      outerStyle.backgroundPosition = "center";
    }

    return {
      themeClass: "theme-custom",
      outerStyle,
      cardClass: "auth-card w-full max-w-md p-8 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl",
    };
  }

  // Default: modern simple SaaS theme
  const outerStyle: React.CSSProperties = {
    "--tenant-primary": settings?.primaryColor || "#4f46e5",
    "--theme-font": "'Inter', system-ui, sans-serif",
  } as React.CSSProperties & { [key: string]: string };

  return {
    themeClass: "theme-simple",
    outerStyle,
    cardClass: "auth-card w-full max-w-md p-8 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl",
  };
}
