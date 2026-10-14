import Image from "next/image";

const platforms = [
  ["Housecall Pro", "housecall-pro.png"],
  ["Jobber", "jobber.svg"],
  ["ServiceTitan", "servicetitan.svg"],
  ["FieldEdge", "fieldedge.svg"],
  ["Workiz", "workiz.png"],
  ["ServiceM8", "servicem8.webp"],
  ["Service Fusion", "service-fusion.svg"],
  ["BuildOps", "buildops.svg"],
  ["Simpro", "simpro.svg"],
  ["Kickserv", "kickserv.svg"],
  ["Commusoft", "commusoft.svg"],
  ["Joblogic", "joblogic.png"],
];

export default function BusinessStack() {
  return <section className="gl-business-stack" aria-labelledby="business-stack-title">
    <div className="gl-container">
      <div className="gl-stack-heading">
        <div><p className="gl-eyebrow">FOR HOME-SERVICE BUSINESSES</p><h2 id="business-stack-title">Works with your <br /><em>existing tech stack.</em></h2></div>

      </div>
      <ul className="gl-stack-logos" aria-label="Business software platforms">
        {platforms.map(([name, file]) => <li key={name}><Image src={`/software/${file}`} alt={name} width={180} height={52} unoptimized /></li>)}
      </ul>
    </div>
  </section>;
}
