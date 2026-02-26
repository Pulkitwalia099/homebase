import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0A1628] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Product</h4>
            <div className="space-y-2">
              <Link href="/demo" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Demo</Link>
              <Link href="/taxonomy" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Taxonomy</Link>
              <Link href="/demo" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Try Demo</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Developers</h4>
            <div className="space-y-2">
              <Link href="/developers" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">API Docs</Link>
              <Link href="/developers#waitlist" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Get API Access</Link>
              <Link href="/skill.md" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Agent Skill</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-sm">For Pros</h4>
            <div className="space-y-2">
              <Link href="/pros" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">How It Works</Link>
              <Link href="/pros#apply" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Apply to Join</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Company</h4>
            <div className="space-y-2">
              <a href="mailto:pwalia@mba2027.hbs.edu" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Link href="/" className="text-sm font-bold">
            <span className="text-white">Home</span>
            <span className="text-amber">Base</span>
          </Link>
          <span className="text-sm text-gray-600">© 2026 HomeBase AI</span>
        </div>
      </div>
    </footer>
  );
}
