import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// In Next.js App Router, request.text() gives us the raw body directly —
// no need for the old `config = { api: { bodyParser: false } }` pattern.
// Raw body is required for Stripe's webhook signature verification.

function getStripeServer() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export async function POST(request: NextRequest) {
  let stripe: Stripe;
  try {
    stripe = getStripeServer();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text(); // Raw body string — needed for signature check
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Forward the event to FastAPI for processing
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";
  try {
    await fetch(`${apiUrl}/webhooks/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
      },
      body: JSON.stringify({ event_type: event.type, event_id: event.id, data: event.data }),
    });
  } catch {
    // Log but don't fail — Stripe will retry on non-200
    console.error("Failed to forward webhook to API:", event.type);
  }

  return NextResponse.json({ received: true });
}
