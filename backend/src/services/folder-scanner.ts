import ignore from "ignore";
import Threat from "../models/Threat";
import { delay, fetchGroq, getAiMessageContent, parseAiJson } from "./groq";

const SCAN_DELAY_MS = 1500;

export interface FilePayload {
  path: string;
  content: string;
}

export interface ScanThreatEvent {
  type: "threat";
  file: string;
  threatType: string;
  severity: string;
  analysis: string;
}

interface FileScanResult {
  hasVulnerability: boolean;
  threatType: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "None";
  analysis: string;
}

const FILE_SCAN_PROMPT = `You are Aegis AI Code Security Auditor. Analyze the following file for security vulnerabilities.
Return ONLY a JSON object matching this schema (no markdown, no backticks):
{
  "hasVulnerability": boolean,
  "threatType": string,
  "severity": "Critical" | "High" | "Medium" | "Low" | "None",
  "analysis": string
}`;

export function filterScannableFiles(
  files: FilePayload[],
  ignoreContent?: string
): FilePayload[] {
  const ig = ignore();
  if (ignoreContent) ig.add(ignoreContent);
  ig.add([".git", "node_modules", "dist", "build", ".DS_Store"]);
  return files.filter((file) => !ig.ignores(file.path));
}

export async function analyzeFileForThreats(
  file: FilePayload
): Promise<ScanThreatEvent | null> {
  const messages = [
    { role: "system", content: FILE_SCAN_PROMPT },
    { role: "user", content: `File: ${file.path}\n\nContent:\n${file.content}` },
  ];

  const response = await fetchGroq(messages, true);
  const rawText = getAiMessageContent(response);
  const result = parseAiJson<FileScanResult>(rawText, {
    hasVulnerability: false,
    threatType: "None",
    severity: "None",
    analysis: "No issues detected.",
  });

  if (!result.hasVulnerability || result.severity === "None") {
    return null;
  }

  try {
    await new Threat({
      source: "CODE",
      sourceTitle: file.path,
      description: `${result.threatType}: ${result.analysis}`,
      severity: result.severity.toLowerCase(),
      reviewStatus: "PENDING",
      rawSnippet: file.content.substring(0, 500),
    }).save();
  } catch (threatErr) {
    console.error("[Threat Save Error]", threatErr);
  }

  return {
    type: "threat",
    file: file.path,
    threatType: result.threatType,
    severity: result.severity,
    analysis: result.analysis,
  };
}

export async function scanFolderFiles(
  files: FilePayload[],
  ignoreContent: string | undefined,
  sendEvent: (data: object) => void
): Promise<void> {
  const filteredFiles = filterScannableFiles(files, ignoreContent);
  sendEvent({ type: "start", total: filteredFiles.length });

  for (let i = 0; i < filteredFiles.length; i++) {
    const file = filteredFiles[i];

    sendEvent({
      type: "progress",
      current: i + 1,
      total: filteredFiles.length,
      fileName: file.path,
    });

    try {
      const threat = await analyzeFileForThreats(file);
      if (threat) sendEvent(threat);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Error analyzing file ${file.path}:`, errMsg);
      sendEvent({
        type: "error",
        file: file.path,
        message: errMsg.includes("429")
          ? "Rate limited — retrying on next file."
          : "Failed to analyze file.",
      });
    }

    if (i < filteredFiles.length - 1) {
      await delay(SCAN_DELAY_MS);
    }
  }

  sendEvent({ type: "complete", message: "Folder scan complete." });
}
