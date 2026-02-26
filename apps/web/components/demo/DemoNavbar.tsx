"use client";

import Link from "next/link";

type DemoStep = "chat" | "quote" | "book" | "confirmed";

interface DemoNavbarProps {
  step: DemoStep;
}

const STEPS: Array<{ key: DemoStep; label: string }> = [
  { key: "chat", label: "Chat" },
  { key: "quote", label: "Quote" },
  { key: "book", label: "Book" },
  { key: "confirmed", label: "Confirmed" },
];

export function DemoNavbar({ step }: DemoNavbarProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0 shadow-warm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-navy">Home</span>
          <span className="text-amber">Base</span>
        </Link>

        {/* Stepper */}
        <div className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;

            return (
              <div key={s.key} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && (
                  <div
                    className={`w-4 sm:w-6 h-0.5 ${
                      isCompleted ? "bg-green" : "bg-gray-200"
                    }`}
                  />
                )}
                <div className="flex items-center gap-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? "bg-green text-white"
                        : isCurrent
                        ? "bg-amber text-white shadow-[0_0_8px_rgba(232,147,12,0.5)]"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-medium ${
                      isCurrent ? "text-navy" : isCompleted ? "text-green" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
