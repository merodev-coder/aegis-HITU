import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { apiFetch } from "../lib/api";

const cardVariant = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to process request");
      toast.success(json.message || "Reset email sent");
    } catch (err: any) {
      toast.error(err.message || "Failed to request password reset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center px-4">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[420px] w-[420px] rounded-full bg-aegis-primary/[0.04] blur-[100px]" />
      </div>

      <motion.div variants={cardVariant} initial="hidden" animate="visible" className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/5 bg-aegis-surface/70 p-8 backdrop-blur-xl sm:p-10">
          <div className="absolute -top-px right-6 left-6 h-px bg-gradient-to-r from-transparent via-aegis-primary/30 to-transparent" />

          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aegis-primary/10">
              <Shield className="h-7 w-7 text-aegis-primary" />
            </div>
            <h1 className="text-2xl font-bold text-aegis-text">Forgot your password?</h1>
            <p className="mt-1 text-sm text-aegis-muted">Enter your email to receive a secure reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-medium text-aegis-muted">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors focus-within:border-aegis-primary/40">
                <Mail className="h-4 w-4 shrink-0 text-aegis-muted/50" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-aegis-text outline-none placeholder:text-aegis-muted/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-aegis-primary px-5 py-3 text-sm font-semibold text-aegis-bg shadow-lg shadow-aegis-primary/20 transition-all hover:shadow-aegis-primary/30 hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-aegis-muted">
            Remembered it?{" "}
            <Link to="/login" className="font-medium text-aegis-primary no-underline transition-opacity hover:opacity-80">
              Back to login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
