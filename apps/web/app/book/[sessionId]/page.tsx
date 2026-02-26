"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoNavbar } from "@/components/demo/DemoNavbar";

interface BookingData {
  quote: {
    job_code: { name: string; code: string };
    quoted_price_cents: number;
  };
  slot: { label: string; time: string };
  pro: { name: string; rating: number; title: string };
}

export default function BookPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`hb_booking_${sessionId}`);
      if (raw) setBookingData(JSON.parse(raw));
    } catch {
      // Session data not found
    }
  }, [sessionId]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid = form.name && form.email && form.phone && form.street && form.city && form.state && form.zip;

  const handleSubmit = () => {
    if (!isValid || !bookingData) return;
    setIsSubmitting(true);

    // Store booking info for confirmation page
    sessionStorage.setItem(
      `hb_confirmed_${sessionId}`,
      JSON.stringify({
        ...bookingData,
        customer: form,
        bookingNumber: `HB-2026-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
      })
    );

    // Brief loading state then navigate
    setTimeout(() => {
      router.push(`/confirmation/${sessionId}`);
    }, 800);
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col">
        <DemoNavbar step="book" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-gray-600 font-medium mb-4">No booking data found.</p>
            <button onClick={() => router.push("/chat")} className="text-amber underline text-sm">
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priceDollars = (bookingData.quote.quoted_price_cents / 100).toFixed(0);

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      <DemoNavbar step="book" />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left — Form (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-warm-lg p-6">
              <h2 className="text-xl font-bold text-navy mb-6">Your Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Sarah Johnson"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="sarah@example.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="(617) 555-0123"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Service Address</label>
                  <input
                    type="text"
                    placeholder="123 Main Street"
                    value={form.street}
                    onChange={(e) => update("street", e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    maxLength={2}
                    value={form.state}
                    onChange={(e) => update("state", e.target.value.toUpperCase())}
                    className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    maxLength={5}
                    value={form.zip}
                    onChange={(e) => update("zip", e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
                  />
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  We&apos;ll text job updates to your phone. No spam.
                </p>
                <p className="text-xs text-green font-medium mt-2">
                  No payment required today — pay after service is complete.
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  className="w-full bg-amber hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right — Order summary sidebar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-warm-lg p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Order Summary</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-navy">{bookingData.quote.job_code.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{bookingData.quote.job_code.code}</p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">Schedule</p>
                  <p className="text-sm font-medium text-navy">{bookingData.slot.label}, {bookingData.slot.time}</p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">Your Pro</p>
                  <p className="text-sm font-medium text-navy">{bookingData.pro.name}</p>
                  <p className="text-xs text-gray-400">{bookingData.pro.title}</p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-2xl font-black text-navy">${priceDollars}</p>
                  </div>
                  <p className="text-xs text-green font-medium mt-1">Guaranteed price</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
