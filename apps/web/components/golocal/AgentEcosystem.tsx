import Image from "next/image";

export default function AgentEcosystem() {
  return <div className="gl-agent-ecosystem">
    <p className="gl-eyebrow">YOUR AGENT. YOUR EVERYDAY CHAT.</p>
    <h3>One local network, across personal agents.</h3>
    <div className="gl-agent-brands" aria-label="Agent ecosystem examples">
      <span className="gl-agent-brand gl-agent-brand-dots"><small>ChatGPT</small><strong>dots</strong></span>
      <span className="gl-agent-brand gl-agent-brand-muse"><Image src="/agents/muse.png" alt="Muse" width={256} height={197} /></span>
      <span className="gl-agent-brand gl-agent-brand-instinct">Instinct</span>
      <span className="gl-agent-brand gl-agent-brand-openclaw"><Image src="/agents/openclaw.jpeg" alt="OpenClaw" width={377} height={133} /></span>
      <span className="gl-agent-brand gl-agent-brand-hermes"><Image src="/agents/hermes.png" alt="" width={554} height={554} /><span>Hermes</span></span>
    </div>
    <p className="gl-agent-ecosystem-copy">We’re building GoLocal to connect with ChatGPT Dots and agents like Muse, Instinct, OpenClaw and Hermes—so local services fit into the conversations you already have.</p>
    <small>Illustrative ecosystem. GoLocal integrations are in development; availability depends on the agent and supported messaging channel.</small>
  </div>;
}
