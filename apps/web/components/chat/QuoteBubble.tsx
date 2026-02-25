"use client";

import { useRouter } from "next/navigation";
import type { ScopingQuoteData } from "@/lib/types";

interface QuoteBubbleProps {
  quoteData: ScopingQuoteData;
  sessionId: string;
}

const TIER_LABEL: Record<string, { label: string; color: string }> = {
  tier1: { label: "Guaranteed Price", color: "text-green-700 bg-green-50 border-green-200" },
  tier2: { label: "Most Likely Price", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  tier3: { label: "Estimated Price",   color: "text-gray-600 bg-gray-50 border-gray-200" },
};

export function QuoteBubble({ quoteData, sessionId }: QuoteBubbleProps) {
  const router = useRouter();
  const tier = TIER_LABEL[quoteData.confidence_tier] ?? TIER_LABEL.tier1;
  const price = Math.round(quoteData.final_price_cents / 100);

  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
        HB
      </div>

      {/* Card */}
      <div className="max-w-[80%] bg-white border-2 border-blue-500 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
        {/* Header strip */}
        <div className="bg-blue-600 px-4 py-2">
          <p className="text-white text-xs font-semibold tracking-wide uppercase">
            Your Quote is Ready
          </p>
        </div>

        <div className="px-4 py-3">
          {/* Service name */}
          <p className="text-sm font-semibold text-gray-900 mb-1">{quoteData.job_name}</p>

          {/* Price row */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-blue-700">${price}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tier.color}`}>
              {tier.label}
            </span>
          </div>

          {/* Duration */}
          <p className="text-xs text-gray-400 mb-3">~{quoteData.estimated_duration_min} min · No surprise bills.</p>

          {/* CTA */}
          <button
            onClick={() => router.push(`/quote/${sessionId}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Book this job
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
