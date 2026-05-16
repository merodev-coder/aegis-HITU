import {
  Terminal,
  UploadCloud,
  File as FileIcon,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  X,
  Zap,
  CheckCircle,
  Server,
  CornerDownRight,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAegisStore } from "../store/aegisStore";
import { apiFetch } from "../lib/api";




export interface LedgerItem {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "safe";
  type: string;
  sourceIp: string;
  targetUrl: string;
  timestamp: string;
  analysis: string;
  logSnippet: string;
}

type StreamPhase = "idle" | "uploading" | "streaming" | "parsing" | "complete" | "error";




const severityConfig: Record<
  LedgerItem["severity"],
  { border: string; bg: string; text: string; icon: React.ReactNode; label: string; badge: string }
> = {
  critical: {
    border: "border-l-[#ff3b30]",
    bg: "bg-[#ff3b30]/10",
    text: "text-[#ff3b30]",
    icon: <AlertTriangle className="h-4 w-4 text-[#ff3b30]" />,
    label: "CRITICAL",
    badge: "bg-[#ff3b30]/20 border-[#ff3b30]/40 text-[#ff3b30] shadow-[0_0_10px_rgba(255,59,48,0.4)]"
  },
  high: {
    border: "border-l-[#ff9500]",
    bg: "bg-[#ff9500]/10",
    text: "text-[#ff9500]",
    icon: <AlertTriangle className="h-4 w-4 text-[#ff9500]" />,
    label: "HIGH",
    badge: "bg-[#ff9500]/20 border-[#ff9500]/40 text-[#ff9500] shadow-[0_0_10px_rgba(255,149,0,0.4)]"
  },
  medium: {
    border: "border-l-[#ffcc00]",
    bg: "bg-[#ffcc00]/10",
    text: "text-[#ffcc00]",
    icon: <Shield className="h-4 w-4 text-[#ffcc00]" />,
    label: "MEDIUM",
    badge: "bg-[#ffcc00]/20 border-[#ffcc00]/40 text-[#ffcc00]"
  },
  low: {
    border: "border-l-[#00d4c3]",
    bg: "bg-[#00d4c3]/10",
    text: "text-[#00d4c3]",
    icon: <ShieldCheck className="h-4 w-4 text-[#00d4c3]" />,
    label: "LOW",
    badge: "bg-[#00d4c3]/20 border-[#00d4c3]/40 text-[#00d4c3]"
  },
  safe: {
    border: "border-l-[#00d4c3]",
    bg: "bg-[#00d4c3]/5",
    text: "text-[#00d4c3]",
    icon: <CheckCircle className="h-4 w-4 text-[#00d4c3]" />,
    label: "SAFE",
    badge: "bg-[#00d4c3]/10 border-[#00d4c3]/30 text-[#00d4c3] shadow-[0_0_10px_rgba(0,212,195,0.2)]"
  },
};




