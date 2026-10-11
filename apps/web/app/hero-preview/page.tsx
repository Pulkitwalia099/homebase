import Navigation from "@/components/golocal/Navigation";
import HeroComparison from "@/components/golocal/HeroComparison";

export const metadata = { title: "Hero explorations", robots: { index: false, follow: false } };

export default function HeroPreview() {
  return <><Navigation /><main id="main"><HeroComparison /></main></>;
}
