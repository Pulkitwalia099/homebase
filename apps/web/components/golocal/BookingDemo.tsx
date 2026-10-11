"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const providers = [
  { name: "Oak Plumbing", fee: 79, time: "9–11 am", rating: "4.9", reviews: 128, bookings: 18, distance: "2.1 miles away", badge: "My choice" },
  { name: "Canyon Plumbing", fee: 95, time: "10 am–12 pm", rating: "4.8", reviews: 214, bookings: 32, distance: "3.4 miles away", badge: "Most booked nearby" },
  { name: "Jordan Home Plumbing", fee: 69, time: "10 am–12 pm", rating: "4.7", reviews: 89, bookings: 12, distance: "4.2 miles away", badge: "Lowest visit fee" },
];
const stages = ["Scope", "Choose", "Booked"];
const beats = [
  { kind: "request", stage: 0, delay: 0 },
  { kind: "question", stage: 0, delay: 1800 },
  { kind: "answer", stage: 0, delay: 3000 },
  { kind: "diagnosis", stage: 0, delay: 4000 },
  { kind: "search", stage: 1, delay: 6500 },
  { kind: "options", stage: 1, delay: 2400 },
  { kind: "choice", stage: 1, delay: 6500 },
  { kind: "booking", stage: 2, delay: 1400 },
  { kind: "confirmed", stage: 2, delay: 2600 },
  { kind: "done", stage: 2, delay: 2200 },
] as const;

type BeatKind = (typeof beats)[number]["kind"];
const countThrough = (kind: BeatKind) => beats.findIndex(beat => beat.kind === kind) + 1;
const stageStarts = stages.map((_, stage) => beats.findIndex(beat => beat.stage === stage) + 1);
const userBeats = new Set<BeatKind>(["request", "answer", "choice"]);

