import { NextResponse } from "next/server";
import { z } from "zod";

import { parseRoleLens } from "@/lib/lens/roleLens";
import { runTwinChatTurn, TwinChatError } from "@/lib/twin/chat";

const requestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .optional(),
  roleLens: z.string().optional(),
});

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const forwardedIp = xForwardedFor.split(",").at(0)?.trim();
    return forwardedIp && forwardedIp.length > 0 ? forwardedIp : "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = requestSchema.parse(rawPayload);
    const ipAddress = getClientIp(request);

    const twinInput: Parameters<typeof runTwinChatTurn>[0] = {
      message: payload.message,
      ipAddress,
    };

    if (payload.conversationId) {
      twinInput.conversationId = payload.conversationId;
    }

    if (payload.history) {
      twinInput.history = payload.history;
    }
    if (payload.roleLens) {
      twinInput.roleLens = parseRoleLens(payload.roleLens);
    }

    const result = await runTwinChatTurn(twinInput);

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    if (error instanceof TwinChatError) {
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
