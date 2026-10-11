import { NextRequest, NextResponse } from "next/server";
import { put, BlobPreconditionFailedError } from "@vercel/blob";
import { createHmac } from "node:crypto";
import { deliverRegistration } from "@/lib/registration-notifications";
export const runtime = "nodejs";
export const maxDuration = 30;
const maxBytes = 12000;
const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length <= max ? value.trim() : "";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = new Set(["https://getgolocal.com", "https://www.getgolocal.com", request.nextUrl.origin]);
  if (process.env.NODE_ENV === "development") { allowedOrigins.add("http://127.0.0.1:3000"); allowedOrigins.add("http://localhost:3000"); }
  if (process.env.VERCEL_URL) allowedOrigins.add(`https://${process.env.VERCEL_URL}`);
  if (origin && !allowedOrigins.has(origin)) return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "JSON required." }, { status: 415 });
  if (Number(request.headers.get("content-length") || 0) > maxBytes) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > maxBytes) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
  } catch { return NextResponse.json({ error: "Invalid registration." }, { status: 400 }); }
  if (body.company_fax) return NextResponse.json({ error: "Please try again." }, { status: 400 });
  const type = text(body.type, 20), name = text(body.name, 100), email = text(body.email, 254).toLowerCase(), company = text(body.company, 150);
  const category = text(body.category, 100), location = text(body.location, 200), software = text(body.software, 200), useCase = text(body.use_case, 2000), website = text(body.website, 300);
  if (!["business", "agent", "partner"].includes(type) || !name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.consent !== "yes" || (type === "business" && (!category || !location)) || (type !== "business" && !useCase)) return NextResponse.json({ error: "Please complete the required fields and consent checkbox." }, { status: 400 });
  if (website) { try { const url = new URL(website.includes("://") ? website : `https://${website}`); if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid"); } catch { return NextResponse.json({ error: "Please enter a valid company website." }, { status: 400 }); } }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !process.env.RESEND_API_KEY) return NextResponse.json({ error: "Registration is temporarily unavailable. Please contact our team." }, { status: 503 });
  const details = { type, name, email, company, website, category, location, software, use_case: useCase, consent: true, consent_version: "2026-10-11", source: "getgolocal.com" };
  // Identical retries are deduplicated; changed details produce a new notification.
  // HMAC prevents guessing personal information from storage names.
  const key = createHmac("sha256", token).update(JSON.stringify(details)).digest("hex");
  const pathname = `registrations/v2/${type}/${key}.json`;
  let created = true;
  try {
    await put(pathname, JSON.stringify({ ...details, created_at: new Date().toISOString() }), { access: "private", token, addRandomSuffix: false, allowOverwrite: false, contentType: "application/json" });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || (error instanceof Error && /already exists/i.test(error.message))) created = false;
    else {
      console.error("Registration storage failed", error instanceof Error ? error.name : "UnknownError");
      return NextResponse.json({ error: "We couldn’t save your registration. Please try again." }, { status: 503 });
    }
  }
  try { await deliverRegistration(pathname); }
  catch { console.error("Registration saved; email pending automatic retry"); }
  return NextResponse.json({ success: true }, { status: created ? 201 : 200 });
}
