import Link from "next/link";

const PREVIEW_ROWS = [
  { code: "PLM-101", name: "Drain Clearing (Single Fixture)", price: "$150", duration: "45 min" },
  { code: "PLM-201", name: "Faucet Repair / Replace", price: "$165", duration: "60 min" },
  { code: "PLM-301", name: "Toilet Repair", price: "$155", duration: "45 min" },
  { code: "PLM-401", name: "Water Heater Diagnostic", price: "$195", duration: "75 min" },
  { code: "PLM-501", name: "Garbage Disposal Install", price: "$225", duration: "60 min" },
  { code: "PLM-601", name: "Pipe Leak Repair (Accessible)", price: "$245", duration: "90 min" },
];

export default function TaxonomyPreview() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-warm-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-amber mb-3">
            Service Taxonomy
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy">
            Every job is a standard SKU.
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Healthcare has ICD-10. Payments has MCC codes.
            Home services had nothing. Until now.
          </p>
        </div>

        {/* Table */}
        <div className="mt-12 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3.5 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Code</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Service</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Price</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody>
              {PREVIEW_ROWS.map((row, i) => (
                <tr key={row.code} className={`border-b border-gray-50 last:border-b-0 ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                  <td className="py-3.5 px-5 font-mono text-amber font-medium text-sm">{row.code}</td>
                  <td className="py-3.5 px-5 text-navy font-medium">{row.name}</td>
                  <td className="py-3.5 px-5 text-navy">{row.price}</td>
                  <td className="py-3.5 px-5 text-gray-500">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-6 justify-center">
          <Link
            href="/taxonomy"
            className="text-sm font-medium text-navy hover:text-navy-light transition-colors underline underline-offset-4 decoration-amber"
          >
            Browse Full Taxonomy →
          </Link>
          <Link
            href="/developers"
            className="text-sm font-mono font-medium text-gray-500 hover:text-navy transition-colors"
          >
            GET /api/v1/taxonomy →
          </Link>
        </div>
      </div>
    </section>
  );
}
