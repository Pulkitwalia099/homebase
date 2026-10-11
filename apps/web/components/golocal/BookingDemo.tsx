"use client";

import { useEffect, useRef, useState } from "react";

const providers = [
  { name: "Oak Plumbing", initials: "OP", fee: 79, time: "9–11 am", detail: "Earliest morning visit" },
  { name: "Canyon Plumbing", initials: "CP", fee: 95, time: "10 am–12 pm", detail: "Another morning option" },
  { name: "Jordan Home Plumbing", initials: "JP", fee: 69, time: "1–3 pm", detail: "Lower visit fee, later arrival" },
];
const stages = ["Scope", "Compare", "Approve", "Booked"];
const stageStarts = [1, 4, 7, 9];
const beats = [
  { kind: "request", stage: 0, delay: 0 },
  { kind: "question", stage: 0, delay: 1800 },
  { kind: "answer", stage: 0, delay: 3000 },
  { kind: "search", stage: 1, delay: 1500 },
  { kind: "options", stage: 1, delay: 2400 },
  { kind: "choice", stage: 1, delay: 6500 },
  { kind: "approval", stage: 2, delay: 2200 },
  { kind: "approve", stage: 2, delay: 6500 },
  { kind: "booking", stage: 3, delay: 1400 },
  { kind: "confirmed", stage: 3, delay: 2600 },
  { kind: "done", stage: 3, delay: 2200 },
] as const;

