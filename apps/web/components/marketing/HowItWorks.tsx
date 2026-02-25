const steps = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
    title: "Scope",
    description:
      "Describe the issue. Our AI diagnoses it, classifies it to a standard job code, and asks smart follow-ups. Works via chat, API, or voice.",
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Price",
    description:
      "Get a guaranteed price from our validated taxonomy. No surprise bills. No haggling. Same price for humans and agents.",
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
      </svg>
    ),
    title: "Book",
    description:
      "Matched to a licensed, vetted, available pro. Real-time tracking. Scope change mediation. Structured feedback.",
  },
];

export default function HowItWorks() {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 bg-warm-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-amber mb-3">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy">
            Scope. Price. Book.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.title}
              className="bg-white rounded-2xl border border-gray-100 border-t-2 border-t-amber p-8 shadow-sm hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber/10 text-amber mb-5">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
