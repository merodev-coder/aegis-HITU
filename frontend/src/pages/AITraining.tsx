import { BrainCircuit, ThumbsUp, ThumbsDown, CheckCircle2, Loader2, AlertTriangle, ChevronRight, CornerDownRight, FileText, Code, Mail, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../lib/api";

type ThreatSource = "LOG" | "CODE" | "EMAIL" | "CHAT";
type ReviewStatus = "PENDING" | "CONFIRMED" | "FALSE_POSITIVE";

interface IThreat {
  _id: string;
  source: ThreatSource;
  sourceTitle: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  reviewStatus: ReviewStatus;
  rawSnippet?: string;
  createdAt: string;
}

export default function AITraining() {
  const [threats, setThreats] = useState<Record<ThreatSource, IThreat[]>>({
    LOG: [],
    CODE: [],
    EMAIL: [],
    CHAT: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ThreatSource>("LOG");
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/training/pending")
      .then((res) => res.json())
      .then((data) => {
        setThreats(data.threats || { LOG: [], CODE: [], EMAIL: [], CHAT: [] });
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load pending threats.");
        setLoading(false);
      });
  }, []);

  const handleReview = async (id: string, action: "CONFIRMED" | "FALSE_POSITIVE") => {
    setReviewingId(id);
    try {
      const res = await apiFetch("/api/training/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threatId: id, newStatus: action }),
      });
      const data = await res.json();
      if (res.ok) {
        setThreats((prev) => {
          const newThreats = { ...prev };
          for (const key of Object.keys(newThreats) as ThreatSource[]) {
            newThreats[key] = newThreats[key].filter((t) => t._id !== id);
          }
          return newThreats;
        });
        toast.success(data.message);
      } else {
        toast.error(data.error || "Review failed.");
      }
    } catch {
      toast.error("Network error. Is the backend running?");
    } finally {
      setReviewingId(null);
    }
  };

  const toggleSource = (sourceTitle: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [sourceTitle]: !prev[sourceTitle],
    }));
  };

  const tabs: { id: ThreatSource; label: string; icon: React.ElementType }[] = [
    { id: "LOG", label: "Logs", icon: FileText },
    { id: "CODE", label: "Code", icon: Code },
    { id: "EMAIL", label: "Emails", icon: Mail },
    { id: "CHAT", label: "Chat", icon: MessageSquare },
  ];

  const currentThreats = threats[activeTab] || [];

  // Group threats by sourceTitle
  const groupedThreats = currentThreats.reduce((acc, threat) => {
    if (!acc[threat.sourceTitle]) {
      acc[threat.sourceTitle] = [];
    }
    acc[threat.sourceTitle].push(threat);
    return acc;
  }, {} as Record<string, IThreat[]>);

  const totalPending = Object.values(threats).flat().length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-aegis-text">
            AI Review Inbox
          </h1>
          <p className="mt-1 text-sm text-aegis-muted">
            Review flagged anomalies to improve model accuracy.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-aegis-primary/20 bg-aegis-primary/5 px-3 py-1.5 self-start sm:self-auto">
          <BrainCircuit className="h-4 w-4 text-aegis-primary" />
          <span className="text-xs font-medium text-aegis-primary">
            Aegis Core Model v2.4
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 backdrop-blur-md">
          <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
          <span className="text-sm font-medium text-aegis-text">{totalPending}</span>
          <span className="text-xs text-aegis-muted">pending total</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/[0.06] overflow-x-auto scrollbar-none pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = threats[tab.id].length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold font-mono tracking-wide transition-all whitespace-nowrap ${
                isActive
                  ? "text-aegis-primary border-b-2 border-aegis-primary bg-aegis-primary/5 rounded-t-lg"
                  : "text-aegis-muted hover:text-aegis-text hover:bg-white/[0.02] rounded-t-lg"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-aegis-primary/20 text-aegis-primary' : 'bg-white/10 text-aegis-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-aegis-primary animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {Object.keys(groupedThreats).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center bg-white/[0.01]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aegis-success/10 border border-aegis-success/20">
                  <CheckCircle2 className="h-6 w-6 text-aegis-success" />
                </div>
                <h3 className="text-lg font-medium text-aegis-text">Queue Empty</h3>
                <p className="mt-1 text-sm text-aegis-muted">All anomalies in {activeTab.toLowerCase()} have been reviewed.</p>
              </motion.div>
            ) : (
              Object.entries(groupedThreats).map(([sourceTitle, sourceThreats]) => (
                <motion.div
                  key={sourceTitle}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  className="flex flex-col rounded-xl border border-white/5 bg-aegis-surface/60 backdrop-blur-md overflow-hidden"
                >
                  <button
                    onClick={() => toggleSource(sourceTitle)}
                    className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight className={`h-4 w-4 text-aegis-muted transition-transform duration-200 ${expandedSources[sourceTitle] ? 'rotate-90' : ''}`} />
                      <span className="font-semibold text-sm text-aegis-text font-mono truncate max-w-md">{sourceTitle}</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-aegis-muted">{sourceThreats.length} threats</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedSources[sourceTitle] && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-px bg-white/[0.06]">
                          {sourceThreats.map((threat) => (
                            <div key={threat._id} className="p-4 bg-[#0a0a0a] flex flex-col gap-3">
                              
                              <div className="flex items-start gap-3">
                                <CornerDownRight className="h-4 w-4 shrink-0 mt-0.5 text-aegis-primary" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                                      threat.severity === 'critical' ? 'bg-[#ff3b30]/10 border-[#ff3b30]/30 text-[#ff3b30]' :
                                      threat.severity === 'high' ? 'bg-[#ff9500]/10 border-[#ff9500]/30 text-[#ff9500]' :
                                      'bg-[#ffcc00]/10 border-[#ffcc00]/30 text-[#ffcc00]'
                                    }`}>
                                      {threat.severity}
                                    </span>
                                    <span className="text-xs text-aegis-muted/50 font-mono">{new Date(threat.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="text-sm leading-relaxed text-aegis-text/90">{threat.description}</p>
                                  {threat.rawSnippet && (
                                    <div className="mt-2 bg-[#050505]/60 border border-white/[0.03] rounded-md px-3 py-2 overflow-x-auto scrollbar-none">
                                      <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap text-aegis-muted/70">
                                        {threat.rawSnippet}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                                  <button
                                    onClick={() => handleReview(threat._id, "FALSE_POSITIVE")}
                                    disabled={reviewingId === threat._id}
                                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-aegis-muted transition-colors hover:bg-white/10 disabled:opacity-50"
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                    False Positive
                                  </button>
                                  <button
                                    onClick={() => handleReview(threat._id, "CONFIRMED")}
                                    disabled={reviewingId === threat._id}
                                    className="flex items-center gap-1.5 rounded-lg border border-[#ff3b30]/50 bg-[#ff3b30]/10 px-3 py-1.5 text-[11px] font-medium text-[#ff3b30] shadow-[0_0_10px_rgba(255,59,48,0.2)] transition-colors hover:bg-[#ff3b30]/20 disabled:opacity-50"
                                  >
                                    {reviewingId === threat._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <ThumbsUp className="h-3 w-3" />
                                    )}
                                    Confirm Threat
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
