import { NextResponse } from "next/server";
import { continueSession } from "@/lib/scoping-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "BAD_REQUEST", message: "message is required" } },
        { status: 400 }
      );
    }

    const result = await continueSession(sessionId, message);

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    if (errorMessage === "Session not found") {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    console.error("[scoping/message] Error:", err);
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to process message" } },
      { status: 500 }
    );
  }
}
