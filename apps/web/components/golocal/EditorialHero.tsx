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
    <div className="gh-hero-copy"><p className="gh-pilot-status"><span aria-hidden="true" />Live pilot. Now onboarding.</p><h1>Your AI agent.<br />Connected to<br />the real world.</h1><p className="gh-hero-description">GoLocal enables your personal AI agent to find, book and manage local services. Ask the agent you already use, and connect it to the businesses that can get the job done.</p><div className="gh-actions"><Link className="gl-button" href="/connectors">Connect your agent</Link><Link className="gh-text-link" href="/agent">I’m a personal assistant</Link></div></div>
    <div ref={root} className="gh-art"><Image src="/brand/local-services.png" alt="Local professionals mowing a lawn, repairing a roof and servicing homes" fill priority sizes="(max-width: 700px) 100vw, 50vw" />
      {motion && !failed && <video ref={video} src="/brand/hero-message.mp4" muted loop playsInline preload="metadata" aria-hidden="true" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />}
      {motion && !failed && <button className="gh-motion" type="button" aria-label={playing ? "Pause hero animation" : "Play hero animation"} onClick={() => { if (playing) setPaused(true); else { setPaused(false); void video.current?.play().catch(() => setPlaying(false)); } }}>{playing ? "Pause" : "Play"}</button>}
    </div>
  </section>;
}
