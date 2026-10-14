"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function EditorialHero() {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!preference.matches);
    update(); preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    if (root.current) observer.observe(root.current);
    return () => { preference.removeEventListener("change", update); observer.disconnect(); };
  }, []);
  useEffect(() => {
    const sync = () => {
      const player = video.current;
      if (!player) return;
      if (motion && visible && !paused && !document.hidden) void player.play().catch(() => setPlaying(false));
      else player.pause();
    };
    sync(); document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [motion, visible, paused]);
  return <section className="gl-container gh-hero">
    <div className="gh-hero-copy"><p className="gh-pilot-status"><span aria-hidden="true" />Live pilot. Now onboarding.</p><h1>Let your AI agent<br />handle the<br />local work.</h1><p className="gh-hero-description">GoLocal gives personal AI agents one connection to local businesses. You stay with your agent. We connect the local expertise.</p><div className="gh-actions"><Link className="gl-button" href="/connectors">Connect your agent</Link><Link className="gh-text-link" href="/agent">I’m a personal assistant</Link></div><p className="gh-pilot-progress">5–6 customers are already in the pilot.</p></div>
    <div ref={root} className="gh-art"><Image src="/brand/local-services.png" alt="Local professionals mowing a lawn, repairing a roof and servicing homes" fill priority sizes="(max-width: 700px) 100vw, 50vw" />
      {motion && !failed && <video ref={video} src="/brand/hero-message.mp4" muted loop playsInline preload="metadata" aria-hidden="true" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} onTimeUpdate={event => { const time = event.currentTarget.currentTime; setPhase(time < 1.8 ? 0 : time < 3 ? 1 : 2); }} />}
      <div className="gh-art-caption" aria-label="Illustrative conversation with your personal agent">
        <span className="gh-art-agent">YOUR PERSONAL AGENT</span>
        <p>“Just take care of the house for me.”</p>
        <span className="gh-art-reply">{motion && !failed && phase < 2 ? <span>{phase === 0 ? "Delivered" : "Typing…"}</span> : "On it. I’ll coordinate the local pros."}</span>
      </div>
      {motion && !failed && <button className="gh-motion" type="button" aria-label={playing ? "Pause hero animation" : "Play hero animation"} onClick={() => { if (playing) setPaused(true); else { setPaused(false); void video.current?.play().catch(() => setPlaying(false)); } }}>{playing ? "Pause" : "Play"}</button>}
    </div>
  </section>;
}
