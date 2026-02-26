import { NextResponse } from "next/server";
import { getSession } from "@/lib/scoping-engine";
import { JOB_CODES } from "@/lib/job-codes";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    if (!session.isClassified || !session.classification) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_CLASSIFIED", message: "Session not yet classified" } },
        { status: 400 }
      );
    }

    const cls = session.classification;
    const jobCode = JOB_CODES.find((jc) => jc.code === cls.job_code);

    if (!jobCode) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Job code not found" } },
        { status: 404 }
      );
    }

    // Calculate final price with adjustments
    let finalPriceCents = jobCode.base_price_cents;
    const priceBreakdown: Array<{ label: string; amount_cents: number }> = [
      { label: "Base service", amount_cents: jobCode.base_price_cents },
    ];

    if (cls.adjustment_flags.old_home) {
      const adjustment = Math.ceil(jobCode.base_price_cents * 0.25);
      finalPriceCents = Math.ceil(finalPriceCents * 1.25);
      priceBreakdown.push({ label: "Older home adjustment", amount_cents: adjustment });
    }
    if (cls.adjustment_flags.accessibility) {
      finalPriceCents += 4500;
      priceBreakdown.push({ label: "Limited access", amount_cents: 4500 });
    }
    if (cls.adjustment_flags.after_hours) {
      finalPriceCents += 7500;
      priceBreakdown.push({ label: "After-hours service", amount_cents: 7500 });
    }
    if (cls.adjustment_flags.weekend) {
      finalPriceCents += 6500;
      priceBreakdown.push({ label: "Weekend service", amount_cents: 6500 });
    }

    const confidenceTier =
      cls.confidence >= 75 ? "tier1" : cls.confidence >= 50 ? "tier2" : "tier3";

    const quoteData = {
      session_id: sessionId,
      job_code: {
        code: jobCode.code,
        name: jobCode.name,
        description: jobCode.description,
        estimated_duration_min: jobCode.estimated_duration_min,
        parts_included: jobCode.parts_included,
        category: jobCode.category,
      },
      quoted_price_cents: finalPriceCents,
      price_breakdown: priceBreakdown,
      whats_included: jobCode.includes,
      confidence_tier: confidenceTier,
      diagnosis_summary: cls.diagnosis_summary,
      adjustment_flags: cls.adjustment_flags,
    };

    return NextResponse.json({ data: quoteData, error: null });
  } catch (err) {
    console.error("[scoping/quote] Error:", err);
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to get quote" } },
      { status: 500 }
    );
  }
}
