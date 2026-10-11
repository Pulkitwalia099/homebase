"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AnimatedHero({ variant = "message" }: { variant?: "message" | "scene" }) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!preference.matches);
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    if (section.current) observer.observe(section.current);
    return () => { preference.removeEventListener("change", update); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const sync = () => {
      const player = video.current;
      if (!player) return;
      if (motion && visible && !paused && !document.hidden) {
        void player.play().catch(() => setPlaying(false));
      } else player.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [motion, visible, paused, variant]);

  const story = variant === "message";
  const shownPhase = motion && !failed ? phase : 2;
  return <section ref={section} data-playing={playing} className={`gl-hero gl-animated-hero ${story ? "gl-hero-with-message" : ""}`}>
    <Image className="gl-hero-art" src="/brand/local-services.png" alt="Local professionals mowing a lawn, repairing a roof and servicing a home together" fill priority sizes="100vw" />
    {motion && !failed && <video ref={video} className="gl-hero-art gl-hero-video" muted loop playsInline preload="metadata" aria-hidden="true"
      src={`/brand/hero-${story ? "message" : "scene"}.mp4`}
      onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }}
      onTimeUpdate={event => { const time = event.currentTarget.currentTime; setPhase(time < 1.4 ? 0 : time < 3 ? 1 : 2); }} />}
    <div className="gl-hero-shade" />
    <div className="gl-container gl-hero-inner">
      <div className="gl-hero-copy">
        <p className="gl-eyebrow gl-eyebrow-light"><span className="gl-live-dot" /> THE NEXT CHAPTER OF LOCAL</p>
        <h1>Local services,<br />ready for the<br /><em>agent era.</em></h1>
        <p className="gl-hero-description">One connection between personal AI agents and the local businesses that get things done.</p>
        <div className="gl-actions"><Link className="gl-button gl-button-orange" href="/register?type=business">Register your business <span aria-hidden="true">↗</span></Link><Link className="gl-hero-link" href="/#network">Partner with us <span aria-hidden="true">→</span></Link></div>
        <p className="gl-hero-note">Now welcoming businesses, agent companies and channel partners.</p>
      </div>
      <div className="gl-hero-caption"><span className="gl-caption-star">✳</span><span>Real local expertise.<br /><b>A new way to connect.</b></span></div>
    </div>
    {story && <div className="gl-hero-messages" aria-label="Illustrative conversation with your personal agent" data-phase={shownPhase}>
      <div className="gl-hero-message-label"><span aria-hidden="true">✳</span> YOUR PERSONAL AGENT</div>
      <p className="gl-hero-request">Just take care of the house for me.</p>
      <span className="gl-hero-delivered">Delivered</span>
      <div className="gl-hero-answer">
        {shownPhase < 2 ? <span className="gl-hero-typing" aria-label="Agent is typing"><i /><i /><i /></span> : <p>On it. I’ll coordinate the right local pros.</p>}
      </div>
      <span className="gl-hero-story-note">A little look at what’s possible.</span>
    </div>}
    {motion && !failed && <button className="gl-hero-motion-control" type="button" onClick={() => { if (!playing) { setPaused(false); void video.current?.play().catch(() => setPlaying(false)); } else setPaused(true); }} aria-label={playing ? "Pause hero animation" : "Play hero animation"}>
      <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span><span>{playing ? "Pause" : "Play"}</span>
    </button>}
  </section>;
}
