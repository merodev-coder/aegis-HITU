import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Missing reset token.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reset password");

      toast.success("Password reset successful. Please log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
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
            <h1 className="text-2xl font-bold text-aegis-text">Set New Password</h1>
            <p className="mt-1 text-sm text-aegis-muted">Choose a strong password for your Aegis AI account.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-aegis-muted">
                New Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors focus-within:border-aegis-primary/40">
                <Lock className="h-4 w-4 shrink-0 text-aegis-muted/50" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-aegis-text outline-none placeholder:text-aegis-muted/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 bg-transparent p-0 text-aegis-muted/50 transition-colors hover:text-aegis-muted"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-aegis-muted">
                Confirm Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors focus-within:border-aegis-primary/40">
                <Lock className="h-4 w-4 shrink-0 text-aegis-muted/50" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-aegis-text outline-none placeholder:text-aegis-muted/40"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="shrink-0 bg-transparent p-0 text-aegis-muted/50 transition-colors hover:text-aegis-muted"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-aegis-primary px-5 py-3 text-sm font-semibold text-aegis-bg shadow-lg shadow-aegis-primary/20 transition-all hover:shadow-aegis-primary/30 hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-aegis-muted">
            Back to{" "}
            <Link to="/login" className="font-medium text-aegis-primary no-underline transition-opacity hover:opacity-80">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