export default function BookingDemo() {
  const [count, setCount] = useState(1);
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"auto" | "play" | "pause">("auto");
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const complete = count === beats.length;
  const playing = !complete && inView && pageVisible && mode !== "pause" && (mode === "play" || !reducedMotion);
  const stage = beats[count - 1].stage;
  const provider = providers[selected];
  const latestUserBeat = beats.slice(0, count).filter(beat => userBeats.has(beat.kind)).at(-1)?.kind;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(media.matches);
    const visibility = () => setPageVisible(document.visibilityState === "visible");
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.35), { threshold: 0.35 });
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setCount(value => Math.min(value + 1, beats.length)), beats[count].delay);
    return () => window.clearTimeout(timer);
  }, [count, playing]);

  useEffect(() => {
    const panel = transcript.current;
    if (!panel) return;
    const options = beats[count - 1].kind === "options" ? panel.querySelector<HTMLElement>('[data-demo-beat="options"]') : null;
    const top = options ? panel.scrollTop + options.getBoundingClientRect().top - panel.getBoundingClientRect().top - 16 : panel.scrollHeight;
    panel.scrollTo({ top, behavior: reducedMotion ? "instant" : "smooth" });
  }, [count, reducedMotion]);

  function replay() {
    setCount(1);
    setSelected(0);
    setMode("play");
  }

  function choose(index: number) {
    setSelected(index);
    setCount(countThrough("choice"));
    setMode("play");
  }

  function renderBeat(kind: BeatKind) {
    switch (kind) {
      case "request": return <p>Can you book a plumber for my leaking kitchen tap in Salt Lake City tomorrow morning?</p>;
      case "question": return <p>Send me a photo of the tap. Roughly how old is it?</p>;
      case "answer": return <><figure className="gl-demo-photo"><Image src="/demo/dripping-kitchen-tap.png" alt="Example photo of a chrome single-lever kitchen tap with a droplet at the spout over a stainless steel sink" width={1536} height={1024} sizes="(max-width: 800px) 260px, 300px" /><figcaption>Kitchen tap · Example photo</figcaption></figure><p>Here you go. About five years old, and it drips even with the handle turned off.</p></>;
      case "diagnosis": return <><p>The photo shows a drip at the spout. With a five-year-old tap that drips when off, the cartridge may be worn.</p><p className="gl-demo-diagnosis-followup">I’ll find nearby plumbers for tomorrow morning through GoLocal. They can check it on the visit.</p><div className="gl-demo-request-tag"><span aria-hidden="true">✓</span> Dripping kitchen tap · About 5 years old</div></>;
      case "search": return <div className="gl-demo-mcp-call"><div><span className="gl-demo-mcp-icon" aria-hidden="true">↗</span><strong>GoLocal MCP</strong><span className="gl-demo-mcp-label">DEMO TOOL CALL</span></div><code>search_providers → get_availability</code><p>Dripping kitchen tap · Salt Lake City · Tomorrow AM</p><span className="gl-demo-mcp-result">✓ 3 available providers found</span></div>;
      case "options": return <><p>These three can help tomorrow morning. Oak is my choice: the highest rating, an earlier slot and a lower fee than Canyon.</p><span className="gl-demo-match-source">Found through GoLocal MCP · Example metrics</span><div className="gl-demo-options">{providers.map((option, index) => <button key={option.name} className={`gl-demo-option gl-demo-vendor ${selected === index ? "is-selected" : ""}`} disabled={count > countThrough("options")} onClick={() => choose(index)} aria-label={`Book ${option.name}, rated ${option.rating} out of 5, ${option.bookings} bookings in the past 7 days, $${option.fee} visit fee, tomorrow ${option.time}`}><span className={`gl-demo-vendor-badge ${index === 0 ? "is-recommended" : ""}`}>{index === 0 && <span aria-hidden="true">✦ </span>}{option.badge}</span><span className="gl-demo-vendor-main"><strong>{option.name}</strong><span className="gl-demo-vendor-rating"><span aria-hidden="true">★</span> {option.rating} <small>({option.reviews})</small></span></span><span className="gl-demo-vendor-stats"><span>{option.bookings} bookings in past 7 days</span><span>{option.distance}</span></span><span className="gl-demo-vendor-book"><span>Tomorrow · {option.time}</span><strong>${option.fee}<small> visit fee</small></strong><span className="gl-demo-vendor-arrow" aria-hidden="true">→</span></span></button>)}</div><small className="gl-demo-hint">Choose a visit to book it. Visit fee covers diagnosis; repairs are quoted separately.</small></>;
      case "choice": return <p>Book {provider.name} for tomorrow, {provider.time}.</p>;
      case "booking": return <div className="gl-demo-mcp-call"><div><span className="gl-demo-mcp-icon" aria-hidden="true">↗</span><strong>GoLocal MCP</strong><span className="gl-demo-mcp-label">DEMO TOOL CALL</span></div><code>prepare_booking → confirm_booking</code><p>{provider.name} · Tomorrow, {provider.time} · ${provider.fee} visit</p><span className="gl-demo-mcp-result">✓ Selection received · Booking the visit</span></div>;
      case "confirmed": return <div className="gl-demo-receipt"><span className="gl-demo-receipt-icon" aria-hidden="true">✓</span><span className="gl-mono">EXAMPLE BOOKING CONFIRMED</span><h3>You’re all set.</h3><p>{provider.name} · Tomorrow, {provider.time}</p><div><span>Leaking-tap diagnostic visit</span><strong>${provider.fee}</strong></div><small>Confirmation GL-1042 · Example details</small></div>;
      case "done": return <p>All booked. I’ve got the details right here in our chat whenever you need them. One less thing on your list.</p>;
    }
  }

  return <div ref={root} className="gl-demo gl-conversation-demo gl-imessage">
    <div className="gl-imessage-status" aria-hidden="true"><span>9:41</span><span className="gl-imessage-island" /><span>▮▮▮ <svg width="16" height="12" viewBox="0 0 20 14" fill="none"><path d="M2 5Q10 -1 18 5M5 8Q10 4 15 8M8 11Q10 9 12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg><span className="gl-imessage-battery" /></span></div>
    <div className="gl-imessage-contact"><span className="gl-imessage-back" aria-hidden="true">‹</span><div className="gl-imessage-contact-person"><span className="gl-imessage-avatar"><Image src="/agents/openclaw.jpeg" alt="OpenClaw" width={377} height={133} /></span><strong>Your local agent <span aria-hidden="true">›</span></strong><small>OpenClaw · iMessage demo</small></div><span className="gl-imessage-demo-label">DEMO</span></div>
    <div className="gl-demo-steps" aria-label="Demo chapters">{stages.map((label, index) => <button key={label} onClick={() => { setCount(stageStarts[index]); setMode("pause"); }} aria-current={stage === index ? "step" : undefined}><span>{index < stage ? "✓" : index + 1}</span>{label}</button>)}</div>
    <div className="gl-demo-transcript" ref={transcript} role="log" aria-label="Simulated booking conversation" aria-live="polite" aria-relevant="additions" tabIndex={0} onWheel={() => setMode("pause")} onTouchMove={() => setMode("pause")} onKeyDown={event => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) setMode("pause"); }}>
      <div className="gl-demo-conversation-date">iMessage · Today 9:41 AM</div>
      {beats.slice(0, count).map(({ kind }) => {
        const isUser = userBeats.has(kind);
        const isActivity = kind === "search" || kind === "booking";
        return <div key={kind} data-demo-beat={kind} className={`gl-demo-message ${isUser ? "gl-demo-message-user" : "gl-demo-message-agent"} ${isActivity ? "gl-demo-message-system" : ""}`}>
          {!isActivity && <span className="gl-demo-speaker">{isUser ? "You" : "Your local agent"}</span>}
          <div className="gl-demo-bubble">{renderBeat(kind)}</div>
          {isUser && kind === latestUserBeat && <span className="gl-imessage-delivered">Delivered</span>}
        </div>;
      })}
      {playing && <div className="gl-demo-typing" aria-hidden="true"><span /><span /><span /><small>{userBeats.has(beats[count].kind) ? "Your reply" : "Your agent"}</small></div>}
    </div>
    <div className="gl-imessage-composer" aria-hidden="true"><span className="gl-imessage-plus">+</span><span className="gl-imessage-input">iMessage<span>↑</span></span></div>
    <div className="gl-demo-playback"><span className="gl-demo-playback-status" role="status">{complete ? "A request. A conversation. A booking." : playing ? "Watching the booking unfold" : "Explore at your own pace"}</span><div><button onClick={() => complete ? replay() : setMode(playing ? "pause" : "play")} aria-label={complete ? "Replay demo" : playing ? "Pause demo" : "Play demo"}>{complete ? "↻ Replay" : playing ? "Ⅱ Pause" : "▶ Play"}</button>{!complete && <button onClick={() => { setCount(value => Math.min(value + 1, beats.length)); setMode("pause"); }} aria-label="Next message">Next <span aria-hidden="true">→</span></button>}</div></div>
    <div className="gl-demo-progress" aria-hidden="true"><span style={{ width: `${count / beats.length * 100}%` }} /></div>
    <div className="gl-demo-disclosure">Illustrative iMessage experience. Simulated MCP calls, providers, ratings and booking counts. No real booking or charge.</div>
  </div>;
}
