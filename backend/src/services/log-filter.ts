import { Request, Response } from "express";
import Alert from "../models/Alert";
import Threat from "../models/Threat";
import {
  fetchGroq,
  getAiMessageContent,
  parseAiJson,
} from "./groq";

const LOG_ANALYSIS_PROMPT = `You are Aegis AI — a SECURITY THREAT ANALYZER. You analyze server logs to detect attacks.

## CRITICAL RULES:
1. You are an ANALYZER, NOT a parser. DO NOT echo or reformat raw log input.
2. DO NOT output conversational text, markdown, or code fences.
3. Return EXACTLY ONE JSON object with this schema (no extra keys):
{"alerts":[{"severity":"safe|low|medium|high|critical","threat_type":"SQL Injection|XSS|Path Traversal|Command Injection|User-Agent Injection|None","source_ip":"<ip>","target_url":"<url>","timestamp":"<iso8601>","log_snippet":"<snippet>","analysis":"<1 sentence>"}]}

## ANTI-HALLUCINATION:
4. DO NOT invent attack payloads not present in the log text.
5. Standard GET/POST to /about, /contact, /api/v1/status, /index.html, /favicon.ico, static assets are "safe" unless a malicious payload is visible.
6. Malicious payloads: SQL keywords in URL (UNION SELECT, OR 1=1), script tags (<script>), path traversal (../), command injection (; ls).
7. When in doubt, classify as "safe". False positives are NOT acceptable.

Analyze every log line provided and include one alert object per line in the alerts array.`;

const JUNK_LINE_PATTERNS = [
  /"GET \/favicon\.ico/i,
  /"GET \/robots\.txt/i,
  /"GET \/health\b/i,
  /"GET \/api\/v1\/status/i,
  /HealthChecker\/\d/i,
  /\.(css|js|png|jpg|jpeg|gif|svg|woff2?|ico|map)\s+HTTP/i,
  /"GET \/static\//i,
  /"GET \/assets\//i,
  /"GET \/wp-content\//i,
  /"HEAD \//i,
];

const MAX_LOG_LINES = 300;

export function sanitizeForLlm(input: string): string {
  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /you\s+are\s+now/gi,
    /system\s*prompt/gi,
    /\bdo\s+not\s+follow\b/gi,
    /\brole\s*:\s*system\b/gi,
  ];
  let sanitized = input;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  }
  return sanitized;
}

export function filterLogLines(rawContent: string): string[] {
  const lines = rawContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const meaningful = lines.filter(
    (line) => !JUNK_LINE_PATTERNS.some((pattern) => pattern.test(line))
  );

  const unique = [...new Set(meaningful.length > 0 ? meaningful : lines)];
  return unique.slice(-MAX_LOG_LINES);
}

interface AiAlertRow {
  severity?: string;
  threat_type?: string;
  source_ip?: string;
  target_url?: string;
  timestamp?: string;
  log_snippet?: string;
  analysis?: string;
}

interface AiAlertsResponse {
  alerts?: AiAlertRow[];
}

