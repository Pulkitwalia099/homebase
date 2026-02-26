import { NextResponse } from "next/server";
import { startSession } from "@/lib/scoping-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initial_message } = body;

    if (!initial_message || typeof initial_message !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "BAD_REQUEST", message: "initial_message is required" } },
        { status: 400 }
      );
    }

    const result = await startSession(initial_message);

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    console.error("[scoping/start] Error:", err);
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to start scoping session" } },
      { status: 500 }
    );
  }
}
