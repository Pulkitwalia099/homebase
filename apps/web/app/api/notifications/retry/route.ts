import { list } from "@vercel/blob";
import { deliverRegistration } from "@/lib/registration-notifications";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let cursor: string | undefined;
  let sent = 0, pending = 0;
  const started = Date.now();
  do {
    const page = await list({ prefix: "registrations/v2/", cursor, limit: 100 });
    for (const blob of page.blobs) {
      try { if (await deliverRegistration(blob.pathname) === "sent") sent++; }
      catch { pending++; }
      if (Date.now() - started > 45000) return Response.json({ sent, pending, scan_incomplete: true });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return Response.json({ sent, pending });
}
