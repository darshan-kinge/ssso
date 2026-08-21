import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { deleteTask, toggleTask } from "@/lib/project-store";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const { id, taskId } = await context.params;
  const body = await request.json();
  const done = Boolean(body.done);

  const project = toggleTask(result.user.sub, id, taskId, done);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function DELETE(request: Request, context: Ctx) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const { id, taskId } = await context.params;
  const project = deleteTask(result.user.sub, id, taskId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}