export default function LogAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const phase = useAegisStore((state) => state.logPhase) as StreamPhase;
  const setPhase = useAegisStore((state) => state.setLogPhase);
  
  
  const ledger = useAegisStore((state) => state.logAlerts) as LedgerItem[];
  const setLedger = useAegisStore((state) => state.setLogAlerts);
  
  const [statusMessage, setStatusMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  
  useEffect(() => {
    if (feedRef.current && (phase === "streaming" || phase === "parsing")) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [ledger, phase]);

  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(log|txt|csv)$/i)) {
        setSelectedFile(file);
      } else {
        toast.error("Unsupported file type. Use .log, .txt, or .csv");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setLedger([]);
    setStatusMessage("");
    setPhase("uploading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setPhase("streaming");
      setStatusMessage("Connecting to AI engine...");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
      const response = await fetch(`${API_URL}/api/logs/upload-stream`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const payload = trimmed.slice(6); 

          if (payload === "[DONE]") {
            if (phase !== "complete") setPhase("complete");
            continue;
          }

          try {
            const event = JSON.parse(payload);

            switch (event.type) {
              case "status":
                setStatusMessage(event.message);
                break;

              case "alert":
                
                setLedger([...useAegisStore.getState().logAlerts, event.data]);
                break;

              case "complete":
                setPhase("complete");
                setStatusMessage(event.message || "Analysis complete.");
                
                if (event.alerts && Array.isArray(event.alerts) && event.alerts.length > 0) {
                    if (useAegisStore.getState().logAlerts.length === 0) {
                        setLedger(event.alerts);
                    }
                }
                break;

              case "error":
                setPhase("error");
                setStatusMessage(event.message || "Analysis failed.");
                toast.error(event.message || "Analysis error");
                break;
            }
          } catch {
            
          }
        }
      }

      if (phase === "streaming" || phase === "parsing") {
        setPhase("complete");
      }
    } catch (err: any) { 
      if (err.name === "AbortError") {
        setPhase("idle");
        setStatusMessage("Analysis cancelled.");
        toast("Analysis cancelled", { icon: "⛔" });
      } else {
        console.error("[Stream Error]", err);
        setPhase("error");
        setStatusMessage(err.message || "Connection failed.");
        toast.error("Failed to connect to the AI service. Please try again.");
      }
    } finally {
      abortRef.current = null;
    }
  }, [selectedFile, phase, setLedger, setPhase]);

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const isActive = phase === "uploading" || phase === "streaming" || phase === "parsing";

  
  const severityCounts = ledger.reduce(
    (acc, t) => {
      acc[t.severity] = (acc[t.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const threatsCount = ledger.filter(l => l.severity !== "safe").length;

  
  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-aegis-text flex items-center gap-3">
            <Terminal className="h-6 w-6 text-aegis-primary" />
            Threat Analysis Ledger
          </h1>
          <p className="mt-1 text-sm text-aegis-muted">
            Line-by-line AI security assessment of server logs.
          </p>
        </div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-lg border border-aegis-primary/30 bg-aegis-primary/5 px-3 py-1.5 self-start sm:self-auto"
          >
            <Activity className="h-4 w-4 text-aegis-primary animate-pulse" />
            <span className="text-xs font-medium text-aegis-primary font-mono">
              ANALYZING...
            </span>
          </motion.div>
        )}

        {phase === "complete" && ledger.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 self-start sm:self-auto"
          >
            {(["critical", "high", "medium", "low", "safe"] as const).map(
              (sev) =>
                severityCounts[sev] && (
                  <div
                    key={sev}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold font-mono ${severityConfig[sev].badge}`}
                  >
                    {severityCounts[sev]} {severityConfig[sev].label}
                  </div>
                )
            )}
          </motion.div>
        )}
      </div>
      
      <div className="rounded-xl border border-white/[0.06] bg-aegis-surface/60 backdrop-blur-md overflow-hidden shrink-0">
        
        <div className="p-5">
          <motion.div
            layout
            initial={{ height: "auto", opacity: 1 }}
            animate={{ 
                height: isActive || (phase === "complete" && ledger.length > 0) ? 80 : "auto", 
                opacity: 1 
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 shrink-0 ${
              isDragging
                ? "border-aegis-primary bg-aegis-primary/5 shadow-[0_0_40px_rgba(0,212,195,0.15)]"
                : selectedFile
                ? "border-aegis-primary/30 bg-[#0a0a0a]"
                : "border-white/10 bg-[#0a0a0a] hover:border-aegis-primary/30"
            } backdrop-blur-md ${!selectedFile ? "cursor-pointer" : ""} ${
              isActive ? "pointer-events-none opacity-80" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && !isActive && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".log,.txt,.csv"
              className="hidden"
              id="log-file-input"
            />

            {selectedFile ? (
              <div className="flex w-full items-center justify-between gap-4 px-6 h-full py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-aegis-primary/10 border border-aegis-primary/20">
                    <FileIcon className="h-5 w-5 text-aegis-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-aegis-text truncate font-mono">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-aegis-muted font-mono">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!isActive && phase !== "complete" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="rounded-lg p-2 text-aegis-muted transition-colors hover:bg-white/5 hover:text-aegis-text"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 px-6">
                <UploadCloud className="h-7 w-7 text-aegis-muted group-hover:text-aegis-primary transition-colors duration-300" />
                <div className="text-center">
                  <p className="text-sm font-medium text-aegis-text">
                    Drop your log file here or{" "}
                    <span className="text-aegis-primary hover:underline">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-aegis-muted">
                    Supports .log, .txt, .csv (max 50MB)
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          
          <div className="flex items-center gap-3 mt-4">
            {isActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="flex items-center gap-2 rounded-lg border border-[#ff3b30]/30 bg-[#ff3b30]/10 px-5 py-2.5 text-xs font-bold text-[#ff3b30] transition-all hover:bg-[#ff3b30]/20"
              >
                <X className="h-4 w-4" />
                Abort Analysis
              </button>
            ) : phase === "complete" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                  setPhase("idle");
                  setLedger([]);
                }}
                className="flex items-center gap-2 rounded-lg border border-aegis-primary/30 bg-aegis-primary/10 px-5 py-2.5 text-xs font-bold text-aegis-primary transition-all hover:bg-aegis-primary/20 hover:shadow-[0_0_15px_rgba(0,212,195,0.2)]"
              >
                <Activity className="h-4 w-4" />
                Start New Scan
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze();
                }}
                disabled={!selectedFile}
                className="flex items-center gap-2 rounded-lg bg-aegis-primary px-6 py-2.5 text-sm font-bold text-aegis-bg transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,212,195,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <Zap className="h-4 w-4" />
                Analyze Log
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Activity Flow Map ── */}
      <AnimatePresence>
        {(isActive || (phase === "complete" && ledger.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 450 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0c10] shadow-2xl min-h-[450px]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-transparent" />
            <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full opacity-30">
              <path d="M150,120 Q180,100 220,130 T280,110 T350,140 T400,100 T450,150" fill="none" stroke="#00d4c3" strokeWidth="2" opacity="0.4" strokeDasharray="5,5" />
              <path d="M550,150 Q600,120 650,160 T750,130 T850,180" fill="none" stroke="#00d4c3" strokeWidth="2" opacity="0.4" strokeDasharray="5,5" />
              <path d="M200,250 Q250,280 300,240 T400,290 T450,250" fill="none" stroke="#00d4c3" strokeWidth="2" opacity="0.4" strokeDasharray="5,5" />
              <rect x="150" y="100" width="100" height="80" rx="10" fill="#00d4c3" opacity="0.1" />
              <rect x="260" y="120" width="120" height="150" rx="10" fill="#00d4c3" opacity="0.1" />
              <rect x="450" y="80" width="150" height="100" rx="10" fill="#00d4c3" opacity="0.1" />
              <rect x="620" y="90" width="200" height="140" rx="10" fill="#00d4c3" opacity="0.1" />
              <rect x="650" y="240" width="100" height="80" rx="10" fill="#00d4c3" opacity="0.1" />
            </svg>
            <div className="absolute flex items-center justify-center" style={{ left: "calc(50% - 24px)", top: "calc(50% - 24px)" }}>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#00d4c3]/20 shadow-[0_0_30px_rgba(0,212,195,0.5)] border border-[#00d4c3]/50">
                <Server className="h-6 w-6 text-[#00d4c3]" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 rounded-full border border-[#00d4c3]" />
              </div>
            </div>
            <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full pointer-events-none">
              <AnimatePresence mode="popLayout">
                {ledger.slice(-30).map((item, i) => {
                  const sx = 100 + ((i * 137 + 53) % 800);
                  const sy = 60 + ((i * 97 + 31) % 380);
                  const isSafe = item.severity === "safe";
                  const color = item.severity === "critical" ? "#b91c1c" : item.severity === "high" ? "#ef4444" : item.severity === "medium" ? "#f59e0b" : "#00d4c3";
                  return (
                    <motion.g key={item.id || `map-${item.timestamp}-${i}`}>
                      <motion.line x1={sx} y1={sy} x2={500} y2={250} stroke={color} strokeWidth={item.severity === "critical" ? 2 : 1} opacity={isSafe ? 0.4 : 0.6} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: isSafe ? 0.4 : 0.6 }} transition={{ duration: 0.6 }} />
                      <motion.circle cx={sx} cy={sy} r={isSafe ? 3 : 4} fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} />
                      <motion.circle cx={sx} cy={sy} r={isSafe ? 10 : 12} fill="none" stroke={color} strokeWidth={isSafe ? "1" : "2"} initial={{ scale: 0, opacity: isSafe ? 0.6 : 1 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </svg>
            {isActive && (
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-aegis-primary/30 border-t-aegis-primary" />
                <span className="text-[11px] font-mono text-aegis-primary animate-pulse uppercase tracking-widest">Scanning...</span>
              </div>
            )}
            {phase === "complete" && ledger.length > 0 && (
              <div className="absolute top-4 right-4 z-10 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Scan Summary</h4>
                <div className="flex flex-col gap-1 text-[11px] font-mono">
                  <span className="text-aegis-muted">{ledger.length} lines processed</span>
                  <span className="text-[#00d4c3]">{ledger.filter(l => l.severity === "safe").length} clean</span>
                  <span className="text-[#ef4444]">{ledger.filter(l => l.severity !== "safe").length} anomalies</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      
      <div className="flex flex-col rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.4)]">
        
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-aegis-primary" />
              <span className="text-xs font-semibold text-aegis-text font-mono tracking-wide uppercase">
                AI Ledger
              </span>
            </div>
            {isActive && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-aegis-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-aegis-primary" />
                </span>
                STREAMING
              </span>
            )}
          </div>

          {statusMessage && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={statusMessage}
              className="text-[10px] font-mono text-aegis-muted"
            >
              {statusMessage}
            </motion.span>
          )}
        </div>

        
        <div
          ref={feedRef}
          className="overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-22rem)]"
        >
          <AnimatePresence mode="popLayout">
            {ledger.length === 0 && !isActive ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[280px] gap-3"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5">
                  <Activity className="h-6 w-6 text-aegis-muted/30" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-aegis-muted/50 font-mono">
                    Ledger is empty
                  </p>
                  <p className="text-[11px] text-aegis-muted/30 mt-1">
                    Upload a log file to stream the analysis
                  </p>
                </div>
              </motion.div>
            ) : (
              ledger.map((item, index) => {
                const config = severityConfig[item.severity] || severityConfig.medium;
                const isThreat = item.severity !== "safe";

                return (
                  <motion.div
                    key={item.id || `ledger-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`relative rounded-lg border border-white/5 ${config.bg} backdrop-blur-sm overflow-hidden border-l-[3px] ${config.border} p-4 transition-all duration-300 hover:bg-white/[0.04]`}
                  >
                    {/* Row 1: Badge + Log Snippet + Meta */}
                    <div className="flex items-start gap-3">
                      {/* Severity badge */}
                      <div className="shrink-0 pt-0.5">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold font-mono tracking-wider ${config.badge}`}>
                          {config.icon}
                          {config.label}
                        </div>
                      </div>

                      {/* Log snippet + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`text-xs font-semibold ${isThreat ? "text-aegis-text" : "text-aegis-muted"}`}>
                            {item.type}
                          </span>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-aegis-muted/50 shrink-0">
                            <span>{item.timestamp.split("T").pop()?.replace("Z", "")}</span>
                            <span className="truncate max-w-[110px]" title={item.sourceIp}>{item.sourceIp}</span>
                          </div>
                        </div>
                        <div className="bg-[#050505]/60 border border-white/[0.03] rounded-md px-3 py-2 overflow-x-auto scrollbar-none">
                          <pre className={`text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${isThreat ? "text-aegis-text/90" : "text-aegis-muted/60"}`}>
                            {item.logSnippet || "No snippet available"}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Arrow + AI Explanation */}
                    <div className="flex items-start gap-2 mt-3 ml-[4.5rem]">
                      <CornerDownRight className={`h-4 w-4 shrink-0 mt-0.5 ${
                        item.severity === "critical" ? "text-[#ff3b30]" :
                        item.severity === "high" ? "text-[#ff9500]" :
                        item.severity === "medium" ? "text-[#ffcc00]" :
                        isThreat ? "text-aegis-primary" : "text-aegis-muted/40"
                      }`} />
                      <p className={`text-[12px] leading-relaxed ${
                        item.severity === "critical" ? "text-[#ff3b30] font-semibold drop-shadow-[0_0_6px_rgba(255,59,48,0.5)]" :
                        item.severity === "high" ? "text-[#ff9500] font-semibold drop-shadow-[0_0_6px_rgba(255,149,0,0.4)]" :
                        item.severity === "medium" ? "text-[#ffcc00]/90 font-medium" :
                        isThreat ? "text-aegis-text/80 font-medium" : "text-aegis-muted/50"
                      }`}>
                        {item.analysis}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 py-4 px-2"
            >
              <Loader2 className="h-4 w-4 text-aegis-primary animate-spin" />
              <span className="text-xs font-mono text-aegis-muted/60">
                Awaiting next log line...
              </span>
            </motion.div>
          )}
        </div>

        
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.015] px-5 py-2 shrink-0">
          <span className="text-[10px] font-mono text-aegis-muted/40">
            {ledger.length} total processed • {threatsCount} threats detected
          </span>
          <span className="text-[10px] font-mono text-aegis-muted/30">
            {phase === "idle"
              ? "ready"
              : phase === "complete"
              ? "scan complete"
              : phase === "error"
              ? "error"
              : "streaming..."}
          </span>
        </div>
      </div>
    </div>
  );
}
