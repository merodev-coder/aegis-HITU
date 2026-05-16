import { Request, Response, NextFunction } from "express";
import Alert from "../models/Alert";

const AI_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function fetchGroq(messages: any[], jsonFormat = false): Promise<any> {
  const body: any = { model: AI_MODEL, messages, stream: false };
  if (jsonFormat) body.response_format = { type: "json_object" };
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let errText = "";
    try { errText = await response.text(); } catch(e) {}
    throw new Error(`Groq API Error ${response.status}: ${errText}`);
  }
  return response.json();
}

async function fetchGroqStream(messages: any[]): Promise<any> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({ model: AI_MODEL, messages, stream: true })
  });
  if (!response.ok) {
    let errText = "";
    try { errText = await response.text(); } catch(e) {}
    throw new Error(`Groq API Error ${response.status}: ${errText}`);
  }
  return response.body;
}


const EXCLUDED_PATHS = [
  "/api/health",
  "/api/logs",
  "/api/alerts",
  "/api/auth",
  "/api/ai",
  "/api/scanner",
  "/api/training",
  "/api/overview",
  "/socket.io"
];

function isExcludedPath(requestPath: string): boolean {
  return EXCLUDED_PATHS.some((excluded) => {
    if (requestPath === excluded) return true;
    return requestPath.startsWith(excluded + "/");
  });
}

const SYSTEM_PROMPT = `You are Aegis AI — a SECURITY THREAT ANALYZER. You analyze live incoming HTTP requests to detect attacks.

## CRITICAL RULES:
1. You must evaluate the provided HTTP request details and decide if it is a security threat or safe.
2. DO NOT output conversational text, markdown, or code fences.
3. Your ENTIRE response must be EXACTLY ONE JSON object. DO NOT output a JSON array. DO NOT add trailing commas.

## ANTI-HALLUCINATION RULES:
4. DO NOT hallucinate threats based on IP or gut feeling.
5. A standard request to common endpoints is ALWAYS "safe" UNLESS a clear, explicit malicious payload is visibly present in the URL, User-Agent, or Body.
6. Malicious payloads include: SQL keywords (UNION SELECT, OR 1=1), script injection tags (<script>), path traversal (../), or command injection (; ls).
7. If NO malicious payload is present, you MUST classify it as severity: "safe" and threat_type: "None". False positives are unacceptable.

## REQUIRED OUTPUT FORMAT:
{"severity":"safe|low|medium|high|critical","threat_type":"SQL Injection|XSS|Path Traversal|Command Injection|User-Agent Injection|None","analysis":"<1-sentence explanation>"}

Now analyze the following HTTP request:`;

export const liveThreatInterceptor = (req: Request, res: Response, next: NextFunction) => {

  if (isExcludedPath(req.path)) {
    return next();
  }

  const requestData = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress || "Unknown",
    userAgent: req.headers["user-agent"] || "Unknown",
    body: req.body ? JSON.stringify(req.body).substring(0, 1000) : "None"
  };

  const requestString = `METHOD: ${requestData.method}
URL: ${requestData.url}
IP: ${requestData.ip}
USER-AGENT: ${requestData.userAgent}
BODY: ${requestData.body}`;

  next();

  (async () => {
    try {
      const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: requestString },
      ];
      const response = await fetchGroq(messages, true);

      const aiText = (response.choices[0]?.message?.content || "").trim();
      if (!aiText) return;

      let parsedAlert;
      try {
        const cleanText = aiText.replace(/^```json/, '').replace(/```$/, '').trim();
        parsedAlert = JSON.parse(cleanText);
      } catch {
        console.error("[Live Interceptor] Failed to parse AI JSON:", aiText);
        return;
      }

      const severity = (parsedAlert.severity || "safe").toLowerCase();
      if (severity === "safe") {
        return;
      }

      const alertObj = {
        severity: severity,
        attackType: parsedAlert.threat_type || "Detected Anomaly",
        sourceIp: requestData.ip,
        targetUrl: requestData.url,
        userAgent: requestData.userAgent !== "Unknown" ? requestData.userAgent : "",
        statusCode: res.statusCode || undefined,
        rawLog: requestString,
        timestamp: new Date(),
        analysis: parsedAlert.analysis || ""
      };

      const newAlert = new Alert(alertObj);
      await newAlert.save();

      const io = req.app.get("io");
      if (io) {
        const clientAlert = {
          id: newAlert._id.toString(),
          severity: newAlert.severity,
          type: newAlert.attackType,
          sourceIp: newAlert.sourceIp,
          targetUrl: newAlert.targetUrl,
          userAgent: newAlert.userAgent,
          statusCode: newAlert.statusCode,
          timestamp: newAlert.timestamp.toISOString().replace("T", " ").substring(0, 19),
          analysis: alertObj.analysis,
          logSnippet: newAlert.rawLog
        };
        io.to("secure_alerts").emit("liveAlert", clientAlert);
      }

    } catch (err) {
      console.error("[Live Interceptor] Async analysis error:", err);
    }
  })();
};
