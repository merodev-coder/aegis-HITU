import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import dns from "dns/promises";
import net from "net";
import {
  analyzeLogsUpload,
  processLogStream,
  sanitizeForLlm,
} from "../services/log-filter";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = [".log", ".txt", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .log, .txt, and .csv files are allowed."));
    }
  },
});

router.post("/upload", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const logContent = sanitizeForLlm(req.file.buffer.toString("utf-8"));
    const fileName = req.file.originalname || "Uploaded Log";

    const { savedCount, alerts } = await analyzeLogsUpload(logContent, fileName, req);

    if (savedCount === 0) {
      res.status(200).json({ message: "No threats detected.", alerts: [] });
      return;
    }

    res.status(200).json({
      message: `Successfully analyzed file and detected ${savedCount} threats.`,
      alerts,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Log Upload Error]", errMsg);
    res.status(500).json({ error: "An error occurred during log analysis." });
  }
});

router.options("/upload-stream", (_req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.status(204).end();
});

router.post("/upload-stream", async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const logData = req.body?.logData;
    const fileName = req.body?.fileName || "Uploaded Log";

    if (!logData || typeof logData !== "string" || !logData.trim()) {
      sendEvent({ type: "error", message: "No log data provided." });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const logContent = sanitizeForLlm(logData);
    await processLogStream(logContent, req, res, sendEvent, fileName);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Upload Stream Error]", errMsg);
    sendEvent({ type: "error", message: "Upload stream processing failed." });
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc00:") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe80:")) return true;
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice(7);
      if (net.isIPv4(mapped)) return isPrivateIp(mapped);
    }
    return false;
  }

  return true;
}

async function isAllowedUrl(input: string): Promise<boolean> {
  try {
    const parsed = new URL(input);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

    if (net.isIP(hostname)) {
      return !isPrivateIp(hostname);
    }

    let addresses: string[];
    try {
      addresses = await dns.resolve4(hostname);
    } catch {
      try {
        addresses = await dns.resolve6(hostname);
      } catch {
        return false;
      }
    }

    return addresses.every((addr) => !isPrivateIp(addr));
  } catch {
    return false;
  }
}

router.post("/scan-url-stream", async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.write(`data: ${JSON.stringify({ error: "No URL provided." })}\n\n`);
      res.end();
      return;
    }

    const allowed = await isAllowedUrl(url);
    if (!allowed) {
      res.write(
        `data: ${JSON.stringify({ error: "Invalid or blocked URL. Only public HTTP(S) URLs are allowed." })}\n\n`
      );
      res.end();
      return;
    }

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent({ type: "status", message: "Fetching remote logs..." });
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch URL: ${fetchResponse.statusText}`);
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    let size = 0;
    const chunks: Uint8Array[] = [];

    if (fetchResponse.body) {
      const reader = fetchResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          size += value.length;
          if (size > MAX_SIZE) {
            throw new Error("File exceeds the maximum allowed size of 5MB.");
          }
          chunks.push(value);
        }
      }
    }

    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    const concatenated = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }

    const logContent = sanitizeForLlm(new TextDecoder("utf-8").decode(concatenated));
    await processLogStream(logContent, req, res, sendEvent);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Scan URL Error]", errMsg);
    res.write(`data: ${JSON.stringify({ error: `Error processing URL stream: ${errMsg}` })}\n\n`);
    res.end();
  }
});

router.get("/sample", (_req: Request, res: Response) => {
  const sampleData = `
192.168.1.100 - - [10/Oct/2023:13:55:36 -0700] "GET /api/health HTTP/1.1" 200 143 "-" "Mozilla/5.0"
10.0.0.45 - - [10/Oct/2023:13:56:01 -0700] "GET /login HTTP/1.1" 200 4523 "-" "Mozilla/5.0"
192.168.1.100 - - [10/Oct/2023:13:56:05 -0700] "POST /api/auth/login HTTP/1.1" 401 55 "-" "Mozilla/5.0"
45.22.19.112 - - [10/Oct/2023:13:57:22 -0700] "GET /api/users?id=1' OR '1'='1 HTTP/1.1" 500 120 "-" "sqlmap/1.4.11"
45.22.19.112 - - [10/Oct/2023:13:57:25 -0700] "GET /api/users?id=1; DROP TABLE users; HTTP/1.1" 500 120 "-" "sqlmap/1.4.11"
192.168.1.105 - - [10/Oct/2023:13:58:10 -0700] "GET /dashboard HTTP/1.1" 200 3102 "-" "Mozilla/5.0"
88.134.4.99 - - [10/Oct/2023:13:59:02 -0700] "POST /api/upload HTTP/1.1" 403 98 "-" "curl/7.68.0"
88.134.4.99 - - [10/Oct/2023:13:59:05 -0700] "GET /../../../../etc/passwd HTTP/1.1" 403 145 "-" "curl/7.68.0"
10.0.0.45 - - [10/Oct/2023:14:00:15 -0700] "GET /api/settings HTTP/1.1" 200 890 "-" "Mozilla/5.0"
112.45.67.89 - - [10/Oct/2023:14:01:30 -0700] "GET /search?q=<script>alert(1)</script> HTTP/1.1" 200 2341 "-" "Mozilla/5.0"
`.trim();

  res.setHeader("Content-Type", "text/plain");
  res.send(sampleData);
});

export default router;
