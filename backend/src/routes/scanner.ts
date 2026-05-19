import { Router, Request, Response } from "express";
import { scanFolderFiles, FilePayload } from "../services/folder-scanner";

const router = Router();

router.post("/scan-folder", async (req: Request, res: Response): Promise<void> => {
  try {
    const { files, ignoreContent } = req.body as {
      files: FilePayload[];
      ignoreContent?: string;
    };

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
        res.status(400).json({
          error: `File ${file.path} exceeds the ${MAX_CONTENT_SIZE} character limit.`,
        });
        return;
      }
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    await scanFolderFiles(files, ignoreContent, sendEvent);

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
