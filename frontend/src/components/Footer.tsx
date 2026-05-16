import { Shield } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-aegis-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aegis-primary/10">
                <Shield className="h-5 w-5 text-aegis-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight text-aegis-text">
                Aegis <span className="text-aegis-primary">AI</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-aegis-muted">
              AI-powered security intelligence. Detect anomalies, scan
              vulnerabilities, and protect your infrastructure in real time.
            </p>
          </div>

          
          <div>
            <h4 className="mb-3 text-xs font-semibold tracking-widest text-aegis-muted/60 uppercase">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/ai-engine" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  AI Engine
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          
          <div>
            <h4 className="mb-3 text-xs font-semibold tracking-widest text-aegis-muted/60 uppercase">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  Community
                </a>
              </li>
            </ul>
          </div>

          
          <div>
            <h4 className="mb-3 text-xs font-semibold tracking-widest text-aegis-muted/60 uppercase">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-aegis-muted transition-colors no-underline hover:text-aegis-text">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-aegis-muted/50">
            &copy; {currentYear} Aegis AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-aegis-muted/40">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-aegis-primary animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
