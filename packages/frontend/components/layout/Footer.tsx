import Link from 'next/link'
import { Github, Twitter, ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-lg mb-2">Bond Credit Vault</h3>
            <p className="text-text-secondary text-sm max-w-md">
              Institutional-grade credit vault powered by AI agents for optimized yield on Arbitrum.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Link
                href="https://github.com/med-amiine/arb-house"
                target="_blank"
                rel="noopener"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Protocol</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/" className="hover:text-text-primary transition-colors">Vault</Link>
              </li>
              <li>
                <Link href="/yield" className="hover:text-text-primary transition-colors">Yield</Link>
              </li>
              <li>
                <Link href="/transactions" className="hover:text-text-primary transition-colors">History</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link
                  href="https://arbiscan.io/address/0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-text-primary transition-colors inline-flex items-center gap-1"
                >
                  Contract
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-text-primary transition-colors">Documentation</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-text-primary transition-colors">FAQ</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            © 2024 Bond Credit Vault. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <Link href="#" className="hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
