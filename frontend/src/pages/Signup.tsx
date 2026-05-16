import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";



const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;



const cardVariant = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};



export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: SignupForm) => {
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, fullName: data.fullName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Signup failed");

      login(json.user);
      navigate("/dashboard/overview");
      toast.success("Account created successfully!");
    } catch (err: any) { 
      toast.error(err.message);
    }
  };

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (passwordValue.length >= 8) score += 1;
    if (/[A-Z]/.test(passwordValue)) score += 1;
    if (/[0-9]/.test(passwordValue)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score += 1;
    return score;
  }, [passwordValue]);

  const strengthColor =
    passwordStrength === 0 ? "bg-white/10" :
    passwordStrength === 1 ? "bg-aegis-critical" :
    passwordStrength === 2 ? "bg-aegis-warning" :
    passwordStrength === 3 ? "bg-aegis-medium" :
    "bg-aegis-success";

  const strengthLabel =
    passwordStrength === 0 ? "" :
    passwordStrength === 1 ? "Weak" :
    passwordStrength === 2 ? "Fair" :
    passwordStrength === 3 ? "Good" :
    "Strong";

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center px-4 py-12">
      
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[420px] w-[420px] rounded-full bg-aegis-primary/[0.04] blur-[100px]" />
      </div>

      <motion.div
        variants={cardVariant}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        
        <div className="rounded-2xl border border-white/5 bg-aegis-surface/70 p-8 backdrop-blur-xl sm:p-10">
          
          <div className="absolute -top-px right-6 left-6 h-px bg-gradient-to-r from-transparent via-aegis-primary/30 to-transparent" />

          
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aegis-primary/10">
              <Shield className="h-7 w-7 text-aegis-primary" />
            </div>
            <h1 className="text-2xl font-bold text-aegis-text">Create an account</h1>
            <p className="mt-1 text-sm text-aegis-muted">
              Start securing your infrastructure with Aegis AI
            </p>
          </div>

          
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            
            <div>
              <label htmlFor="signup-name" className="mb-1.5 block text-xs font-medium text-aegis-muted">
                Full Name
              </label>
              <div
                className={`flex items-center gap-2 rounded-xl border bg-white/[0.03] px-3.5 py-2.5 transition-colors focus-within:border-aegis-primary/40 ${
                  errors.fullName ? "border-aegis-critical/40" : "border-white/10"
                }`}
              >
                <User className="h-4 w-4 shrink-0 text-aegis-muted/50" />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  className="w-full bg-transparent text-sm text-aegis-text outline-none placeholder:text-aegis-muted/40"
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-aegis-critical">{errors.fullName.message}</p>
              )}
            </div>

            
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-xs font-medium text-aegis-muted">
                Email
              </label>
              <div
                className={`flex items-center gap-2 rounded-xl border bg-white/[0.03] px-3.5 py-2.5 transition-colors focus-within:border-aegis-primary/40 ${
                  errors.email ? "border-aegis-critical/40" : "border-white/10"
                }`}
              >
                <Mail className="h-4 w-4 shrink-0 text-aegis-muted/50" />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-aegis-text outline-none placeholder:text-aegis-muted/40"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-aegis-critical">{errors.email.message}</p>
              )}
            </div>

            
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-xs font-medium text-aegis-muted">
                Password
              </label>
              <div
                className={`flex items-center gap-2 rounded-xl border bg-white/[0.03] px-3.5 py-2.5 transition-colors focus-within:border-aegis-primary/40 ${
                  errors.password ? "border-aegis-critical/40" : "border-white/10"
                }`}
              >
                <Lock className="h-4 w-4 shrink-0 text-aegis-muted/50" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full bg-transparent text-sm text-aegis-text outline-none placeholder:text-aegis-muted/40"
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 bg-transparent p-0 text-aegis-muted/50 transition-colors hover:text-aegis-muted"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              
              {passwordValue.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-full rounded-full transition-colors duration-300 ${
                          passwordStrength >= i ? strengthColor : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-aegis-muted">
                    <span>{strengthLabel && `Strength: ${strengthLabel}`}</span>
                    {passwordStrength === 4 && (
                      <span className="flex items-center gap-1 text-aegis-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Ready to go
                      </span>
                    )}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-aegis-critical">{errors.password.message}</p>
              )}
            </div>

            
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-aegis-primary px-5 py-3 text-sm font-semibold text-aegis-bg shadow-lg shadow-aegis-primary/20 transition-all hover:shadow-aegis-primary/30 hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          
          <p className="mt-8 text-center text-sm text-aegis-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-aegis-primary no-underline transition-opacity hover:opacity-80">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
