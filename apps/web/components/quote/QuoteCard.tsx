import type { QuoteData } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface QuoteCardProps {
  quote: QuoteData;
}

const TIER_COPY = {
  tier1: { label: "Guaranteed Price", variant: "green" as const, note: null },
  tier2: {
    label: "Most Likely Price",
    variant: "yellow" as const,
    note: "Pro will confirm on arrival if anything affects this.",
  },
  tier3: {
    label: "Estimated Price",
    variant: "gray" as const,
    note: "Final price confirmed after on-site assessment.",
  },
};

export function QuoteCard({ quote }: QuoteCardProps) {
  const tier = TIER_COPY[quote.confidence_tier];
  const priceDollars = (quote.quoted_price_cents / 100).toFixed(0);

  const whatsIncluded = [
    "Professional diagnosis",
    quote.job_code.parts_included ? "Standard parts included" : "Labor only (parts if needed quoted separately)",
    "Licensed & insured plumber",
    "30-day workmanship warranty",
  ];

  return (
    <Card padding="lg">
      {/* Service name */}
      <h2 className="text-xl font-bold text-gray-900 mb-1">{quote.job_code.name}</h2>
      <p className="text-sm text-gray-500 mb-6">{quote.job_code.description}</p>

      {/* Price — the hero */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6 text-center">
        <p className="text-sm text-blue-700 font-medium mb-1">
          <Badge label={tier.label} variant={tier.variant} />
        </p>
        <p className="text-5xl font-black text-blue-700 mt-3">${priceDollars}</p>
        <p className="text-sm text-blue-600 mt-1">No surprise bills. Ever.</p>
        {tier.note && (
          <p className="text-xs text-gray-500 mt-2 italic">{tier.note}</p>
        )}
      </div>

      {/* Price breakdown if adjustments applied */}
      {quote.price_breakdown.length > 1 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Breakdown</p>
          <div className="space-y-1">
            {quote.price_breakdown.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-gray-900">
                  +${(item.amount_cents / 100).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's included */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What's Included</p>
        <ul className="space-y-2">
          {whatsIncluded.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Duration */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Estimated time: ~{quote.job_code.estimated_duration_min} minutes
      </p>
    </Card>
  );
}
