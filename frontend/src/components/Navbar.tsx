import { Link, useLocation } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "AI Engine", to: "/ai-engine" },
  { label: "Pricing", to: "/pricing" },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();
  const isAuthenticated = !!user;

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-aegis-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aegis-primary/10">
            <Shield className="h-5 w-5 text-aegis-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-aegis-text">
            Aegis <span className="text-aegis-primary">AI</span>
          </span>
        </Link>

        
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? "bg-aegis-primary/10 text-aegis-primary"
                    : "text-aegis-muted hover:bg-white/5 hover:text-aegis-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-aegis-primary px-4 py-2 text-sm font-semibold text-aegis-bg transition-opacity no-underline hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-aegis-muted transition-colors no-underline hover:text-aegis-text"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-aegis-primary px-4 py-2 text-sm font-semibold text-aegis-bg transition-opacity no-underline hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-transparent p-2 text-aegis-muted transition-colors hover:text-aegis-text md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      
      {mobileOpen && (
        <div className="border-t border-white/5 bg-aegis-bg/95 px-4 pb-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors no-underline ${
                    isActive
                      ? "bg-aegis-primary/10 text-aegis-primary"
                      : "text-aegis-muted hover:bg-white/5 hover:text-aegis-text"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-aegis-primary px-4 py-2.5 text-center text-sm font-semibold text-aegis-bg transition-opacity no-underline hover:opacity-90"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-center text-sm font-medium text-aegis-muted transition-colors no-underline hover:text-aegis-text"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-aegis-primary px-4 py-2.5 text-center text-sm font-semibold text-aegis-bg transition-opacity no-underline hover:opacity-90"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
