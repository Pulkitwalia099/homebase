"use client";

import { useState } from "react";
import Navbar from "../../components/marketing/Navbar";
import Footer from "../../components/marketing/Footer";
import ViewToggle from "../../components/marketing/ViewToggle";
import { JOB_CODES } from "../../lib/job-codes";

export default function TaxonomyPage() {
  const [viewMode, setViewMode] = useState<"human" | "machine">("human");
  const [search, setSearch] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const filtered = JOB_CODES.filter(
    (jc) =>
      jc.code.toLowerCase().includes(search.toLowerCase()) ||
      jc.name.toLowerCase().includes(search.toLowerCase()) ||
      jc.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      viewMode === "machine" ? "bg-dark" : "bg-warm-white"
    }`}>
      <Navbar variant={viewMode === "machine" ? "dark" : "light"} />

      <main className="pt-28 pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {viewMode === "human" ? (
            <>
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-navy">The HomeBase Service Taxonomy</h1>
                <p className="mt-3 text-lg text-navy-light max-w-2xl mx-auto">
                  Every job is a defined SKU — standardized scope, transparent pricing, clear deliverables.
                </p>
              </div>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by code, name, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-md mx-auto block px-4 py-2.5 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-cool-gray bg-white">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-cool-gray bg-cool-gray/50">
                      <th className="text-left py-3 px-4 font-medium text-navy-light">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-navy-light">Service</th>
                      <th className="text-left py-3 px-4 font-medium text-navy-light">Base Price</th>
                      <th className="text-left py-3 px-4 font-medium text-navy-light">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-navy-light">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((jc) => (
                      <JobRow
                        key={jc.code}
                        jc={jc}
                        expanded={expandedCode === jc.code}
                        onToggle={() => setExpandedCode(expandedCode === jc.code ? null : jc.code)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <p className="text-center text-navy-light mt-6">No matching job codes found.</p>
              )}
            </>
          ) : (
            /* Machine view — JSON */
            <div className="pt-8">
              <pre className="font-mono text-sm text-green/90 whitespace-pre-wrap leading-relaxed">
{`GET /api/v1/taxonomy/job-codes

→ 200 OK
{
  "data": ${JSON.stringify(
    JOB_CODES.map((jc) => ({
      code: jc.code,
      name: jc.name,
      base_price_cents: jc.base_price_cents,
      estimated_duration_min: jc.estimated_duration_min,
      category: jc.category,
      parts_included: jc.parts_included,
    })),
    null,
    2
  )}
}`}
              </pre>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ViewToggle mode={viewMode} onToggle={setViewMode} />
    </div>
  );
}

/* Extracted row component to keep main file cleaner */
function JobRow({
  jc,
  expanded,
  onToggle,
}: {
  jc: (typeof JOB_CODES)[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-cool-gray/50 last:border-b-0 cursor-pointer hover:bg-cool-gray/30 transition-colors"
      >
        <td className="py-3 px-4 font-mono text-amber font-medium">{jc.code}</td>
        <td className="py-3 px-4 text-navy">{jc.name}</td>
        <td className="py-3 px-4 text-navy font-medium">${(jc.base_price_cents / 100).toFixed(0)}</td>
        <td className="py-3 px-4 text-navy-light">{jc.estimated_duration_min} min</td>
        <td className="py-3 px-4 text-navy-light">{jc.category}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-cool-gray/20 px-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-navy mb-1">Description</p>
                <p className="text-navy-light">{jc.description}</p>
              </div>
              <div>
                <p className="font-medium text-navy mb-1">Scoping Signals</p>
                <ul className="text-navy-light space-y-0.5">
                  {jc.scoping_signals.map((s) => <li key={s}>• {s}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium text-navy mb-1">Includes</p>
                <ul className="text-navy-light space-y-0.5">
                  {jc.includes.map((s) => <li key={s}>✓ {s}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium text-navy mb-1">Excludes</p>
                <ul className="text-navy-light space-y-0.5">
                  {jc.excludes.map((s) => <li key={s}>✗ {s}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium text-navy mb-1">Adjustments</p>
                <p className="text-navy-light">After-hours: +$40 · Weekend: +$40 · Parts: {jc.parts_included ? "Included" : "Additional"}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
