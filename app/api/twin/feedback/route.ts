import { NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  conversationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = feedbackSchema.parse(await request.json());

    // Feedback is intentionally console-logged for now; storage will be added in a later phase.
    console.info("[twin-feedback]", JSON.stringify(payload));

    return NextResponse.json({
      status: "ok",
      message: "Feedback received.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "error",
          code: "invalid_payload",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        code: "internal_error",
      },
      { status: 500 }
    );
  }
}
