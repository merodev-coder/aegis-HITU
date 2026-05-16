import { motion } from "framer-motion";
import {
  FileInput,
  Cpu,
  BrainCircuit,
  ShieldAlert,
  Bell,
  BarChart3,
  ArrowDown,
  Zap,
  Eye,
  Layers,
  GitBranch,
  Database,
} from "lucide-react";



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
  visible: { transition: { staggerChildren: 0.1 } },
};



const pipeline = [
  {
    icon: FileInput,
    title: "Log Ingestion",
    desc: "Raw logs are collected from your servers, APIs, and cloud infrastructure via secure endpoints or agent-based collectors.",
    details: [
      "Supports Apache, Nginx, Express, Cloudflare",
      "JSON, syslog, and custom formats",
      "Batched & streamed ingestion modes",
    ],
  },
  {
    icon: Cpu,
    title: "Feature Extraction",
    desc: "The preprocessing engine normalizes, tokenizes, and extracts high-signal features from raw log lines.",
    details: [
      "IP geolocation & reputation scoring",
      "Request pattern fingerprinting",
      "Payload entropy analysis",
    ],
  },
  {
    icon: BrainCircuit,
    title: "AI Anomaly Detection",
    desc: "A cloud-hosted LLM (via Groq API) and statistical models analyze features to classify each event as normal, suspicious, or malicious.",
    details: [
      "LLM-based contextual reasoning",
      "Time-series anomaly detection",
      "Multi-model ensemble scoring",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Threat Classification",
    desc: "Detected anomalies are categorized by attack type and severity: Critical, High, Medium, or Low.",
    details: [
      "SQLi, XSS, Path Traversal, SSRF",
      "Brute-force & credential stuffing",
      "Zero-day pattern heuristics",
    ],
  },
  {
    icon: Bell,
    title: "Real-Time Alerting",
    desc: "Critical and high-severity threats are instantly pushed to your dashboard via WebSocket and optional webhooks.",
    details: [
      "Socket.io live push to frontend",
      "Slack, Discord & email webhooks",
      "Auto-block rule triggers",
    ],
  },
  {
    icon: BarChart3,
    title: "Reporting & Feedback",
    desc: "Forensic reports are generated, and analyst feedback loops back to improve AI accuracy over time.",
    details: [
      "Detailed attack timeline reports",
      "True/false positive feedback loop",
      "Model prompt tuning via dashboard",
    ],
  },
];

const capabilities = [
  {
    icon: Zap,
    title: "Sub-200ms Latency",
    desc: "From log ingestion to alert delivery in under 200 milliseconds for critical threats.",
  },
  {
    icon: Eye,
    title: "Deep Inspection",
    desc: "Payloads are decoded, deobfuscated, and deeply inspected — not just pattern-matched.",
  },
  {
    icon: Layers,
    title: "Multi-Layer Defense",
    desc: "Statistical models, rule engines, and LLM reasoning work together in an ensemble pipeline.",
  },
  {
    icon: GitBranch,
    title: "Adaptive Learning",
    desc: "The model evolves with your infrastructure. Analyst feedback fine-tunes detection accuracy.",
  },
  {
    icon: Database,
    title: "Scalable Storage",
    desc: "Elasticsearch-backed log storage allows instant search across billions of events.",
  },
  {
    icon: BrainCircuit,
    title: "Cloud AI — Ultra Fast",
    desc: "Aegis leverages Groq's high-speed inference API for sub-second AI analysis with enterprise-grade reliability.",
  },
];



export default function AIEngine() {
  return (
    <div className="flex flex-col items-center">
      
      <motion.section
        className="w-full px-4 pb-20 pt-20 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.span
          variants={fadeUp}
          custom={0}
          className="mb-3 inline-block text-xs font-semibold tracking-widest text-aegis-primary uppercase"
        >
          AI Engine
        </motion.span>
        <motion.h1
          variants={fadeUp}
          custom={1}
          className="mx-auto mb-5 max-w-2xl text-3xl font-extrabold tracking-tight text-aegis-text sm:text-4xl lg:text-5xl"
        >
          Under the Hood of{" "}
          <span className="bg-gradient-to-r from-aegis-primary to-cyan-400 bg-clip-text text-transparent">
            Aegis Intelligence
          </span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          custom={2}
          className="mx-auto max-w-xl text-lg text-aegis-muted"
        >
          A visual walkthrough of how raw server logs transform into
          actionable security intelligence — all processed locally.
        </motion.p>
      </motion.section>

      
      <motion.section
        className="w-full max-w-3xl px-4 pb-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={stagger}
      >
        <div className="relative flex flex-col gap-0">
          {pipeline.map((step, i) => (
            <div key={step.title} className="relative">
              
              <motion.div
                variants={fadeUp}
                custom={i}
                className="relative rounded-2xl border border-white/5 bg-aegis-surface/60 p-6 backdrop-blur-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-aegis-primary/10">
                    <step.icon className="h-6 w-6 text-aegis-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-3">
                      <span className="rounded-full border border-aegis-primary/30 bg-aegis-bg px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-aegis-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-lg font-semibold text-aegis-text">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-aegis-muted">
                      {step.desc}
                    </p>

                    
                    <div className="flex flex-wrap gap-2">
                      {step.details.map((d) => (
                        <span
                          key={d}
                          className="rounded-lg bg-white/[0.03] px-2.5 py-1 text-xs text-aegis-muted/70"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              
              {i < pipeline.length - 1 && (
                <motion.div
                  variants={fadeUp}
                  custom={i + 0.5}
                  className="flex justify-center py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-aegis-bg">
                    <ArrowDown className="h-4 w-4 text-aegis-primary/60" />
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      
      <motion.section
        className="w-full px-4 pb-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} custom={0} className="mb-12 text-center">
            <span className="mb-3 inline-block text-xs font-semibold tracking-widest text-aegis-primary uppercase">
              Why Aegis
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-aegis-text sm:text-4xl">
              Built for modern threats
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                variants={fadeUp}
                custom={i + 1}
                className="group rounded-2xl border border-white/5 bg-aegis-surface/40 p-5 backdrop-blur-md transition-all hover:border-aegis-primary/20"
              >
                <div className="mb-3 inline-flex rounded-xl bg-aegis-primary/10 p-2.5 transition-colors group-hover:bg-aegis-primary/15">
                  <cap.icon className="h-5 w-5 text-aegis-primary" />
                </div>
                <h4 className="mb-1.5 text-sm font-semibold text-aegis-text">
                  {cap.title}
                </h4>
                <p className="text-xs leading-relaxed text-aegis-muted">
                  {cap.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
