import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { createProject, listProjects } from "@/lib/project-store";

export async function GET(request: Request) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const projects = listProjects(result.user.sub);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project = createProject(result.user.sub, {
    name,
    description:
      typeof body.description === "string" ? body.description : undefined,
  });

  return NextResponse.json({ project }, { status: 201 });
}
