import Link from "next/link";
import HeroDemo from "./HeroDemo";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#1A2B4A] to-[#0F172A]" />
      {/* Subtle glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-amber/8 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-500/6 blur-[120px]" />

      {/* Content — top padding to clear fixed navbar + status bar */}
      <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1]">
                Home services finally have an API.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-lg">
                AI agents scope, price, and book trusted home service
                professionals — starting with plumbing in Boston.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/demo"
                  className="inline-flex items-center bg-white text-navy font-medium px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
                >
                  Try the Demo →
                </Link>
                <Link
                  href="/developers"
                  className="inline-flex items-center border border-white/20 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Get API Access →
                </Link>
              </div>
            </div>

            {/* Right — demo widget */}
            <div>
              <HeroDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
