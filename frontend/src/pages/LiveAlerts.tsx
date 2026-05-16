import {
  RadioTower,
  Search,
  Filter,
  Wifi,
  WifiOff,
  Trash2,
  RefreshCw,
  Activity,
  ShieldOff,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAlerts } from "../hooks/useLiveAlerts";
import AlertCard from "../components/AlertCard";




const SEVERITY_OPTIONS = ["all", "critical", "high", "medium", "low"] as const;

const SEVERITY_FILTER_STYLES: Record<string, string> = {
  all: "text-aegis-text",
  critical: "text-[#ff3b30]",
  high: "text-[#ff9500]",
  medium: "text-[#ffcc00]",
  low: "text-[#00d4c3]",
};




export default function LiveAlerts() {
  const { alerts, status, isHistoryLoaded, totalReceived, clearAlerts, reconnect } =
    useLiveAlerts();

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  
  const feedRef = useRef<HTMLDivElement>(null);
  const prevAlertCount = useRef(0);

  useEffect(() => {
    
    if (alerts.length > prevAlertCount.current && feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevAlertCount.current = alerts.length;
  }, [alerts.length]);

  
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity =
        severityFilter === "all" || alert.severity === severityFilter;
      if (!matchesSeverity) return false;

      if (!search.trim()) return true;

      const q = search.toLowerCase();
      return (
        alert.type.toLowerCase().includes(q) ||
        alert.sourceIp.includes(q) ||
        alert.targetUrl.toLowerCase().includes(q) ||
        (alert.userAgent && alert.userAgent.toLowerCase().includes(q))
      );
    });
  }, [alerts, search, severityFilter]);

  
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of alerts) {
      if (a.severity in counts) counts[a.severity as keyof typeof counts]++;
    }
    return counts;
  }, [alerts]);

  
  const statusConfig = {
    connecting: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      text: "Connecting...",
      color: "text-[#ffcc00] border-[#ffcc00]/20 bg-[#ffcc00]/5",
    },
    connected: {
      icon: <Wifi className="h-3.5 w-3.5" />,
      text: "Live",
      color: "text-aegis-primary border-aegis-primary/20 bg-aegis-primary/5",
    },
    disconnected: {
      icon: <WifiOff className="h-3.5 w-3.5" />,
      text: "Disconnected",
      color: "text-[#ff9500] border-[#ff9500]/20 bg-[#ff9500]/5",
    },
    error: {
      icon: <WifiOff className="h-3.5 w-3.5" />,
      text: "Error",
      color: "text-[#ff3b30] border-[#ff3b30]/20 bg-[#ff3b30]/5",
    },
  };

  const currentStatus = statusConfig[status];

  
  return (
    <div className="flex flex-col gap-5">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-aegis-text flex items-center gap-3">
            <RadioTower className="h-6 w-6 text-aegis-primary" />
            Live Alerts
          </h1>
          <p className="mt-1 text-sm text-aegis-muted">
            Real-time threat intelligence feed
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:flex items-center gap-1.5"
            >
              {(["critical", "high", "medium", "low"] as const).map((sev) =>
                severityCounts[sev] > 0 ? (
                  <span
                    key={sev}
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${sev === "critical"
                        ? "border-[#ff3b30]/25 bg-[#ff3b30]/10 text-[#ff3b30]"
                        : sev === "high"
                          ? "border-[#ff9500]/25 bg-[#ff9500]/10 text-[#ff9500]"
                          : sev === "medium"
                            ? "border-[#ffcc00]/25 bg-[#ffcc00]/10 text-[#ffcc00]"
                            : "border-[#00d4c3]/25 bg-[#00d4c3]/10 text-[#00d4c3]"
                      }`}
                  >
                    {severityCounts[sev]}
                  </span>
                ) : null
              )}
            </motion.div>
          )}

          
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${currentStatus.color} transition-colors`}
          >
            {status === "connected" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-aegis-primary" />
              </span>
            )}
            {status !== "connected" && currentStatus.icon}
            <span className="text-xs font-medium font-mono tracking-wide">
              {currentStatus.text}
            </span>
          </div>
        </div>
      </div>

      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        
        <div
          className="flex flex-1 items-center gap-2 rounded-lg border border-white/10
            bg-aegis-surface/60 px-3 py-2 backdrop-blur-md
            focus-within:border-aegis-primary/40 transition-colors"
        >
          <Search className="h-4 w-4 shrink-0 text-aegis-muted/40" />
          <input
            type="text"
            placeholder="Filter by attack type, IP, URL, or user-agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-aegis-text outline-none
              placeholder:text-aegis-muted/35 font-mono"
            id="alert-search-input"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-aegis-muted/40 hover:text-aegis-text transition-colors"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        
        <div
          className="flex items-center gap-2 rounded-lg border border-white/10
            bg-aegis-surface/60 px-3 py-2 backdrop-blur-md
            focus-within:border-aegis-primary/40 transition-colors"
        >
          <Filter className="h-4 w-4 shrink-0 text-aegis-muted/40" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-sm outline-none appearance-none pr-4
              cursor-pointer font-mono"
            style={{ color: "inherit" }}
            id="severity-filter-select"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option
                key={opt}
                value={opt}
                className="bg-[#111318] text-aegis-text"
              >
                {opt === "all" ? "All Severities" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          <span
            className={`text-[10px] font-bold font-mono ${SEVERITY_FILTER_STYLES[severityFilter] || "text-aegis-text"
              }`}
          >
            {severityFilter !== "all" && `(${severityCounts[severityFilter as keyof typeof severityCounts] || 0
              })`}
          </span>
        </div>

        
        <div className="flex items-center gap-2">
          {(status === "disconnected" || status === "error") && (
            <button
              onClick={reconnect}
              className="flex items-center gap-1.5 rounded-lg border border-[#ff9500]/20
                bg-[#ff9500]/5 px-3 py-2 text-xs font-medium text-[#ff9500]
                hover:bg-[#ff9500]/10 transition-colors"
              id="reconnect-btn"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reconnect
            </button>
          )}
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="flex items-center gap-1.5 rounded-lg border border-white/10
                bg-white/[0.02] px-3 py-2 text-xs font-medium text-aegis-muted
                hover:bg-white/[0.05] hover:text-aegis-text transition-colors"
              id="clear-alerts-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      
      <div
        className="flex flex-col rounded-xl border border-white/[0.06]
          bg-[#0a0a0a] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]"
      >
        
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-5 py-2.5 shrink-0">
          <div className="flex items-center gap-3">
            
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff3b30]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff9500]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#00d4c3]/70" />
            </div>

            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-aegis-primary/70" />
              <span className="text-[11px] font-semibold text-aegis-text/80 font-mono tracking-wider">
                LIVE THREAT FEED
              </span>
            </div>

            {status === "connected" && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-[10px] font-mono text-aegis-primary/80"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aegis-primary" />
                </span>
                STREAMING
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-aegis-muted/40">
              {filteredAlerts.length}/{alerts.length} alerts
            </span>
            <span className="text-[10px] font-mono text-aegis-muted/30">
              {totalReceived} total received
            </span>
          </div>
        </div>

        
        <div
          ref={feedRef}
          className="overflow-y-auto p-3 space-y-2"
          style={{ maxHeight: "calc(100vh - 21rem)", minHeight: "350px" }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            
            {!isHistoryLoaded && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[350px] gap-4"
              >
                <Loader2 className="h-6 w-6 text-aegis-primary/40 animate-spin" />
                <span className="text-xs font-mono text-aegis-muted/40">
                  Loading threat history...
                </span>
              </motion.div>
            )}

            
            {isHistoryLoaded && filteredAlerts.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[350px] gap-4"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <ShieldOff className="h-7 w-7 text-aegis-muted/20" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-aegis-muted/40 font-mono">
                    {alerts.length === 0
                      ? "No threats detected"
                      : "No alerts match your filters"}
                  </p>
                  <p className="text-[11px] text-aegis-muted/25">
                    {alerts.length === 0
                      ? "Upload a log file in the Log Analyzer to detect threats"
                      : "Try adjusting your search or severity filter"}
                  </p>
                </div>
              </motion.div>
            )}

            
            {isHistoryLoaded &&
              filteredAlerts.map((alert, index) => (
                <AlertCard key={alert.id} alert={alert} index={index} />
              ))}
          </AnimatePresence>
        </div>

        
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-5 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-aegis-primary/40">❯</span>
            <span className="text-[10px] font-mono text-aegis-muted/35">
              aegis-ai@siem ~ /live-alerts
            </span>
          </div>
          <span className="text-[10px] font-mono text-aegis-muted/25">
            socket: {status} • {alerts.length} buffered • max 200
          </span>
        </div>
      </div>
    </div>
  );
}
