"use client";

import { useRouter } from "next/navigation";
import type { ScopingQuoteData } from "@/lib/types";

interface QuoteBubbleProps {
  quoteData: ScopingQuoteData;
  sessionId: string;
}

const TIER_LABEL: Record<string, { label: string; color: string }> = {
  tier1: { label: "Guaranteed Price", color: "text-green bg-green/10 border-green/30" },
  tier2: { label: "Most Likely Price", color: "text-amber bg-amber-light border-amber/30" },
  tier3: { label: "Estimated Price", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

export function QuoteBubble({ quoteData, sessionId }: QuoteBubbleProps) {
  const router = useRouter();
  const tier = TIER_LABEL[quoteData.confidence_tier] ?? TIER_LABEL.tier1;
  const price = Math.round(quoteData.final_price_cents / 100);
  const confidence = quoteData.confidence_tier === "tier1" ? "92" : quoteData.confidence_tier === "tier2" ? "70" : "45";

  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0 text-amber text-xs font-bold">
        HB
      </div>

      {/* Card */}
      <div className="max-w-[85%] bg-white border-2 border-navy/20 rounded-2xl rounded-tl-sm shadow-md overflow-hidden">
        {/* Header strip */}
        <div className="bg-navy px-4 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-green" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <p className="text-white text-xs font-semibold tracking-wide uppercase">
            Issue Identified
          </p>
        </div>

        <div className="px-4 py-3">
          {/* Job code + name */}
          <p className="text-xs text-gray-400 font-mono mb-0.5">{quoteData.job_code}</p>
          <p className="text-sm font-bold text-navy mb-2">{quoteData.job_name}</p>

          {/* Price row */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-navy">${price}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tier.color}`}>
              {tier.label}
            </span>
          </div>

          {/* Confidence + duration */}
          <p className="text-xs text-gray-400 mb-4">{confidence}% confidence · ~{quoteData.estimated_duration_min} min</p>

          {/* CTA */}
          <button
            onClick={() => router.push(`/quote/${sessionId}`)}
            className="w-full bg-amber hover:bg-amber/90 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            See Your Quote
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
