import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Mail, AlertTriangle, Loader2, Zap, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiFetch } from "../lib/api";

interface AnalysisResult {
  riskScore: number;
  redFlags: string[];
  recommendation: string;
}

export default function PhishingAnalyzer() {
  const [emailText, setEmailText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!emailText.trim()) {
      toast.error("Please enter email content to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await apiFetch("/api/ai/analyze-phishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailText }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze email.");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Analysis complete");
    } catch (error) {
      console.error(error);
      toast.error("Error analyzing email. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return "#ef4444"; // Red
    if (score >= 40) return "#f59e0b"; // Amber
    return "#00d4c3"; // Teal
  };

  const getRiskLabel = (score: number) => {
    if (score >= 75) return "CRITICAL RISK";
    if (score >= 40) return "SUSPICIOUS";
    return "SAFE";
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Mail className="h-6 w-6 text-aegis-primary" />
          Phishing Analyzer
        </h1>
        <p className="text-sm text-aegis-muted">
          Paste an email below to analyze it for phishing attempts, social engineering, and malicious intent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
        {/* Left Column: Input */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden flex flex-col shadow-lg">
            <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-aegis-text uppercase tracking-wider font-mono">Email Content</span>
            </div>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste the suspicious email content here..."
              className="flex-1 w-full resize-none bg-transparent p-4 text-sm text-aegis-text placeholder-aegis-muted/50 focus:outline-none scrollbar-none font-mono"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !emailText.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-aegis-primary px-6 py-4 text-sm font-bold text-aegis-bg transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,212,195,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                ANALYZING...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                ANALYZE EMAIL
              </>
            )}
          </button>
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col gap-4 overflow-y-auto scrollbar-none">
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-8 text-center"
              >
                <ShieldAlert className="h-12 w-12 text-aegis-muted/30" />
                <div>
                  <p className="text-lg font-medium text-aegis-text">Awaiting Analysis</p>
                  <p className="mt-1 text-sm text-aegis-muted">Submit an email to view the risk assessment</p>
                </div>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[400px] flex-col items-center justify-center gap-6 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-8 text-center"
              >
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-aegis-primary/30 border-t-aegis-primary"
                  />
                  <ShieldAlert className="h-8 w-8 text-aegis-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-medium text-aegis-text">AI is scanning content</p>
                  <p className="mt-1 text-sm text-aegis-muted animate-pulse">Checking for urgency hooks, malicious links, and spoofing...</p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Score Panel */}
                <div className="flex items-center gap-6 rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: getRiskColor(result.riskScore) }} />
                  
                  <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="8"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={getRiskColor(result.riskScore)}
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * result.riskScore) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold" style={{ color: getRiskColor(result.riskScore) }}>
                        {result.riskScore}
                      </span>
                      <span className="text-[10px] text-aegis-muted font-mono uppercase tracking-widest">Score</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-aegis-muted uppercase tracking-wider font-mono">
                      Risk Assessment
                    </span>
                    <h2 className="text-2xl font-bold" style={{ color: getRiskColor(result.riskScore) }}>
                      {getRiskLabel(result.riskScore)}
                    </h2>
                    <p className="text-sm text-aegis-muted mt-1 leading-relaxed">
                      {result.recommendation}
                    </p>
                  </div>
                </div>

                {/* Red Flags Panel */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md shadow-lg">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-aegis-text uppercase tracking-wider font-mono mb-4">
                    <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                    Detected Red Flags
                  </h3>
                  
                  {result.redFlags.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {result.redFlags.map((flag: any, idx: number) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={idx}
                          className="flex items-start gap-3 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 p-3"
                        >
                          <div className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                          <p className="text-sm text-aegis-text/90 leading-relaxed">{flag}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-aegis-success/20 bg-aegis-success/5 p-4 text-aegis-success">
                      <ShieldCheck className="h-5 w-5" />
                      <p className="text-sm font-medium">No obvious red flags detected in this email.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
