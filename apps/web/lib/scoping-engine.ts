import Anthropic from "@anthropic-ai/sdk";
import { buildScopingSystemPrompt } from "./scoping-prompt";
import { JOB_CODES } from "./job-codes";
import type { ScopingQuoteData } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

interface ClassificationResult {
  job_code: string;
  confidence: number;
  reasoning: string;
  diagnosis_summary: string;
  adjustment_flags: {
    old_home: boolean;
    accessibility: boolean;
    after_hours: boolean;
    weekend: boolean;
    same_day: boolean;
    evening: boolean;
  };
}

export interface SessionData {
  id: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  isClassified: boolean;
  classification: ClassificationResult | null;
  createdAt: number;
}

export interface ScopingResult {
  session_id: string;
  message: string;
  is_classified: boolean;
  quote?: ScopingQuoteData;
}

// ── In-memory session store ──────────────────────────────────────────────────

const sessions = new Map<string, SessionData>();

// Clean up sessions older than 2 hours (prevent memory leak on Vercel)
function cleanupSessions() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.createdAt < twoHoursAgo) sessions.delete(id);
  }
}

// ── Anthropic client (lazy singleton) ────────────────────────────────────────

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// ── Classification detector ──────────────────────────────────────────────────

const VALID_CODES = new Set(JOB_CODES.map((jc) => jc.code));

function detectClassification(text: string): ClassificationResult | null {
  // Look for JSON block in code fences or raw JSON with "classification": true
  const patterns = [
    /```(?:json)?\s*\n?(\{[\s\S]*?"classification"\s*:\s*true[\s\S]*?\})\s*\n?```/,
    /(\{"classification"\s*:\s*true[^}]*\})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    try {
      const parsed = JSON.parse(match[1]);

      if (
        parsed.classification === true &&
        typeof parsed.job_code === "string" &&
        VALID_CODES.has(parsed.job_code) &&
        typeof parsed.confidence === "number" &&
        parsed.confidence >= 0 &&
        parsed.confidence <= 100 &&
        typeof parsed.adjustment_flags === "object"
      ) {
        return {
          job_code: parsed.job_code,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning || "",
          diagnosis_summary: parsed.diagnosis_summary || "",
          adjustment_flags: {
            old_home: Boolean(parsed.adjustment_flags.old_home),
            accessibility: Boolean(parsed.adjustment_flags.accessibility),
            after_hours: Boolean(parsed.adjustment_flags.after_hours),
            weekend: Boolean(parsed.adjustment_flags.weekend),
            same_day: Boolean(parsed.adjustment_flags.same_day),
            evening: Boolean(parsed.adjustment_flags.evening),
          },
        };
      }
    } catch {
      // JSON parse failed, try next pattern
    }
  }

  return null;
}

/** Strip the JSON classification block from the message so the user sees clean text */
function stripClassificationBlock(text: string): string {
  return text
    .replace(/```(?:json)?\s*\n?\{[\s\S]*?"classification"\s*:\s*true[\s\S]*?\}\s*\n?```/g, "")
    .replace(/\{"classification"\s*:\s*true[^}]*\}/g, "")
    .trim();
}

/** Get confidence tier from score */
function getConfidenceTier(confidence: number): "tier1" | "tier2" | "tier3" {
  if (confidence >= 75) return "tier1";
  if (confidence >= 50) return "tier2";
  return "tier3";
}

/** Build ScopingQuoteData from a classification result */
function buildQuoteData(classification: ClassificationResult): ScopingQuoteData | null {
  const jobCode = JOB_CODES.find((jc) => jc.code === classification.job_code);
  if (!jobCode) return null;

  let priceCents = jobCode.base_price_cents;
  const breakdown: Array<{ label: string; amount_cents: number }> = [
    { label: "Base service", amount_cents: jobCode.base_price_cents },
  ];

  // Multiplier: old_home ×1.15
  if (classification.adjustment_flags.old_home) {
    const adj = Math.ceil(jobCode.base_price_cents * 0.15);
    priceCents += adj;
    breakdown.push({ label: "Older home adjustment", amount_cents: adj });
  }

  // Flat add: accessibility +$25
  if (classification.adjustment_flags.accessibility) {
    priceCents += 2500;
    breakdown.push({ label: "Limited access", amount_cents: 2500 });
  }

  // Timing surcharges — don't stack, use the highest one
  const timingSurcharges = [
    { flag: "after_hours" as const, label: "After-hours service", cents: 4500 },
    { flag: "same_day" as const, label: "Same-day service", cents: 3500 },
    { flag: "evening" as const, label: "Evening service", cents: 3000 },
    { flag: "weekend" as const, label: "Weekend service", cents: 2500 },
  ];

  const activeTiming = timingSurcharges
    .filter((s) => classification.adjustment_flags[s.flag])
    .sort((a, b) => b.cents - a.cents);

  if (activeTiming.length > 0) {
    const highest = activeTiming[0];
    priceCents += highest.cents;
    breakdown.push({ label: highest.label, amount_cents: highest.cents });
  }

  return {
    job_code: jobCode.code,
    job_name: jobCode.name,
    final_price_cents: priceCents,
    confidence_tier: getConfidenceTier(classification.confidence),
    estimated_duration_min: jobCode.estimated_duration_min,
    price_breakdown: breakdown,
  };
}

// ── Generate a simple session ID ─────────────────────────────────────────────

function generateId(): string {
  return `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function startSession(initialMessage: string): Promise<ScopingResult> {
  cleanupSessions();

  const id = generateId();
  const session: SessionData = {
    id,
    messages: [{ role: "user", content: initialMessage }],
    isClassified: false,
    classification: null,
    createdAt: Date.now(),
  };

  const systemPrompt = buildScopingSystemPrompt();
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: initialMessage }],
  });

  const assistantText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Check if Claude classified on the very first message (rare but possible)
  const classification = detectClassification(assistantText);
  const cleanMessage = stripClassificationBlock(assistantText);

  session.messages.push({ role: "assistant", content: assistantText });

  if (classification) {
    session.isClassified = true;
    session.classification = classification;
  }

  sessions.set(id, session);

  const result: ScopingResult = {
    session_id: id,
    message: cleanMessage,
    is_classified: session.isClassified,
  };

  if (classification) {
    result.quote = buildQuoteData(classification) ?? undefined;
  }

  return result;
}

export async function continueSession(
  sessionId: string,
  userMessage: string
): Promise<ScopingResult> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  // Allow 2-3 follow-up questions after classification
  session.messages.push({ role: "user", content: userMessage });

  const systemPrompt = buildScopingSystemPrompt();
  const anthropic = getClient();

  // Build messages for Claude (only user/assistant turns)
  // Strip classification JSON from history so Claude doesn't get confused
  const claudeMessages = session.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.role === "assistant" ? stripClassificationBlock(m.content) : m.content,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const assistantText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const classification = detectClassification(assistantText);
  const cleanMessage = stripClassificationBlock(assistantText);

  session.messages.push({ role: "assistant", content: assistantText });

  if (classification) {
    session.isClassified = true;
    session.classification = classification;
  }

  sessions.set(sessionId, session);

  const result: ScopingResult = {
    session_id: sessionId,
    message: cleanMessage,
    is_classified: session.isClassified,
  };

  if (classification) {
    result.quote = buildQuoteData(classification) ?? undefined;
  }

  return result;
}

export function getSession(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId);
}
