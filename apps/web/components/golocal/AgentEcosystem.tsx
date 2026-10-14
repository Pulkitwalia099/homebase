import Image from "next/image";

export default function AgentEcosystem() {
  return <div className="gl-agent-ecosystem">
    <p className="gl-eyebrow">YOUR AGENT. YOUR EVERYDAY CHAT.</p>
    <h3>Works with your AI agents.</h3>
    <div className="gl-agent-brands" aria-label="Agent ecosystem examples">
      <span className="gl-agent-brand gl-agent-brand-dots"><small>ChatGPT</small><strong>dots</strong></span>
      <span className="gl-agent-brand gl-agent-brand-muse gl-agent-coming-soon" aria-label="Muse, coming soon"><Image src="/agents/muse.png" alt="Muse" width={256} height={197} /><sup aria-hidden="true">*</sup></span>
      <span className="gl-agent-brand gl-agent-brand-instinct gl-agent-coming-soon" aria-label="Instinct, coming soon">Instinct<sup aria-hidden="true">*</sup></span>
      <span className="gl-agent-brand gl-agent-brand-openclaw"><Image src="/agents/openclaw.jpeg" alt="OpenClaw" width={377} height={133} /></span>
      <span className="gl-agent-brand gl-agent-brand-hermes"><Image src="/agents/hermes.png" alt="" width={554} height={554} /><span>Hermes</span></span>
    </div>
    <p className="gl-agent-ecosystem-copy">Stay with the personal agent you already use. GoLocal connects local services to a growing agent ecosystem.</p>
    <small>* Coming soon. Availability depends on the agent and supported messaging channel.</small>
  </div>;
}
