"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  isPhoto?: boolean;
}

const MESSAGES: Message[] = [
  { role: "user", text: "I've got a pipe leaking under my kitchen sink" },
  { role: "assistant", text: "I can help! Is the water dripping from a pipe joint, or is it coming from the faucet connection above?" },
  { role: "user", text: "From the pipe joint underneath. It's a slow drip." },
  { role: "assistant", text: "Can you snap a photo under the sink? It helps me check if the joint is accessible or if there's corrosion." },
  { role: "user", text: "📷 pipe_leak_under_sink.jpg", isPhoto: true },
  { role: "assistant", text: "Clear shot — that's a compression fitting with a slow leak. Accessible location, standard repair. Here's your guaranteed quote:" },
];

const RESULT = {
  code: "PLM-601",
  name: "Pipe Leak Repair (Accessible)",
  price: "$245",
  confidence: "94%",
};

const SCHEDULE = [
  { label: "Today 2–4pm", tag: "ASAP +$40", urgent: true },
  { label: "Tomorrow 8–10am", tag: null, urgent: false },
  { label: "Tomorrow 10am–12pm", tag: null, urgent: false },
];

const PRO = {
  company: "Rossi Plumbing Co.",
  name: "Mike Rossi",
  google: 4.8,
  agentRating: 4.9,
  booked: 143,
  license: "MA-PLM-028461",
};

const API_FLOW = `POST /api/v1/scoping/start
{
  "description": "Pipe leaking under kitchen sink",
  "photos": ["https://...pipe_leak.jpg"],
  "address": "123 Main St, Boston, MA 02101"
}

→ 200 OK
{
  "session_id": "sc_k4m8x2...",
  "classification": {
    "job_code": "PLM-601",
    "name": "Pipe Leak Repair (Accessible)",
    "confidence": 0.94,
    "tier": 1,
    "price_cents": 24500
  },
  "photo_analysis": {
    "leak_type": "compression_fitting",
    "accessible": true,
    "corrosion": false
  }
}

POST /api/v1/bookings/create
{
  "session_id": "sc_k4m8x2...",
  "window": "2026-03-15T08:00/10:00",
  "customer": { "name": "Alex", "phone": "+1..." }
}

→ 200 OK
{
  "booking_id": "bk_7x9m2...",
  "status": "confirmed",
  "pro": {
    "company": "Rossi Plumbing Co.",
    "name": "Mike Rossi",
    "google_rating": 4.8,
    "agent_rating": 4.9,
    "jobs_completed": 143,
    "license": "MA-PLM-028461"
  }
}`;

