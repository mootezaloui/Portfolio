import { NextResponse } from "next/server";

import { buildAgentProjects } from "@/lib/agents/profile";
import { parseRoleLens } from "@/lib/lens/roleLens";

export function GET(request: Request) {
  const lens = parseRoleLens(new URL(request.url).searchParams.get("lens"));
  return NextResponse.json(buildAgentProjects(lens));
}
