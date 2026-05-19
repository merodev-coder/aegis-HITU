import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import aiRoutes from "./routes/ai";
import logRoutes from "./routes/logs";
import authRoutes from "./routes/auth";
import alertRoutes from "./routes/alerts";
import scannerRoutes from "./routes/scanner";
import trainingRoutes from "./routes/training";
import overviewRoutes from "./routes/overview";
import { liveThreatInterceptor } from "./middlewares/liveThreatInterceptor";
import { requireAuth } from "./middlewares/auth";
import connectDB from "./config/db";
import { delay, fetchGroq, getAiMessageContent, parseAiJson } from "./utils/aiHelper";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set.");
  process.exit(1);
}

connectDB();

const app = express();

app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const PORT = process.env.PORT || 5000;

app.set("trust proxy", false);

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(cookieParser());
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Accel-Buffering', 'no');
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(liveThreatInterceptor);

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/alerts", requireAuth, alertRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/overview", overviewRoutes);

app.post("/api/analyze-log-text", express.json({ limit: "10mb" }), async (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const validSeverities = ["safe", "low", "medium", "high", "critical"];
  const BATCH_SIZE = 25;
  const systemPrompt = `You are Aegis AI — a SECURITY THREAT ANALYZER. Analyze the provided log lines and return EXACTLY ONE JSON object with no markdown and no code fences. Schema: {"alerts":[{"severity":"safe|low|medium|high|critical","threat_type":"SQL Injection|XSS|Path Traversal|Command Injection|User-Agent Injection|None","source_ip":"<ip>","target_url":"<url>","timestamp":"<iso8601>","log_snippet":"<snippet>","analysis":"<1 sentence>"}]}. Include one alert object per input line. Classify as safe when no malicious payload is visible.`;

  try {
    const logData = req.body?.logData;

    if (!logData || typeof logData !== "string" || !logData.trim()) {
      sendEvent({ type: "error", message: "No log data provided." });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const uniqueLines = [
      ...new Set(
        logData
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
      ),
    ].slice(-150);

    if (uniqueLines.length === 0) {
      sendEvent({ type: "error", message: "No log data provided." });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    for (let i = 0; i < uniqueLines.length; i += BATCH_SIZE) {
      const chunk = uniqueLines.slice(i, i + BATCH_SIZE);
      const startLine = i + 1;
      const endLine = Math.min(i + BATCH_SIZE, uniqueLines.length);

      sendEvent({ type: "status", message: `Analyzing lines ${startLine} to ${endLine}...` });

      try {
        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: chunk.join("\n") },
        ];
        const response = await fetchGroq(messages, true);
        const rawText = getAiMessageContent(response);
        const parsedData = parseAiJson<{ alerts?: Array<Record<string, unknown>> }>(rawText, { alerts: [] });
        const alerts = Array.isArray(parsedData.alerts) ? parsedData.alerts : [];

        for (const alert of alerts) {
          const sev =
            typeof alert.severity === "string" ? alert.severity.toLowerCase() : "medium";
          const sanitize = (value: unknown) =>
            typeof value === "string" ? value.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";

          sendEvent({
            type: "alert",
            data: {
              id: Math.random().toString(36).substring(7),
              severity: validSeverities.includes(sev) ? sev : "medium",
              type: sanitize(alert.threat_type) || "Detected Anomaly",
              sourceIp: sanitize(alert.source_ip) || "Unknown",
              targetUrl: sanitize(alert.target_url) || "Unknown",
              timestamp: !isNaN(Date.parse(String(alert.timestamp ?? "")))
                ? alert.timestamp
                : new Date().toISOString(),
              analysis: sanitize(alert.analysis) || "",
              logSnippet: sanitize(alert.log_snippet) || "",
            },
          });
        }
      } catch (chunkErr) {
        console.error("[Analyze Log Text Chunk Error]", chunkErr);
        continue;
      }

      await delay(1500);
    }

    sendEvent({ type: "complete", message: "Analysis complete." });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Analyze Log Text Error]", errMsg);
    sendEvent({ type: "error", message: "Analysis failed." });
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "operational",
    service: "Aegis AI API",
    timestamp: new Date().toISOString(),
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

interface AppError extends Error {
  statusCode?: number;
}

app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${err.message}`);
  const isProduction = process.env.NODE_ENV === "production";
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: isProduction && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

app.set("io", io);

io.use((socket, next) => {
  const cookieHeader = socket.request.headers.cookie;
  if (!cookieHeader) {
    return next(new Error("Authentication required"));
  }
  try {
    const cookies = cookie.parse(cookieHeader);
    const token = cookies.aegis_token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  if (socket.data.role === "admin" || socket.data.role === "analyst") {
    socket.join("secure_alerts");
  }

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n⚡ Aegis AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Socket.io: Ready for connections\n`);
});

export default app;
