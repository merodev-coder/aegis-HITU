import { motion } from "framer-motion";
import {
  ShieldAlert,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Terminal,
  Bug,
  Globe,
  Fingerprint,
} from "lucide-react";
import type { LiveAlert } from "../hooks/useLiveAlerts";




const severityTheme = {
  critical: {
    border: "border-l-[#ff3b30]",
    bg: "bg-[#ff3b30]/[0.06]",
    hoverBg: "hover:bg-[#ff3b30]/[0.1]",
    text: "text-[#ff3b30]",
    badgeBg: "bg-[#ff3b30]/15 border-[#ff3b30]/25",
    dot: "bg-[#ff3b30]",
    glow: "shadow-[inset_0_0_30px_rgba(255,59,48,0.04)]",
    icon: ShieldAlert,
    label: "CRITICAL",
  },
  high: {
    border: "border-l-[#ff9500]",
    bg: "bg-[#ff9500]/[0.05]",
    hoverBg: "hover:bg-[#ff9500]/[0.08]",
    text: "text-[#ff9500]",
    badgeBg: "bg-[#ff9500]/15 border-[#ff9500]/25",
    dot: "bg-[#ff9500]",
    glow: "shadow-[inset_0_0_30px_rgba(255,149,0,0.03)]",
    icon: AlertTriangle,
    label: "HIGH",
  },
  medium: {
    border: "border-l-[#ffcc00]",
    bg: "bg-[#ffcc00]/[0.04]",
    hoverBg: "hover:bg-[#ffcc00]/[0.07]",
    text: "text-[#ffcc00]",
    badgeBg: "bg-[#ffcc00]/15 border-[#ffcc00]/25",
    dot: "bg-[#ffcc00]",
    glow: "shadow-[inset_0_0_30px_rgba(255,204,0,0.02)]",
    icon: Shield,
    label: "MEDIUM",
  },
  low: {
    border: "border-l-[#00d4c3]",
    bg: "bg-[#00d4c3]/[0.04]",
    hoverBg: "hover:bg-[#00d4c3]/[0.07]",
    text: "text-[#00d4c3]",
    badgeBg: "bg-[#00d4c3]/15 border-[#00d4c3]/25",
    dot: "bg-[#00d4c3]",
    glow: "shadow-[inset_0_0_30px_rgba(0,212,195,0.02)]",
    icon: ShieldCheck,
    label: "LOW",
  },
} as const;




function getThreatIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("sql") || lower.includes("injection"))
    return <Terminal className="h-3.5 w-3.5" />;
  if (lower.includes("xss") || lower.includes("script"))
    return <Bug className="h-3.5 w-3.5" />;
  if (lower.includes("traversal") || lower.includes("path"))
    return <Globe className="h-3.5 w-3.5" />;
  if (lower.includes("user-agent") || lower.includes("ua"))
    return <Fingerprint className="h-3.5 w-3.5" />;
  return <Shield className="h-3.5 w-3.5" />;
}




interface AlertCardProps {
  alert: LiveAlert;
  index: number;
}

export default function AlertCard({ alert, index }: AlertCardProps) {
  const theme = severityTheme[alert.severity] || severityTheme.medium;
  const SeverityIcon = theme.icon;
  const isCritical = alert.severity === "critical";

  return (
    <motion.div
      
      layout
      layoutId={alert.id}
      
      initial={{ opacity: 0, y: -40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, scale: 0.95 }}
      
      transition={{
        
        layout: { type: "spring", stiffness: 350, damping: 30 },
        
        opacity: { duration: 0.25, delay: index < 3 ? index * 0.03 : 0 },
        y: { type: "spring", stiffness: isCritical ? 500 : 380, damping: isCritical ? 22 : 28 },
        scale: { duration: 0.2 },
      }}
      className={`
        group relative overflow-hidden rounded-lg border border-white/[0.06]
        border-l-[3px] ${theme.border} ${theme.bg} ${theme.hoverBg} ${theme.glow}
        backdrop-blur-sm transition-colors duration-200 cursor-default
      `}
    >
      
      {isCritical && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-[#ff3b30]/40 pointer-events-none"
          animate={{
            borderColor: [
              "rgba(255,59,48,0.4)",
              "rgba(255,59,48,0.1)",
              "rgba(255,59,48,0.35)",
            ],
            boxShadow: [
              "inset 0 0 20px rgba(255,59,48,0.08), 0 0 12px rgba(255,59,48,0.1)",
              "inset 0 0 8px rgba(255,59,48,0.02), 0 0 4px rgba(255,59,48,0.03)",
              "inset 0 0 18px rgba(255,59,48,0.07), 0 0 10px rgba(255,59,48,0.08)",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      )}

      
      <div className="relative flex items-start gap-3.5 px-4 py-3.5">
        
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
            ${theme.badgeBg} border`}
        >
          <SeverityIcon className={`h-4 w-4 ${theme.text}`} />
        </div>

        
        <div className="flex-1 min-w-0 space-y-2">
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5
                  text-[10px] font-bold font-mono tracking-widest
                  ${theme.badgeBg} ${theme.text} border shrink-0`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${theme.dot} ${
                  isCritical ? "animate-pulse" : ""
                }`} />
                {theme.label}
              </span>

              
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`${theme.text} opacity-60 shrink-0`}>
                  {getThreatIcon(alert.type)}
                </span>
                <span className="text-[13px] font-semibold text-aegis-text truncate">
                  {alert.type}
                </span>
              </div>
            </div>

            
            <span className="text-[10px] text-aegis-muted/50 font-mono tabular-nums shrink-0 tracking-tight">
              {alert.timestamp}
            </span>
          </div>

          
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="text-[11px] font-mono text-aegis-muted/80">
              <span className="text-aegis-muted/35 select-none">src </span>
              <span className="text-aegis-text/75">{alert.sourceIp}</span>
            </span>

            <span className="text-[11px] font-mono text-aegis-muted/80">
              <span className="text-aegis-muted/35 select-none">dst </span>
              <span className="text-aegis-text/75 break-all">{alert.targetUrl}</span>
            </span>

            {alert.statusCode != null && (
              <span className="text-[11px] font-mono text-aegis-muted/80">
                <span className="text-aegis-muted/35 select-none">http </span>
                <span
                  className={
                    alert.statusCode >= 400
                      ? "text-[#ff3b30]/80"
                      : alert.statusCode >= 300
                      ? "text-[#ffcc00]/80"
                      : "text-[#00d4c3]/80"
                  }
                >
                  {alert.statusCode}
                </span>
              </span>
            )}
          </div>

          
          {alert.userAgent && (
            <div
              className="text-[10px] font-mono text-aegis-muted/30
                group-hover:text-aegis-muted/50 transition-colors truncate"
            >
              <span className="text-aegis-muted/20 select-none">ua </span>
              {alert.userAgent}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
