import { getAuthenticatedPlatformUser } from "@/lib/auth/request";
import { findWorkspaceById, requireMembership } from "@/lib/workspace/service";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { Workspace } from "@/lib/models/Workspace";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z
    .object({
      logoUrl: z.string().url().or(z.literal("")).nullable().optional(),
      primaryColor: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .or(z.literal(""))
        .nullable()
        .optional(),
      themeType: z
        .enum(["neo-brutalist", "simple-bg", "custom-colors"])
        .optional(),
      backgroundImageUrl: z.string().url().or(z.literal("")).nullable().optional(),
      backgroundColor: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .or(z.literal(""))
        .nullable()
        .optional(),
      customCardBg: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .or(z.literal(""))
        .nullable()
        .optional(),
      customCardBorder: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .or(z.literal(""))
        .nullable()
        .optional(),
      customCardText: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .or(z.literal(""))
        .nullable()
        .optional(),
      customButtonBg: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .or(z.literal(""))
        .nullable()
        .optional(),
      customButtonText: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .or(z.literal(""))
        .nullable()
        .optional(),
      loginMode: z.enum(["open", "sso-only"]).optional(),
    })
    .optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id } = await context.params;
    const { user } = await getAuthenticatedPlatformUser(
      request.headers.get("authorization")
    );

    await requireMembership(user._id.toString(), id, "viewer");

    const ws = await findWorkspaceById(id);
    if (!ws) {
      throw new AuthError("Workspace not found", 404, "not_found");
    }

    return jsonOk({ workspace: ws });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id } = await context.params;
    const { user } = await getAuthenticatedPlatformUser(
      request.headers.get("authorization")
    );

    await requireMembership(user._id.toString(), id, "admin");

    const ws = await findWorkspaceById(id);
    if (!ws) {
      throw new AuthError("Workspace not found", 404, "not_found");
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    const { name, settings } = parsed.data;
    if (name !== undefined) {
      ws.name = name.trim();
    }
    
    if (settings !== undefined) {
      ws.settings = {
        logoUrl: settings.logoUrl !== undefined ? (settings.logoUrl || null) : ws.settings?.logoUrl,
        primaryColor: settings.primaryColor !== undefined ? (settings.primaryColor || null) : ws.settings?.primaryColor,
        themeType: settings.themeType !== undefined ? (settings.themeType || "neo-brutalist") : (ws.settings?.themeType ?? "neo-brutalist"),
        backgroundImageUrl: settings.backgroundImageUrl !== undefined ? (settings.backgroundImageUrl || null) : ws.settings?.backgroundImageUrl,
        backgroundColor: settings.backgroundColor !== undefined ? (settings.backgroundColor || null) : ws.settings?.backgroundColor,
        customCardBg: settings.customCardBg !== undefined ? (settings.customCardBg || null) : ws.settings?.customCardBg,
        customCardBorder: settings.customCardBorder !== undefined ? (settings.customCardBorder || null) : ws.settings?.customCardBorder,
        customCardText: settings.customCardText !== undefined ? (settings.customCardText || null) : ws.settings?.customCardText,
        customButtonBg: settings.customButtonBg !== undefined ? (settings.customButtonBg || null) : ws.settings?.customButtonBg,
        customButtonText: settings.customButtonText !== undefined ? (settings.customButtonText || null) : ws.settings?.customButtonText,
        loginMode: settings.loginMode !== undefined ? settings.loginMode : (ws.settings?.loginMode ?? "open"),
      };
    }

    await Workspace.updateOne(
      { _id: ws._id },
      {
        $set: {
          name: ws.name,
          settings: ws.settings,
        },
      }
    );

    return jsonOk({
      workspace: {
        id: ws._id.toString(),
        slug: ws.slug,
        name: ws.name,
        plan: ws.plan,
        settings: ws.settings,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