export default function HeroDemo() {
  const [tab, setTab] = useState<"human" | "machine">("human");
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const playSequence = useCallback(() => {
    setVisibleMessages(0);
    setTypedText("");
    setShowResult(false);
    setShowSchedule(false);
    setSelectedSlot(null);
    setShowBooking(false);
    setPlaying(true);

    let step = 0;

    function next() {
      if (step < MESSAGES.length) {
        const msg = MESSAGES[step];
        const currentStep = step;
        if (msg.role === "user") {
          setVisibleMessages(currentStep + 1);
          step++;
          timeoutRef.current = setTimeout(next, msg.isPhoto ? 1200 : 800);
        } else {
          setVisibleMessages(currentStep);
          let charIndex = 0;
          setTypedText("");
          const typeChar = () => {
            if (charIndex < msg.text.length) {
              setTypedText(msg.text.slice(0, charIndex + 1));
              charIndex++;
              timeoutRef.current = setTimeout(typeChar, 25);
            } else {
              setVisibleMessages(currentStep + 1);
              setTypedText("");
              step++;
              timeoutRef.current = setTimeout(next, 600);
            }
          };
          timeoutRef.current = setTimeout(typeChar, 500);
        }
      } else {
        // Show result → schedule → auto-pick slot → booking
        timeoutRef.current = setTimeout(() => {
          setShowResult(true);
          timeoutRef.current = setTimeout(() => {
            setShowSchedule(true);
            // Auto-select a slot after a pause
            timeoutRef.current = setTimeout(() => {
              setSelectedSlot("Tomorrow 8–10am");
              timeoutRef.current = setTimeout(() => {
                setShowBooking(true);
                setPlaying(false);
              }, 800);
            }, 1200);
          }, 800);
        }, 400);
      }
    }
    timeoutRef.current = setTimeout(next, 400);
  }, []);

  useEffect(() => {
    playSequence();
    return clearTimeouts;
  }, [playSequence, clearTimeouts]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages, typedText, showResult, showSchedule, selectedSlot, showBooking]);

  const handleReplay = () => {
    if (playing) return;
    clearTimeouts();
    playSequence();
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[500px]">
      {/* Tabs — fixed top */}
      <div className="flex gap-2 p-3 pb-2 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setTab("human"); }}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            tab === "human" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"
          }`}
        >
          ◉ Human
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setTab("machine"); }}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
            tab === "machine" ? "bg-green/20 text-green" : "text-white/40 hover:text-white/60"
          }`}
        >
          ○ Machine
        </button>
      </div>

      {/* Content */}
      {tab === "human" ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Scrollable chat area */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 pt-2 space-y-3 relative">
            {MESSAGES.slice(0, visibleMessages).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-amber/20 text-amber-light rounded-br-md"
                      : "bg-white/10 text-white/90 rounded-bl-md"
                  }`}
                >
                  {msg.isPhoto ? (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">📷</div>
                      <span className="text-xs text-amber-light/70 font-mono">pipe_leak_under_sink.jpg</span>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {playing && visibleMessages < MESSAGES.length && MESSAGES[visibleMessages]?.role === "assistant" && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-md bg-white/10 text-white/90 text-sm">
                  {typedText ? (
                    <>{typedText}<span className="animate-pulse">|</span></>
                  ) : (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Result card */}
            {showResult && (
              <div className="p-3 rounded-xl bg-green/10 border border-green/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-green font-medium">{RESULT.code}</span>
                  <span className="text-xs bg-green/20 text-green px-2 py-0.5 rounded-full font-medium">{RESULT.confidence}</span>
                </div>
                <p className="font-bold text-white text-sm">{RESULT.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-white">{RESULT.price}</span>
                  <span className="text-xs text-white/50">~90 min</span>
                </div>
              </div>
            )}

            {/* Scheduler */}
            {showSchedule && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-medium text-white/70 mb-2">Pick a time:</p>
                <div className="space-y-1.5">
                  {SCHEDULE.map((slot) => (
                    <div
                      key={slot.label}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                        selectedSlot === slot.label
                          ? "bg-green/20 border border-green/30 text-white ring-1 ring-green/40"
                          : slot.urgent
                            ? "bg-amber/10 border border-amber/20 text-white"
                            : "bg-white/5 border border-white/5 text-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {selectedSlot === slot.label && <span className="text-green">✓</span>}
                        {slot.label}
                      </span>
                      {slot.tag && !selectedSlot && (
                        <span className="text-[10px] font-medium bg-amber/20 text-amber px-2 py-0.5 rounded-full">
                          {slot.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking confirmed — pinned at bottom */}
          {showBooking && (
            <div className="flex-shrink-0 p-3 border-t border-white/10 bg-white/[0.02]">
              <div className="p-3 rounded-xl bg-green/10 border border-green/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-green flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-green">Booking Confirmed</span>
                </div>

                {/* Pro card */}
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{PRO.company}</p>
                      <p className="text-xs text-white/50">{PRO.name} · Licensed Plumber</p>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber">★</span>
                      <span className="text-white/70">{PRO.google} Google</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-green">●</span>
                      <span className="text-white/70">{PRO.agentRating} Agent Rating</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/30">⚡</span>
                      <span className="text-white/70">{PRO.booked}× booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/30">📋</span>
                      <span className="text-white/70 font-mono">{PRO.license}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-white/40">Tomorrow 8–10am · $245 guaranteed</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReplay(); }}
                    className="text-[11px] font-medium text-white/50 hover:text-white transition-colors"
                  >
                    ↻ Replay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-xs font-mono text-green/90 whitespace-pre-wrap leading-relaxed">
            {API_FLOW}
          </pre>
        </div>
      )}
    </div>
  );
}
