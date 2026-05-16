import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";



const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};



interface Tier {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlighted: boolean;
  cta: string;
  features: string[];
}

const tiers: Tier[] = [
  {
    name: "Developer",
    description: "Perfect for individual developers and small side-projects.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlighted: false,
    cta: "Get Started Free",
    features: [
      "1 monitored asset",
      "500 log entries / day",
      "Basic anomaly detection",
      "Community support",
      "7-day log retention",
    ],
  },
  {
    name: "Pro",
    description: "For growing teams that need real-time protection at scale.",
    monthlyPrice: 10,
    yearlyPrice: 100,
    highlighted: true,
    cta: "Start Pro Trial",
    features: [
      "10 monitored assets",
      "50,000 log entries / day",
      "Advanced AI analysis",
      "Real-time Socket.io alerts",
      "Vulnerability scanner",
      "Slack & Discord webhooks",
      "30-day log retention",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    description: "Custom deployments for organizations with strict compliance needs.",
    monthlyPrice: 50,
    yearlyPrice: 500,
    highlighted: false,
    cta: "Contact Sales",
    features: [
      "Unlimited assets",
      "Unlimited log entries",
      "Custom AI model tuning",
      "Dedicated Groq API deployment",
      "SSO & RBAC",
      "Dedicated account manager",
      "90-day log retention",
      "SLA guarantee",
      "Audit & compliance reports",
    ],
  },
];



export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="flex flex-col items-center">
      
      <motion.section
        className="w-full px-4 pb-16 pt-20 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.span
          variants={fadeUp}
          custom={0}
          className="mb-3 inline-block text-xs font-semibold tracking-widest text-aegis-primary uppercase"
        >
          Pricing
        </motion.span>
        <motion.h1
          variants={fadeUp}
          custom={1}
          className="mb-5 text-3xl font-extrabold tracking-tight text-aegis-text sm:text-4xl lg:text-5xl"
        >
          Simple, transparent pricing
        </motion.h1>
        <motion.p
          variants={fadeUp}
          custom={2}
          className="mx-auto mb-10 max-w-md text-lg text-aegis-muted"
        >
          Start free, scale securely. No hidden fees.
        </motion.p>

        
        <motion.div
          variants={fadeUp}
          custom={3}
          className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-aegis-surface/60 px-1.5 py-1.5 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              !yearly
                ? "bg-aegis-primary text-aegis-bg shadow-md shadow-aegis-primary/20"
                : "bg-transparent text-aegis-muted hover:text-aegis-text"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              yearly
                ? "bg-aegis-primary text-aegis-bg shadow-md shadow-aegis-primary/20"
                : "bg-transparent text-aegis-muted hover:text-aegis-text"
            }`}
          >
            Yearly
            <span className="ml-1.5 rounded-full bg-aegis-success/15 px-2 py-0.5 text-[10px] font-semibold text-aegis-success">
              -20%
            </span>
          </button>
        </motion.div>
      </motion.section>

      
      <motion.section
        className="w-full max-w-6xl px-4 pb-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => {
            const price = yearly ? tier.yearlyPrice : tier.monthlyPrice;
            const period = yearly ? "/year" : "/month";
            const isFree = tier.monthlyPrice === 0;

            return (
              <motion.div
                key={tier.name}
                variants={fadeUp}
                custom={i}
                className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-md transition-all sm:p-8 ${
                  tier.highlighted
                    ? "border-aegis-primary/30 bg-aegis-surface/80 shadow-xl shadow-aegis-primary/5"
                    : "border-white/5 bg-aegis-surface/50"
                }`}
              >
                
                {tier.highlighted && (
                  <>
                    <div className="absolute -top-px right-0 left-0 h-px bg-gradient-to-r from-transparent via-aegis-primary to-transparent" />
                    <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-aegis-primary px-3 py-1 text-[10px] font-bold tracking-wider text-aegis-bg uppercase">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  </>
                )}

                
                <h3 className="mb-1 text-xl font-bold text-aegis-text">
                  {tier.name}
                </h3>
                <p className="mb-6 text-sm text-aegis-muted">{tier.description}</p>

                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-aegis-text">
                      {isFree ? "Free" : `$${price}`}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-aegis-muted">{period}</span>
                    )}
                  </div>
                  {yearly && !isFree && (
                    <p className="mt-1 text-xs text-aegis-success">
                      Save ${(tier.monthlyPrice * 12 - tier.yearlyPrice).toFixed(0)} per year
                    </p>
                  )}
                </div>

                
                <Link
                  to="/signup"
                  className={`mb-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all no-underline ${
                    tier.highlighted
                      ? "bg-aegis-primary text-aegis-bg shadow-lg shadow-aegis-primary/20 hover:brightness-110"
                      : "border border-white/10 text-aegis-muted hover:border-aegis-primary/30 hover:text-aegis-text"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                
                <div className="border-t border-white/5 pt-6">
                  <span className="mb-3 block text-[10px] font-semibold tracking-widest text-aegis-muted/50 uppercase">
                    What&apos;s included
                  </span>
                  <ul className="flex flex-col gap-3">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-aegis-primary" />
                        <span className="text-sm text-aegis-muted">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