type BeatKind = (typeof beats)[number]["kind"];
const userBeats = new Set<BeatKind>(["request", "answer", "choice", "approve"]);

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
    if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior: reducedMotion ? "instant" : "smooth" });
  }, [count, reducedMotion]);

  function replay() {
    setCount(1);
    setSelected(0);
    setMode("play");
  }

  function choose(index: number) {
    setSelected(index);
    setCount(6);
    setMode("play");
  }

  function renderBeat(kind: BeatKind) {
    switch (kind) {
      case "request": return <p>Can you book a plumber for my leaking kitchen tap tomorrow morning?</p>;
      case "question": return <p>Absolutely. Is the water dripping from the tap, or leaking underneath? And which area are you in?</p>;
      case "answer": return <p>It’s dripping from the tap. I’m in Salt Lake City. Ideally before noon.</p>;
      case "search": return <div className="gl-demo-activity"><span aria-hidden="true">⌕</span><div><strong>Finding the right local visit</strong><span>Service area → availability → visit pricing</span></div><span className="gl-demo-activity-check" aria-hidden="true">✓</span></div>;
      case "options": return <><p>I found three options for a leaking-tap diagnostic visit. Oak has the earliest morning window.</p><div className="gl-demo-options">{providers.map((option, index) => <button key={option.name} className={`gl-demo-option ${selected === index ? "is-selected" : ""}`} disabled={count > 5} onClick={() => choose(index)} aria-label={`Choose ${option.name}, $${option.fee} visit fee, tomorrow ${option.time}`}><span className="gl-demo-provider-mark" aria-hidden="true">{option.initials}</span><span className="gl-demo-provider-info"><strong>{option.name}</strong><span>Tomorrow · {option.time}</span><small>{option.detail}</small></span><span className="gl-demo-price"><strong>${option.fee}</strong><small>visit fee</small></span><span aria-hidden="true">{selected === index ? "✓" : "↗"}</span></button>)}</div>{count === 5 && <small className="gl-demo-hint">Try choosing a provider, or watch the demo continue.</small>}</>;
      case "choice": return <p>{provider.name} works. Let’s book the {provider.time} visit.</p>;
      case "approval": return <><p>Here’s everything before I book. The visit fee covers diagnosis; any repair quote needs your approval.</p><div className="gl-demo-review"><div><span>YOUR VISIT</span><strong>{provider.name}</strong></div><dl><div><dt>When</dt><dd>Tomorrow, {provider.time}</dd></div><div><dt>Where</dt><dd>Your Salt Lake City home</dd></div><div><dt>Visit fee</dt><dd>${provider.fee}</dd></div></dl><button className="gl-demo-approve" disabled={count > 7} onClick={() => { setCount(8); setMode("play"); }}>{count > 7 ? "Approved in demo ✓" : "Approve example booking →"}</button></div></>;
      case "approve": return <p>Yes, go ahead. Thank you!</p>;
      case "booking": return <div className="gl-demo-activity"><span aria-hidden="true">↗</span><div><strong>Sending your approved booking</strong><span>GoLocal → {provider.name}’s scheduling system</span></div><span className="gl-demo-activity-check" aria-hidden="true">✓</span></div>;
      case "confirmed": return <div className="gl-demo-receipt"><span className="gl-demo-receipt-icon" aria-hidden="true">✓</span><span className="gl-mono">EXAMPLE BOOKING CONFIRMED</span><h3>You’re all set.</h3><p>{provider.name} · Tomorrow, {provider.time}</p><div><span>Leaking-tap diagnostic visit</span><strong>${provider.fee}</strong></div><small>Confirmation GL-1042 · Example details</small></div>;
      case "done": return <p>Your visit is confirmed. I have the appointment details here whenever you need them. One less thing on your list.</p>;
    }
  }

  return <div ref={root} className="gl-demo gl-conversation-demo">
    <div className="gl-conversation-header"><div className="gl-demo-agent-icon" aria-hidden="true">✳</div><div><strong>Your personal agent</strong><span>A local booking, powered by GoLocal</span></div><span className="gl-demo-live-badge"><i aria-hidden="true" /> LIVE DEMO</span></div>
    <div className="gl-demo-steps" aria-label="Demo chapters">{stages.map((label, index) => <button key={label} onClick={() => { setCount(stageStarts[index]); setMode("pause"); }} aria-current={stage === index ? "step" : undefined}><span>{index < stage ? "✓" : index + 1}</span>{label}</button>)}</div>
    <div className="gl-demo-transcript" ref={transcript} role="log" aria-label="Simulated booking conversation" aria-live="polite" aria-relevant="additions" tabIndex={0} onWheel={() => setMode("pause")} onTouchMove={() => setMode("pause")} onKeyDown={event => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) setMode("pause"); }}>
      <div className="gl-demo-conversation-date">A LITTLE LESS LIFE ADMIN</div>
      {beats.slice(0, count).map(({ kind }) => {
        const isUser = userBeats.has(kind);
        const isActivity = kind === "search" || kind === "booking";
        return <div key={kind} className={`gl-demo-message ${isUser ? "gl-demo-message-user" : "gl-demo-message-agent"} ${isActivity ? "gl-demo-message-system" : ""}`}>
          {!isActivity && <span className="gl-demo-speaker">{isUser ? "YOU" : "YOUR AGENT"}</span>}
          <div className="gl-demo-bubble">{renderBeat(kind)}</div>
        </div>;
      })}
      {playing && <div className="gl-demo-typing" aria-hidden="true"><span /><span /><span /><small>{userBeats.has(beats[count].kind) ? "Your reply" : "Your agent"}</small></div>}
    </div>
    <div className="gl-demo-playback"><span className="gl-demo-playback-status" role="status">{complete ? "A request. A conversation. A booking." : playing ? "Watching the booking unfold" : "Explore at your own pace"}</span><div><button onClick={() => complete ? replay() : setMode(playing ? "pause" : "play")} aria-label={complete ? "Replay demo" : playing ? "Pause demo" : "Play demo"}>{complete ? "↻ Replay" : playing ? "Ⅱ Pause" : "▶ Play"}</button>{!complete && <button onClick={() => { setCount(value => Math.min(value + 1, beats.length)); setMode("pause"); }} aria-label="Next message">Next <span aria-hidden="true">→</span></button>}</div></div>
    <div className="gl-demo-progress" aria-hidden="true"><span style={{ width: `${count / beats.length * 100}%` }} /></div>
    <div className="gl-demo-disclosure">Simulated conversation. Fictional businesses and prices. No real booking is made.</div>
  </div>;
}
