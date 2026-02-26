"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NavbarProps {
  variant?: "light" | "dark";
  showStatusBar?: boolean;
}

export default function Navbar({ variant = "light", showStatusBar = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const alwaysDark = variant === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDarkText = !alwaysDark && scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? alwaysDark
            ? "bg-dark/90 backdrop-blur-xl border-b border-white/5"
            : "bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm"
          : "bg-transparent"
      }`}
    >
      {/* Status bar — collapses on scroll */}
      {showStatusBar && (
        <div
          className={`overflow-hidden transition-all duration-500 ${
            scrolled ? "max-h-0 opacity-0" : "max-h-7 opacity-100"
          }`}
        >
          <div className="flex items-center justify-center gap-3 h-7 text-[11px] text-gray-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            <span>Pilot launching soon · Boston · Plumbing</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className={`transition-colors duration-500 ${isDarkText ? "text-navy" : "text-white"}`}>
            Home
          </span>
          <span className="text-amber">Base</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "/demo", label: "Demo" },
            { href: "/taxonomy", label: "Taxonomy" },
            { href: "/developers", label: "Developers" },
            { href: "/pros", label: "For Pros" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-300 ${
                isDarkText
                  ? "text-gray-600 hover:text-navy"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#waitlist"
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 ${
              isDarkText
                ? "bg-navy text-white hover:bg-navy-light"
                : "bg-white text-navy hover:bg-white/90"
            }`}
          >
            Get Early Access
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden p-2 transition-colors ${isDarkText ? "text-navy" : "text-white"}`}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className={`md:hidden backdrop-blur-xl border-t px-4 pb-4 ${
          alwaysDark || !scrolled
            ? "bg-dark/95 border-white/10"
            : "bg-white/95 border-gray-200"
        }`}>
          {[
            { href: "/demo", label: "Demo" },
            { href: "/taxonomy", label: "Taxonomy" },
            { href: "/developers", label: "Developers" },
            { href: "/pros", label: "For Pros" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-3 ${
                alwaysDark || !scrolled ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#waitlist"
            onClick={() => setMenuOpen(false)}
            className="inline-block mt-2 bg-navy text-white font-medium px-4 py-2 rounded-lg"
          >
            Get Early Access
          </Link>
        </div>
      )}
    </nav>
  );
}
