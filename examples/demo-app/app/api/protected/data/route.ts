import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  return NextResponse.json({
    message: "Sample protected resource",
    issuedFor: result.user.client_id,
    items: [
      { id: 1, name: "Alpha", owner: result.user.sub },
      { id: 2, name: "Beta", owner: result.user.sub },
    ],
    serverTime: new Date().toISOString(),
  });
}
