import { Router, Request, Response } from "express";
import {
  analyzePhishingEmail,
  recordChatThreat,
  sanitizeForLlm,
  streamAnalyzeResponse,
  streamChatResponse,
} from "../services/ai-controller";

const router = Router();

router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const { message } = req.body;

    if (!message) {
      res.write(`data: ${JSON.stringify({ error: "Message is required." })}\n\n`);
      res.end();
      return;
    }

    const userMessage = sanitizeForLlm(String(message).trim());

    try {
      await recordChatThreat(userMessage);
    } catch (threatErr) {
      console.error("[Threat Save Error]", threatErr);
    }

    await streamChatResponse(userMessage, (content) => {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Groq Error]", errMsg);
    res.write(`data: ${JSON.stringify({ error: "Connection interrupted or failed." })}\n\n`);
    res.end();
  }
});

router.post("/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { input, context } = req.body;

    if (!input || typeof input !== "string" || !input.trim()) {
      res.status(400).json({ error: "Input content is required." });
      return;
    }

    if (context && typeof context !== "string") {
      res.status(400).json({ error: "Invalid context type." });
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const fullResponse = await streamAnalyzeResponse(
      String(input).trim(),
      context || "default",
      sendEvent
    );

    sendEvent({
      type: "complete",
      message: "Analysis complete.",
      fullResponse,
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI Analyze Error]", errMsg);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service connection failed." });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", message: "AI service connection failed." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

router.post("/analyze-phishing", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      res.status(400).json({ error: "Email content is required." });
      return;
    }

    const parsedResponse = await analyzePhishingEmail(String(email).trim());
    res.json(parsedResponse);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Phishing Analyze Error]", errMsg);
    res.status(500).json({ error: "Failed to analyze email." });
  }
});

export default router;
