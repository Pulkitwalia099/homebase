import { get, put, BlobNotFoundError } from "@vercel/blob";

export type Registration = {
  type: string; name: string; email: string; company: string; website: string;
  category: string; location: string; software: string; use_case: string;
  consent: boolean; consent_version: string; created_at: string; source: string;
};
const audiences: Record<string, string> = { business: "Business", agent: "Agent partner", partner: "Channel partner" };
export function notificationMessage(record: Registration) {
  const audience = audiences[record.type] || "Registration";
  return {
    from: "GoLocal <notifications@getgolocal.com>",
    to: ["pulkitwalia099@gmail.com"],
    reply_to: record.email,
    subject: `[GoLocal] ${audience} registration — ${record.company.replace(/[\r\n]/g, " ")}`,
    text: ["New registration on getgolocal.com", "", ...[
      ["Audience", audience], ["Name", record.name], ["Email", record.email],
      ["Company", record.company], ["Website", record.website], ["Service category", record.category],
      ["Location / coverage", record.location], ["Booking software", record.software],
      ["Partnership / use case", record.use_case], ["Consent", record.consent ? "Yes" : "No"],
      ["Consent version", record.consent_version], ["Submitted at (UTC)", record.created_at],
      ["Source", record.source],
    ].map(([label, value]) => `${label}: ${value || "Not provided"}`), "", "Reply to this email to contact the registrant."].join("\n"),
    headers: { Importance: "high", "X-Priority": "1" },
    tags: [{ name: "audience", value: record.type }],
  };
}

export async function readPrivateJson<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return await new Response(result.stream).json() as T;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

type DeliveryDependencies = {
  read: typeof readPrivateJson;
  markSent: (path: string, emailId: string) => Promise<void>;
  send: (record: Registration, id: string) => Promise<string>;
};
export async function sendRegistrationEmail(record: Registration, id: string, apiKey = process.env.RESEND_API_KEY, request = fetch) {
  if (!apiKey) throw new Error("EmailNotConfigured");
  const response = await request("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `golocal-registration/${id}` },
    body: JSON.stringify(notificationMessage(record)),
  });
  if (!response.ok) throw new Error(`EmailProviderStatus${response.status}`);
  const result = await response.json();
  if (typeof result.id !== "string") throw new Error("EmailProviderInvalidResponse");
  return result.id as string;
}
const defaults: DeliveryDependencies = {
  read: readPrivateJson,
  send: sendRegistrationEmail,
  async markSent(path, emailId) {
    await put(path, JSON.stringify({ email_id: emailId, sent_at: new Date().toISOString() }), {
      access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
    });
  },
};

// The immutable registration is the durable outbox. A receipt suppresses future sends.
// Resend's idempotency key also protects concurrent requests and short-term retries.
export async function deliverRegistration(pathname: string, dependencies = defaults) {
  const id = pathname.replace(/^registrations\/v2\//, "").replace(/\.json$/, "");
  const receipt = `registration-email-receipts/${id}.json`;
  if (await dependencies.read(receipt)) return "already-sent";
  const record = await dependencies.read<Registration>(pathname);
  if (!record) throw new Error("RegistrationNotFound");
  const emailId = await dependencies.send(record, id);
  await dependencies.markSent(receipt, emailId);
  return "sent";
}
