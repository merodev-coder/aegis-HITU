import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  ScanLine,
  RadioTower,
  FileInput,
  BrainCircuit,
  ShieldCheck,
  ArrowRightLeft,
  Server,
  Container,
  Cloud,
  Code2,
  Database,
  Globe,
} from "lucide-react";



const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};



const features = [
  {
    icon: Shield,
    title: "Real-Time SIEM",
    desc: "Continuous log monitoring with AI-driven anomaly detection and instant alerts across your infrastructure.",
  },
  {
    icon: ScanLine,
    title: "Vulnerability Scanner",
    desc: "Automated scanning for SQL injection, XSS, path traversal, SSRF, and 50+ attack vectors.",
  },
  {
    icon: RadioTower,
    title: "Live Threat Feed",
    desc: "WebSocket-powered live alerts pushed straight to your dashboard the moment threats are detected.",
  },
];

const pipelineSteps = [
  {
    icon: FileInput,
    step: "01",
    title: "Log Ingestion",
    desc: "Aegis collects and normalizes logs from any source — web servers, APIs, firewalls, and cloud platforms — in real time.",
  },
  {
    icon: BrainCircuit,
    step: "02",
    title: "AI Analysis",
    desc: "Our local AI model analyzes every log entry for anomaly patterns: SQLi, XSS, brute-force, privilege escalation, and more.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Threat Mitigation",
    desc: "Critical threats trigger instant alerts, auto-block rules, and detailed forensic reports — all in one unified dashboard.",
  },
];

const integrations = [
  { icon: Server,    label: "Node.js" },
  { icon: Code2,     label: "Python" },
  { icon: Cloud,     label: "AWS" },
  { icon: Container, label: "Docker" },
  { icon: Database,  label: "PostgreSQL" },
  { icon: Globe,     label: "Nginx" },
];



