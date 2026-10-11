"use client";

import { useState } from "react";
import AnimatedHero from "./AnimatedHero";

export default function HeroComparison() {
  const [variant, setVariant] = useState<"scene" | "message">("message");
  return <>
    <div className="gl-hero-compare-bar"><div><strong>One request. A whole home in motion.</strong><p>Two ways to bring GoLocal to life.</p></div><div role="group" aria-label="Hero version"><button aria-pressed={variant === "scene"} onClick={() => setVariant("scene")}>01 · The living neighborhood</button><button aria-pressed={variant === "message"} onClick={() => setVariant("message")}>02 · Just message your agent</button></div></div>
    <AnimatedHero key={variant} variant={variant} />
    <p className="gl-hero-preview-note">Concept animation. Explore the <a href="/demo">booking conversation demo →</a></p>
  </>;
}
