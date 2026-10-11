"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { Audience } from "./AudiencePage";
const roles = [{ value: "business", label: "Local business" }, { value: "agent", label: "Agent company" }, { value: "partner", label: "Channel partner" }] as const;
export default function RegistrationForm({ initialType }: { initialType: Audience }) {
  const [type, setType] = useState<Audience>(initialType);
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending"); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, type, startedAt: startedAt.current }), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "We couldn’t save your registration. Please try again.");
      setStatus("success");
    } catch (err) { setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "The connection timed out. Please try again."); setStatus("idle"); }
  }
  if (status === "success") return <div className="gl-form-success" role="status"><span aria-hidden="true">✓</span><h2>You’re on our radar.</h2><p>Your registration has been saved. Our team will review your details and follow up about the right next step.</p><Link className="gl-button" href="/">Back to GoLocal <span aria-hidden="true">→</span></Link></div>;
  return <form className="gl-form" onSubmit={submit}>
    <fieldset><legend>I’m joining as a…</legend><div className="gl-role-options">{roles.map(role => <label key={role.value}><input type="radio" name="type" value={role.value} checked={type === role.value} onChange={() => { setType(role.value); setError(""); }} />{role.label}</label>)}</div></fieldset>
    <label className="gl-field">Company name<input name="company" autoComplete="organization" required maxLength={150} placeholder="Your company or business" /></label>
    <div className="gl-field-row"><label className="gl-field">Your name<input name="name" autoComplete="name" required maxLength={100} placeholder="First and last name" /></label><label className="gl-field">Work email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label></div>
    <label className="gl-field">Website <small>Optional</small><input name="website" maxLength={300} placeholder="https://yourcompany.com" autoComplete="url" /></label>
    {type === "business" && <><div className="gl-field-row"><label className="gl-field">Service category<select name="category" required defaultValue=""><option value="" disabled>Select a service</option>{["Plumbing", "HVAC", "Electrical", "Cleaning", "Landscaping", "Roofing", "Other local services"].map(s => <option key={s}>{s}</option>)}</select></label><label className="gl-field">City / service area<input name="location" required maxLength={200} placeholder="e.g. Salt Lake City, UT" /></label></div><label className="gl-field">Scheduling or CRM software <small>Optional</small><input name="software" maxLength={200} placeholder="e.g. Jobber, Housecall Pro, or none" /></label></>}
    {type === "agent" && <label className="gl-field">What does your agent help people do?<textarea name="use_case" required maxLength={2000} rows={4} placeholder="Tell us about your users, their local service needs and where they are based." /></label>}
    {type === "partner" && <label className="gl-field">Tell us about your business network<textarea name="use_case" required maxLength={2000} rows={4} placeholder="Which businesses do you support, and how would you like to partner?" /></label>}
    <div className="gl-honeypot" aria-hidden="true"><label>Leave this field empty<input name="company_fax" tabIndex={-1} autoComplete="off" /></label></div>
    <label className="gl-consent"><input name="consent" type="checkbox" required value="yes" /><span>I agree that GoLocal may use these details to contact me about registration and partnership opportunities. See our <Link href="/privacy">privacy notice</Link>.</span></label>
    {error && <p className="gl-form-error" role="alert">{error} You can also <a href="mailto:pulkitwalia099@gmail.com">contact our team</a>.</p>}
    <button className="gl-button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Saving your registration…" : type === "business" ? "Register your business" : "Register your interest"}<span aria-hidden="true">↗</span></button>
    <p className="gl-form-footnote">No payment required. Registration does not activate a booking integration.</p>
  </form>;
}
