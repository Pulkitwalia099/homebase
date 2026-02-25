/* eslint-disable @next/next/no-img-element */
export default function FounderSection() {
  return (
    <section className="py-16 px-4 sm:px-6 bg-[#0A1628]">
      {/* Glass card */}
      <div className="max-w-2xl mx-auto bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile photo */}
          <img
            src="/images/profile-photo.jpeg"
            alt="Pulkit Walia"
            className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white/15 flex-shrink-0 grayscale brightness-90"
          />

          {/* Content */}
          <div className="text-center md:text-left">
            {/* Name + social icons inline */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <p className="text-lg font-semibold text-white">Pulkit Walia</p>
              <div className="flex gap-1.5">
                <a
                  href="https://www.linkedin.com/in/pulkitwalia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/12 transition-colors flex items-center justify-center group"
                >
                  <svg className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="mailto:pwalia@mba2027.hbs.edu"
                  className="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/12 transition-colors flex items-center justify-center group"
                >
                  <svg className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </a>
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Founding team at Urban Company — spent a decade scaling it from
              seed to $3B IPO and Asia&apos;s largest home services marketplace.
              Invested in agentic and consumer AI at Bessemer Venture Partners.
              Now at HBS, building the rails for home services in the agentic
              era.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
