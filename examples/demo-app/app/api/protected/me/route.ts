import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  const result = requireUser(request);
  if (result instanceof NextResponse) return result;

  return NextResponse.json({
    message: "Verified with @oneauth/node",
    user: result.user,
  });
}
