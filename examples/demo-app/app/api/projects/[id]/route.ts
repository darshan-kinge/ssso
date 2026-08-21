import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/project-store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const { id } = await context.params;
  const project = getProject(result.user.sub, id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, context: Ctx) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const { id } = await context.params;
  const body = await request.json();
  const project = updateProject(result.user.sub, id, {
    name: typeof body.name === "string" ? body.name : undefined,
    description:
      typeof body.description === "string" ? body.description : undefined,
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function DELETE(request: Request, context: Ctx) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const { id } = await context.params;
  if (!deleteProject(result.user.sub, id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
