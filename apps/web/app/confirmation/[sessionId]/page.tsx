"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { DemoNavbar } from "@/components/demo/DemoNavbar";

interface ConfirmationData {
  quote: {
    job_code: { name: string; code: string };
    quoted_price_cents: number;
  };
  slot: { label: string; time: string };
  pro: { name: string; rating: number; experience: string; title: string; license: string };
  customer: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  bookingNumber: string;
}

export default function ConfirmationPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [data, setData] = useState<ConfirmationData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`hb_confirmed_${sessionId}`);
      if (raw) setData(JSON.parse(raw));
    } catch {
      // Data not found
    }
  }, [sessionId]);

  // Fallback dummy data if sessionStorage is empty (e.g. direct URL visit)
  const d: ConfirmationData = data ?? {
    quote: { job_code: { name: "Faucet Repair", code: "PLM-201" }, quoted_price_cents: 16500 },
    slot: { label: "Tomorrow", time: "10:00 AM – 12:00 PM" },
    pro: { name: "Mike Rodriguez", rating: 4.8, experience: "12 years", title: "Licensed Master Plumber", license: "MA #PL-28451" },
    customer: { name: "Sarah Johnson", email: "sarah@example.com", phone: "(617) 555-0123", street: "42 Beacon St", city: "Boston", state: "MA", zip: "02108" },
    bookingNumber: "HB-2026-0001",
  };

  const priceDollars = (d.quote.quoted_price_cents / 100).toFixed(0);

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      <DemoNavbar step="confirmed" />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-check-pulse">
              <svg className="w-10 h-10 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="9" className="opacity-20" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" className="animate-check-draw" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-navy mb-1">You&apos;re Booked!</h1>
            <p className="text-gray-500 text-sm">Booking #{d.bookingNumber}</p>
          </div>

          {/* Plumber Assigned Card */}
          <div className="bg-navy rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              MR
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/50 uppercase tracking-wide font-medium">Plumber Assigned</p>
              <p className="text-white font-bold mt-0.5">{d.pro.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <svg className="w-3.5 h-3.5 text-amber" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-white">{d.pro.rating}</span>
                <span className="text-sm text-white/60">· {d.pro.experience}</span>
              </div>
              <p className="text-xs text-white/50 mt-1">{d.pro.title} · {d.pro.license}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-warm-lg overflow-hidden mb-6 animate-fade-up">
            <div className="p-6 space-y-4">
              {/* Service */}
              <div>
                <p className="text-lg font-bold text-navy">{d.quote.job_code.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {d.slot.label}, {d.slot.time}
                </p>
              </div>

              <div className="border-t border-gray-100" />

              {/* Price */}
              <div className="flex justify-between items-baseline">
                <p className="text-sm text-gray-500">Price</p>
                <div className="text-right">
                  <p className="text-2xl font-black text-navy">${priceDollars}</p>
                  <p className="text-xs text-green font-medium">guaranteed</p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Address */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Address</p>
                <p className="text-sm font-medium text-navy">
                  {d.customer.street}
                  <br />
                  {d.customer.city}, {d.customer.state} {d.customer.zip}
                </p>
              </div>

              <div className="border-t border-gray-100" />

              {/* Contact */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <p className="text-sm font-medium text-navy">{d.customer.name}</p>
                <p className="text-xs text-gray-400">{d.customer.email} · {d.customer.phone}</p>
              </div>
            </div>
          </div>

          {/* Notification message */}
          <div className="bg-amber-light/50 border border-amber/20 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-navy">
              We&apos;ll send you a confirmation text and email with your booking details.
            </p>
          </div>

          {/* Actions */}
          <div className="text-center space-y-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 text-sm font-medium text-navy hover:text-navy-light transition-colors"
            >
              Book another service
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <p className="text-xs text-gray-400">
              Questions? <a href="mailto:pulkitwalia099@gmail.com" className="text-amber hover:underline">pulkitwalia099@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
