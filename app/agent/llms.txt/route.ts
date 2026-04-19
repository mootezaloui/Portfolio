import { buildLlmsTxt } from "@/lib/agents/profile";
import { parseRoleLens } from "@/lib/lens/roleLens";

export function GET(request: Request) {
  const lens = parseRoleLens(new URL(request.url).searchParams.get("lens"));
  const body = buildLlmsTxt(lens);

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
