import Link from "next/link";
import Image from "next/image";
export default function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`gl-logo ${light ? "gl-logo-light" : ""}`} aria-label="GoLocal home"><Image src="/brand/golocal-symbol.png" width={54} height={54} alt="" priority /><span>GoLocal<span className="gl-logo-period">.</span></span></Link>;
}
