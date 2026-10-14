"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function EditorialHero() {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  const [visible, setVisible] = useState(false);
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
      if (motion && visible && !document.hidden) void player.play().catch(() => {});
      else player.pause();
    };
    sync(); document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [motion, visible]);
  return <section className="gl-container gh-hero">
    <div className="gh-hero-copy"><p className="gh-pilot-status"><span aria-hidden="true" />Live pilot. Now onboarding.</p><h1>Your AI agent.<br />Connected to<br />the real world.</h1><p className="gh-hero-description">Connect GoLocal once, then ask your personal agent to find, book and manage local services. Built for everyday needs—from home cleaning and handyman help to your next barber appointment.</p><div className="gh-actions"><Link className="gl-button" href="/connectors">Connect your agent</Link></div></div>
    <div ref={root} className="gh-art"><Image src="/brand/local-services.png" alt="Local professionals mowing a lawn, repairing a roof and servicing homes" fill priority sizes="(max-width: 700px) 100vw, 50vw" />
      {motion && !failed && <video ref={video} src="/brand/hero-message.mp4" muted loop playsInline preload="metadata" aria-hidden="true" onError={() => setFailed(true)} />}
    </div>
  </section>;
}
