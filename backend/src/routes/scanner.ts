import { Router, Request, Response } from "express";
import ignore from "ignore";
import Threat from "../models/Threat";

const router = Router();
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


interface FilePayload {
  path: string;
  content: string;
}

router.post("/scan-folder", async (req: Request, res: Response): Promise<void> => {
  try {
    const { files, ignoreContent } = req.body as { files: FilePayload[], ignoreContent?: string };

    if (!files || !Array.isArray(files)) {
      res.status(400).json({ error: "Files array is required." });
      return;
    }

    const MAX_FILES = 50;
    const MAX_CONTENT_SIZE = 100_000;

    if (files.length > MAX_FILES) {
      res.status(400).json({ error: `Maximum ${MAX_FILES} files allowed per scan.` });
      return;
    }

    for (const file of files) {
      if (typeof file.path !== "string" || typeof file.content !== "string") {
        res.status(400).json({ error: "Each file must have a string path and content." });
        return;
      }
      if (file.content.length > MAX_CONTENT_SIZE) {
        res.status(400).json({ error: `File ${file.path} exceeds the ${MAX_CONTENT_SIZE} character limit.` });
        return;
      }
    }

    const ig = ignore();
    if (ignoreContent) {
      ig.add(ignoreContent);
    }

    ig.add([".git", "node_modules", "dist", "build", ".DS_Store"]);

    const filteredFiles = files.filter(file => !ig.ignores(file.path));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent({ type: "start", total: filteredFiles.length });

    for (let i = 0; i < filteredFiles.length; i++) {
      const file = filteredFiles[i];

      sendEvent({
        type: "progress",
        current: i + 1,
        total: filteredFiles.length,
        fileName: file.path
      });

      try {
        const systemPrompt = `You are Aegis AI Code Security Auditor. Analyze the following file for security vulnerabilities.
Return ONLY a JSON object matching this schema:
{
  "hasVulnerability": boolean,
  "threatType": string,
  "severity": "Critical" | "High" | "Medium" | "Low" | "None",
  "analysis": string (1-2 sentences summarizing the finding)
}`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: `File: ${file.path}\n\nContent:\n${file.content}` }
        ];
        const response = await fetchGroq(messages, true);

        const rawContent = response.choices?.[0]?.message?.content || "{}";
        const cleanJson = rawContent.replace(/^```json\s*|```$/g, "").trim();
        const result = JSON.parse(cleanJson);

        if (result.hasVulnerability && result.severity !== "None") {
          sendEvent({
            type: "threat",
            file: file.path,
            threatType: result.threatType,
            severity: result.severity,
            analysis: result.analysis
          });

          try {
            await new Threat({
              source: "CODE",
              sourceTitle: file.path,
              description: `${result.threatType}: ${result.analysis}`,
              severity: result.severity.toLowerCase(),
              reviewStatus: "PENDING",
              rawSnippet: file.content.substring(0, 500)
            }).save();
          } catch (threatErr) {
            console.error("[Threat Save Error]", threatErr);
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error analyzing file ${file.path}:`, errMsg);
        sendEvent({
          type: "error",
          file: file.path,
          message: "Failed to analyze file."
        });
      }
    }

    sendEvent({ type: "complete", message: "Folder scan complete." });
    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Scan Folder Error]", errMsg);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error during folder scan." });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", message: "Internal server error." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

export default router;