function mapAiAlert(parsed: AiAlertRow) {
  const sanitizeHtml = (str: unknown) => {
    if (typeof str !== "string") return "";
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  const severityVal =
    typeof parsed.severity === "string" ? parsed.severity.toLowerCase() : "medium";

  return {
    severity: ["safe", "low", "medium", "high", "critical"].includes(severityVal)
      ? severityVal
      : "medium",
    attackType: sanitizeHtml(parsed.threat_type) || "Detected Anomaly",
    sourceIp: sanitizeHtml(parsed.source_ip) || "Unknown",
    targetUrl: sanitizeHtml(parsed.target_url) || "Unknown",
    userAgent: "",
    statusCode: undefined as number | undefined,
    rawLog: sanitizeHtml(parsed.log_snippet) || "",
    time: !isNaN(Date.parse(parsed.timestamp ?? ""))
      ? (parsed.timestamp as string)
      : new Date().toISOString(),
    analysis: sanitizeHtml(parsed.analysis) || "",
  };
}

export function formatAlertForClient(alert: {
  _id?: unknown;
  severity?: unknown;
  attackType?: unknown;
  threat_type?: unknown;
  sourceIp?: unknown;
  source_ip?: unknown;
  targetUrl?: unknown;
  target_url?: unknown;
  userAgent?: unknown;
  statusCode?: unknown;
  timestamp?: unknown;
  analysis?: unknown;
  rawLog?: unknown;
  log_snippet?: unknown;
}) {
  const alertId = alert._id ? String(alert._id) : Math.random().toString(36).substring(7);
  const ts = alert.timestamp
    ? new Date(alert.timestamp as string).toISOString().replace("T", " ").substring(0, 19)
    : new Date().toISOString();

  return {
    id: alertId,
    severity: alert.severity,
    type: alert.attackType || alert.threat_type,
    sourceIp: alert.sourceIp || alert.source_ip,
    targetUrl: alert.targetUrl || alert.target_url,
    userAgent: alert.userAgent || "",
    statusCode: alert.statusCode,
    timestamp: ts,
    analysis: alert.analysis || "",
    logSnippet: alert.rawLog || alert.log_snippet || "",
  };
}

async function validateAndSaveAlert(alertData: AiAlertRow, fileName?: string) {
  try {
    const mappedAlert = mapAiAlert(alertData);

    if (mappedAlert.severity.toLowerCase() === "safe") {
      return null;
    }

    if (!mappedAlert.attackType) {
      console.warn("[Validation Warning] Skipping alert without attackType:", alertData);
      return null;
    }

    const alertObj = {
      severity: mappedAlert.severity.toLowerCase() || "medium",
      attackType: mappedAlert.attackType,
      sourceIp: mappedAlert.sourceIp || "Unknown",
      targetUrl: mappedAlert.targetUrl || "Unknown",
      userAgent: mappedAlert.userAgent || "",
      statusCode: mappedAlert.statusCode ? Number(mappedAlert.statusCode) : undefined,
      rawLog: mappedAlert.rawLog || "",
      timestamp: mappedAlert.time ? new Date(mappedAlert.time) : new Date(),
    };

    const newAlert = new Alert(alertObj);
    await newAlert.save();

    try {
      await new Threat({
        source: "LOG",
        sourceTitle: fileName || "Uploaded Log",
        description:
          mappedAlert.analysis ||
          `${mappedAlert.attackType} detected from ${mappedAlert.sourceIp}`,
        severity: mappedAlert.severity.toLowerCase(),
        reviewStatus: "PENDING",
        rawSnippet: mappedAlert.rawLog || "",
      }).save();
    } catch (threatErr) {
      console.error("[Threat Save Error]", threatErr);
    }

    return newAlert;
  } catch (saveErr) {
    console.error("[MongoDB Save Error]", saveErr, alertData);
    return null;
  }
}

/** One Groq request for the entire filtered log batch — avoids per-line rate limits. */
export async function analyzeLogsWithAi(
  logContent: string
): Promise<AiAlertRow[]> {
  const filteredLines = filterLogLines(logContent);

  if (filteredLines.length === 0) {
    return [];
  }

  const batch = filteredLines.join("\n");
  const messages = [
    { role: "system", content: LOG_ANALYSIS_PROMPT },
    { role: "user", content: batch },
  ];

  const response = await fetchGroq(messages, true);
  const rawText = getAiMessageContent(response);
  const parsed = parseAiJson<AiAlertsResponse>(rawText, { alerts: [] });
  return Array.isArray(parsed.alerts) ? parsed.alerts : [];
}

export async function processLogStream(
  logContent: string,
  req: Request,
  res: Response,
  sendEvent: (data: object) => void,
  fileName?: string
): Promise<void> {
  try {
    sendEvent({ type: "status", message: "Filtering log lines..." });

    const filteredLines = filterLogLines(logContent);
    if (filteredLines.length === 0) {
      sendEvent({ type: "error", message: "Log file is empty or contains only noise." });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    sendEvent({
      type: "status",
      message: `Sending ${filteredLines.length} filtered lines in a single AI request...`,
    });

    const parsedAlerts = await analyzeLogsWithAi(logContent);

    for (const parsedAlert of parsedAlerts) {
      const mappedAlert = mapAiAlert(parsedAlert);

      const clientAlert = {
        id: Math.random().toString(36).substring(7),
        severity: mappedAlert.severity,
        type: mappedAlert.attackType,
        sourceIp: mappedAlert.sourceIp,
        targetUrl: mappedAlert.targetUrl,
        timestamp: new Date(mappedAlert.time).toISOString().replace("T", " ").substring(0, 19),
        analysis: mappedAlert.analysis,
        logSnippet: mappedAlert.rawLog,
      };

      sendEvent({ type: "alert", data: clientAlert });

      if (mappedAlert.severity.toLowerCase() !== "safe") {
        validateAndSaveAlert(parsedAlert, fileName)
          .then((saved) => {
            if (saved) {
              const io = req.app.get("io");
              if (io) io.to("secure_alerts").emit("liveAlert", formatAlertForClient(saved));
            }
          })
          .catch((err) => console.error("[SSE DB Save Error]", err));
      }
    }

    sendEvent({ type: "status", message: "Analysis complete." });
    sendEvent({ type: "complete", message: "Analysis finished." });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Log Filter Error]", errMsg);
    sendEvent({ type: "error", message: "An error occurred during log analysis." });
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

export async function analyzeLogsUpload(
  logContent: string,
  fileName: string,
  req: Request
): Promise<{ savedCount: number; alerts: unknown[] }> {
  const parsedAlerts = await analyzeLogsWithAi(logContent);

  if (parsedAlerts.length === 0) {
    return { savedCount: 0, alerts: [] };
  }

  const results = await Promise.all(
    parsedAlerts.map((a) => validateAndSaveAlert(a, fileName))
  );
  const savedAlerts = results.filter((alert) => alert !== null);

  const io = req.app.get("io");
  if (io) {
    savedAlerts.forEach((alert) => {
      io.to("secure_alerts").emit("liveAlert", formatAlertForClient(alert));
    });
  }

  return { savedCount: savedAlerts.length, alerts: savedAlerts };
}
