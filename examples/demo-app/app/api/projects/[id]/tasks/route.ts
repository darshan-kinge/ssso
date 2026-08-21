import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { addTask, getProject } from "@/lib/project-store";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const { id } = await context.params;
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const task = addTask(result.user.sub, id, title);
  if (!task) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = getProject(result.user.sub, id)!;
  return NextResponse.json({ task, project }, { status: 201 });
}