export default function Home() {
  return (
    <div className="relative flex flex-col items-center">
      
      <section className="relative z-10 flex min-h-[90vh] w-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          className="max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          
          <motion.div variants={fadeUp} custom={0} className="mb-6 inline-flex items-center gap-2 rounded-full border border-aegis-primary/20 bg-aegis-primary/5 px-4 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-aegis-primary animate-pulse" />
            <span className="text-xs font-medium text-aegis-primary">
              AI-Powered Threat Detection
            </span>
          </motion.div>

          
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-aegis-text sm:text-5xl lg:text-6xl"
          >
            Security Intelligence
            <br />
            <span className="bg-gradient-to-r from-aegis-primary to-cyan-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </motion.h1>

          
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-aegis-muted"
          >
            Aegis AI analyzes your server logs in real time, detects anomalies
            like SQLi &amp; XSS attacks, and provides actionable intelligence —
            all from a single dashboard.
          </motion.p>

          
          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              to="/dashboard/overview"
              className="inline-flex items-center gap-2 rounded-xl bg-aegis-primary px-6 py-3 text-sm font-semibold text-aegis-bg shadow-lg shadow-aegis-primary/20 transition-all no-underline hover:shadow-aegis-primary/30 hover:brightness-110"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/ai-engine"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-aegis-muted transition-colors no-underline hover:border-aegis-primary/30 hover:text-aegis-text"
            >
              How It Works
            </Link>
          </motion.div>

          
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {[
              "1 M+ Logs Analyzed",
              "99.97% Uptime",
              "< 200 ms Response",
            ].map((stat) => (
              <span
                key={stat}
                className="text-xs font-medium tracking-wide text-aegis-muted/40 uppercase"
              >
                {stat}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      
      <motion.section
        className="relative z-10 w-full max-w-5xl px-4 pb-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} custom={0} className="mb-12 text-center">
          <span className="mb-3 inline-block text-xs font-semibold tracking-widest text-aegis-primary uppercase">
            Core Capabilities
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-aegis-text sm:text-4xl">
            Everything you need to stay protected
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              variants={scaleIn}
              custom={i}
              className="group rounded-2xl border border-white/5 bg-aegis-surface/60 p-6 backdrop-blur-md transition-all hover:border-aegis-primary/20 hover:shadow-lg hover:shadow-aegis-primary/5"
            >
              <div className="mb-4 inline-flex rounded-xl bg-aegis-primary/10 p-3 transition-colors group-hover:bg-aegis-primary/15">
                <feat.icon className="h-5 w-5 text-aegis-primary" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-aegis-text">
                {feat.title}
              </h3>
              <p className="text-sm leading-relaxed text-aegis-muted">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      
      <motion.section
        className="relative z-10 w-full px-4 py-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={staggerContainer}
      >
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} custom={0} className="mb-14 text-center">
            <span className="mb-3 inline-block text-xs font-semibold tracking-widest text-aegis-primary uppercase">
              The Pipeline
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-aegis-text sm:text-4xl">
              How Aegis AI Works
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-aegis-muted">
              From raw log data to actionable threat intelligence — in three
              seamless steps.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {pipelineSteps.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeUp}
                custom={i + 1}
                className="relative rounded-2xl border border-white/5 bg-aegis-surface/60 p-6 backdrop-blur-md"
              >
                
                <span className="absolute -top-3 left-6 rounded-full border border-aegis-primary/30 bg-aegis-bg px-3 py-0.5 text-[11px] font-bold tracking-wider text-aegis-primary">
                  STEP {step.step}
                </span>

                <div className="mb-4 mt-2 inline-flex rounded-xl bg-aegis-primary/10 p-3">
                  <step.icon className="h-5 w-5 text-aegis-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-aegis-text">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-aegis-muted">
                  {step.desc}
                </p>

                
                {i < pipelineSteps.length - 1 && (
                  <div className="absolute top-1/2 -right-3 z-20 hidden -translate-y-1/2 md:block">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-aegis-bg">
                      <ArrowRightLeft className="h-3 w-3 text-aegis-primary" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      
      <motion.section
        className="relative z-10 w-full px-4 pb-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="mx-auto max-w-4xl">
          <motion.div variants={fadeUp} custom={0} className="mb-14 text-center">
            <span className="mb-3 inline-block text-xs font-semibold tracking-widest text-aegis-primary uppercase">
              Ecosystem
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-aegis-text sm:text-4xl">
              Seamless Integrations
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-aegis-muted">
              Pull logs from any platform. Aegis AI connects to the tools your
              team already uses.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {integrations.map((item, i) => (
              <motion.div
                key={item.label}
                variants={scaleIn}
                custom={i}
                className="group flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-aegis-surface/40 py-6 backdrop-blur-md transition-all hover:border-aegis-primary/20 hover:bg-aegis-surface/70"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] transition-colors group-hover:bg-aegis-primary/10">
                  <item.icon className="h-6 w-6 text-aegis-muted transition-colors group-hover:text-aegis-primary" />
                </div>
                <span className="text-xs font-medium text-aegis-muted transition-colors group-hover:text-aegis-text">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      
      <motion.section
        className="relative z-10 w-full px-4 pb-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={staggerContainer}
      >
        <motion.div
          variants={fadeUp}
          custom={0}
          className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-aegis-primary/20 bg-aegis-surface/60 backdrop-blur-md"
        >
          
          <div className="h-px w-full bg-gradient-to-r from-transparent via-aegis-primary/40 to-transparent" />

          <div className="flex flex-col items-center px-6 py-16 text-center sm:px-12">
            <div className="mb-6 inline-flex rounded-2xl bg-aegis-primary/10 p-4">
              <Shield className="h-8 w-8 text-aegis-primary" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-aegis-text sm:text-3xl">
              Ready to secure your infrastructure?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-aegis-muted">
              Get started for free. No credit card required. Deploy Aegis AI
              in minutes and start detecting threats today.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-aegis-primary px-6 py-3 text-sm font-semibold text-aegis-bg shadow-lg shadow-aegis-primary/20 transition-all no-underline hover:shadow-aegis-primary/30 hover:brightness-110"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-aegis-muted transition-colors no-underline hover:border-aegis-primary/30 hover:text-aegis-text"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
