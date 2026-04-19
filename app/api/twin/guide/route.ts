import { NextResponse } from "next/server";
import { z } from "zod";

import { runTwinGuideTurn, TwinGuideError } from "../../../../lib/twin/guide/chat";
import { MascotGuideRequestSchema } from "../../../../lib/twin/guide/contracts";

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = MascotGuideRequestSchema.parse(rawPayload);
    const result = await runTwinGuideTurn(payload);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TwinGuideError) {
      return NextResponse.json(
        {
          status: "error",
          code: error.code,
          message: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          code: "invalid_payload",
          message: "Request payload is invalid.",
          issues: error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        code: "internal_error",
        message,
      },
      {
        status: 500,
      }
    );
  }
}
