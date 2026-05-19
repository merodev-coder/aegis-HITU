import Threat from "../models/Threat";
import {
  fetchGroq,
  fetchGroqStream,
  getAiMessageContent,
  parseAiJson,
  readGroqStreamChunks,
} from "./groq";

export const PROMPT_STRATEGIES: Record<string, string> = {
  "live-alerts": `You are Aegis AI SIEM Agent. Your only job is to analyze this specific real-time alert line for immediate threats. Be concise. Identify the threat type (e.g., SQLi attempt, Bruteforce) and give a 1-sentence risk assessment. DO NOT rewrite code or analyze large logs. Output Format: Threat Type, Severity (Critical/High/Medium/Low), Risk Assessment (1 sentence).`,
  "log-analyzer": `You are Aegis AI SIEM Log Analyzer. Analyze the provided log block for security patterns, attack chains, or anomalies. Summarize detected activities. If malicious behavior is found, correlate entries to describe the attack flow. Output should be an analytical report with sections: Executive Summary, Detected Threats, Attack Chain Analysis (if applicable), Recommendations.`,
  "code-scanner": `You are Aegis AI Secure Coding Agent. Your goal is to function as an automated secure code reviewer and generator.
STEP 1: Analyze the input code for OWASP Top 10 vulnerabilities (e.g., XSS, SQLi, Prototype Pollution, Insecure Deserialization, Broken Access Control). Clearly list every detected vulnerability with its CWE ID if applicable.
STEP 2: Provide a complete, fully rewritten, secure version of the code snippet. Focus on using secure libraries, input sanitization, parameterized queries, and output encoding.
Output format must be structured Markdown with:
- A "## Vulnerabilities Detected" section listing each issue
- A "## Secure Code" section with the full fixed code in a syntax-highlighted code block
- A "## Changes Made" section summarizing what was fixed and why`,
  "phishing-analyzer": `You are Aegis AI Phishing Expert. Analyze the provided email content for phishing attempts, social engineering, and malicious intent.
You must strictly return ONLY a JSON response in the following format, with no markdown formatting outside the JSON, and no backticks around the JSON.
{
  "riskScore": <number 0-100>,
  "redFlags": ["<flag 1>", "<flag 2>"],
  "recommendation": "<string>"
}
Do not include any extra text.`,
  default: `You are Aegis AI, an expert cybersecurity SIEM assistant. Provide concise, highly technical, and accurate responses. You monitor logs, analyze threats (like SQLi, XSS, etc.), and help the user secure their infrastructure.`,
};

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

type ThreatSeverity = "critical" | "high" | "medium" | "low";

export function determineSeverityFromPrompt(prompt: string): ThreatSeverity {
  const lower = prompt.toLowerCase();

  if (
    /(rce|remote code execution|data breach|exfiltration|sql injection|sqli|privilege escalation|ransomware)/.test(
      lower
    )
  ) {
    return "critical";
  }

  if (
    /(xss|csrf|ssrf|auth bypass|broken access control|command injection|deserialization)/.test(
      lower
    )
  ) {
    return "high";
  }

  if (
    /(misconfig|misconfiguration|weak password|open port|bruteforce|brute force|dos|ddos)/.test(
      lower
    )
  ) {
    return "medium";
  }

  return "low";
}

export function buildThreatDescription(prompt: string): string {
  const compactPrompt = prompt.replace(/\s+/g, " ").trim();
  const lower = compactPrompt.toLowerCase();

  if (lower.includes("sql injection") || lower.includes("sqli")) {
    return "Potential SQL injection risk identified from user query; requires database-focused validation and remediation.";
  }

  if (lower.includes("xss")) {
    return "Potential cross-site scripting vectors identified from user query; input/output handling should be reviewed.";
  }

  if (lower.includes("csrf")) {
    return "Potential CSRF exposure identified from user query; request authenticity controls should be validated.";
  }

  if (lower.includes("rce") || lower.includes("remote code execution")) {
    return "Potential remote code execution risk identified from user query; immediate containment and patch validation recommended.";
  }

  return `Security threat analysis requested for: ${compactPrompt.slice(0, 140)}`;
}

export function getSystemPrompt(context: string): string {
  return PROMPT_STRATEGIES[context] || PROMPT_STRATEGIES["default"];
}

export async function recordChatThreat(userMessage: string): Promise<void> {
  const severity = determineSeverityFromPrompt(userMessage);
  await new Threat({
    source: "CHAT",
    sourceTitle: userMessage.slice(0, 50),
    description: buildThreatDescription(userMessage),
    severity,
    reviewStatus: "PENDING",
    rawSnippet: userMessage.slice(0, 500),
  }).save();
}

export async function streamChatResponse(
  userMessage: string,
  onChunk: (content: string) => void
): Promise<void> {
  const systemPrompt = `You are Aegis AI, a world-class Cybersecurity Expert. Always provide scientifically accurate analysis. For SQL injection, look for database vulnerabilities, NOT Nginx caching issues.
Return your response in clean Markdown with exactly these top-level sections:
## Analysis
## Risk Level
## Remediation
Keep the content technically precise, actionable, and evidence-based.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const streamBody = await fetchGroqStream(messages);
  for await (const content of readGroqStreamChunks(streamBody)) {
    onChunk(content);
  }
}

export async function streamAnalyzeResponse(
  input: string,
  context: string,
  onEvent: (event: object) => void
): Promise<string> {
  const systemPrompt = getSystemPrompt(context || "default");
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: sanitizeForLlm(input) },
  ];

  onEvent({ type: "status", message: `Using ${context || "default"} analysis strategy...` });

  const streamBody = await fetchGroqStream(messages);
  let fullResponse = "";

  for await (const text of readGroqStreamChunks(streamBody)) {
    fullResponse += text;
    onEvent({ type: "chunk", content: text });
  }

  return fullResponse;
}

export interface PhishingAnalysis {
  riskScore: number;
  redFlags: string[];
  recommendation: string;
}

export async function analyzePhishingEmail(email: string): Promise<PhishingAnalysis> {
  const systemPrompt = getSystemPrompt("phishing-analyzer");
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: sanitizeForLlm(email) },
  ];

  const response = await fetchGroq(messages, true);
  const rawText = getAiMessageContent(response);
  const parsed = parseAiJson<PhishingAnalysis>(rawText, {
    riskScore: 0,
    redFlags: [],
    recommendation: "Unable to parse analysis.",
  });

  if (parsed.riskScore >= 50) {
    try {
      await new Threat({
        source: "EMAIL",
        sourceTitle: "Analyzed Email",
        description: `Phishing Score ${parsed.riskScore}/100. Flags: ${parsed.redFlags?.join(", ")}`,
        severity:
          parsed.riskScore >= 80
            ? "critical"
            : parsed.riskScore >= 65
              ? "high"
              : "medium",
        reviewStatus: "PENDING",
        rawSnippet: email.substring(0, 500),
      }).save();
    } catch (threatErr) {
      console.error("[Threat Save Error]", threatErr);
    }
  }

  return parsed;
}
