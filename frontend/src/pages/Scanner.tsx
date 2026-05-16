import {
  Code2,
  Upload,
  Zap,
  Copy,
  Check,
  Terminal,
  FileCode,
  X,
  Activity,
  File as FileIcon,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../lib/api";
import { useThrottledState } from "../hooks/useThrottledState";
import { useAegisStore } from "../store/aegisStore";




type InputTab = "paste" | "upload";




const ACCEPTED_EXTENSIONS = [
  ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go",
  ".rb", ".php", ".c", ".cpp", ".cs", ".rs", ".sol",
];
const ACCEPT_STRING = ACCEPTED_EXTENSIONS.join(",");




export default function Scanner() {
  
  const [activeTab, setActiveTab] = useState<InputTab>("paste");
  const codeInput = useAegisStore((state) => state.scannerInput);
  const setCodeInput = useAegisStore((state) => state.setScannerInput);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  
  const phase = useAegisStore((state) => state.scannerPhase);
  const setPhase = useAegisStore((state) => state.setScannerPhase);
  
  const globalScannerOutput = useAegisStore((state) => state.scannerOutput);
  const setGlobalScannerOutput = useAegisStore((state) => state.setScannerOutput);

  const { value: streamOutput, addChunk: addStreamChunk, setDirectly: setStreamOutput, flush: flushStream } = useThrottledState(globalScannerOutput, 50, setGlobalScannerOutput);
  const [statusMessage, setStatusMessage] = useState("");
  const [copied, setCopied] = useState(false);

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTo({
        top: outputRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [streamOutput]);

  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (ACCEPTED_EXTENSIONS.includes(ext)) {
        setSelectedFile(file);
      } else {
        toast.error(`Unsupported file type. Use: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  
  const handleAnalyze = useCallback(async () => {
    let code: string;

    if (activeTab === "paste") {
      code = codeInput.trim();
      if (!code) {
        toast.error("Paste some code to analyze.");
        return;
      }
    } else {
      if (!selectedFile) {
        toast.error("Upload a code file to analyze.");
        return;
      }
      code = await selectedFile.text();
    }

    
    setStreamOutput("");
    setStatusMessage("");
    setPhase("scanning");
    setCopied(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setPhase("streaming");
      setStatusMessage("Connecting to Aegis AI Secure Coding Agent...");

      const response = await apiFetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: code, context: "code-scanner" }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      if (!response.body) throw new Error("ReadableStream not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const payload = trimmed.slice(6);
          if (payload === "[DONE]") {
            setPhase("complete");
            setStatusMessage("Analysis complete.");
            continue;
          }

          try {
            const event = JSON.parse(payload);
            switch (event.type) {
              case "status":
                setStatusMessage(event.message);
                break;
              case "chunk":
                addStreamChunk(event.content);
                break;
              case "complete":
                flushStream();
                setPhase("complete");
                setStatusMessage(event.message || "Done.");
                break;
              case "error":
                setPhase("error");
                setStatusMessage(event.message);
                toast.error(event.message);
                break;
            }
          } catch {
            
          }
        }
      }

      if (phase === "streaming") {
        flushStream();
        setPhase("complete");
      }
    } catch (err: any) { 
      if (err.name === "AbortError") {
        setPhase("idle");
        toast("Analysis cancelled", { icon: "⛔" });
      } else {
        setPhase("error");
        setStatusMessage(err.message || "Connection failed.");
        toast.error("Failed to connect to the AI service. Please try again.");
      }
    } finally {
      abortRef.current = null;
    }
  }, [activeTab, codeInput, selectedFile, phase, addStreamChunk, flushStream, setStreamOutput]);

  const handleCancel = () => abortRef.current?.abort();
  const isActive = phase === "scanning" || phase === "streaming";

  
  const handleCopy = useCallback(async () => {
    if (!streamOutput) return;

    
    const codeBlockMatch = streamOutput.match(/```[\w]*\n([\s\S]*?)```/g);
    let textToCopy = streamOutput;

    if (codeBlockMatch && codeBlockMatch.length > 0) {
      
      const lastBlock = codeBlockMatch[codeBlockMatch.length - 1];
      textToCopy = lastBlock.replace(/```[\w]*\n?/g, "").replace(/```$/g, "").trim();
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Fixed code copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy.");
    }
  }, [streamOutput]);

  
  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-aegis-text flex items-center gap-3">
            <Code2 className="h-6 w-6 text-aegis-primary" />
            AI Code Scanner & Fixer
          </h1>
          <p className="mt-1 text-sm text-aegis-muted">
            Upload code files or paste snippets for automated security analysis and secure code generation.
          </p>
        </div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-lg border border-aegis-primary/30 bg-aegis-primary/5 px-3 py-1.5 self-start sm:self-auto"
          >
            <Activity className="h-4 w-4 text-aegis-primary animate-pulse" />
            <span className="text-xs font-medium text-aegis-primary font-mono">
              SCANNING...
            </span>
          </motion.div>
        )}
      </div>

      
      <div className="rounded-xl border border-white/[0.06] bg-aegis-surface/60 backdrop-blur-md overflow-hidden">
        
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold font-mono tracking-wide transition-all ${
              activeTab === "paste"
                ? "text-aegis-primary border-b-2 border-aegis-primary bg-aegis-primary/5"
                : "text-aegis-muted hover:text-aegis-text hover:bg-white/[0.02]"
            }`}
            id="tab-paste-code"
          >
            <Terminal className="h-3.5 w-3.5" />
            PASTE CODE
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold font-mono tracking-wide transition-all ${
              activeTab === "upload"
                ? "text-aegis-primary border-b-2 border-aegis-primary bg-aegis-primary/5"
                : "text-aegis-muted hover:text-aegis-text hover:bg-white/[0.02]"
            }`}
            id="tab-upload-file"
          >
            <Upload className="h-3.5 w-3.5" />
            UPLOAD FILE
          </button>
        </div>

        
        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeTab === "paste" ? (
              <motion.div
                key="paste"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste your code here..."
                  className="w-full h-[220px] rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-4 text-sm text-aegis-text font-mono leading-relaxed outline-none resize-none placeholder:text-aegis-muted/25 focus:border-aegis-primary/30 transition-colors"
                  spellCheck={false}
                  id="code-input-textarea"
                />
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className={`flex flex-col items-center justify-center h-[220px] rounded-lg
                    border-2 border-dashed transition-all duration-300 ${
                    isDragging
                      ? "border-aegis-primary bg-aegis-primary/5"
                      : selectedFile
                      ? "border-aegis-primary/30 bg-[#0a0a0a]"
                      : "border-white/10 bg-[#0a0a0a] hover:border-aegis-primary/30"
                  } ${!selectedFile ? "cursor-pointer" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept={ACCEPT_STRING}
                    className="hidden"
                    id="code-file-input"
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-aegis-primary/10 border border-aegis-primary/20">
                        <FileCode className="h-5 w-5 text-aegis-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-aegis-text font-mono">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-aegis-muted font-mono">
                          {formatFileSize(selectedFile.size)} • {selectedFile.name.split(".").pop()?.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="ml-4 rounded-lg p-2 text-aegis-muted hover:bg-white/5 hover:text-aegis-text transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <FileIcon className="h-8 w-8 text-aegis-muted/30" />
                      <div className="text-center">
                        <p className="text-sm text-aegis-muted/60">
                          Drop a code file or <span className="text-aegis-primary cursor-pointer">browse</span>
                        </p>
                        <p className="text-[10px] text-aegis-muted/30 mt-1 font-mono">
                          {ACCEPTED_EXTENSIONS.join("  ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          
          <div className="flex items-center gap-3 mt-4">
            {isActive ? (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 rounded-lg border border-[#ff3b30]/30 bg-[#ff3b30]/10
                  px-5 py-2.5 text-xs font-bold text-[#ff3b30] transition-all hover:bg-[#ff3b30]/20"
              >
                <X className="h-4 w-4" />
                Cancel Analysis
              </button>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={activeTab === "paste" ? !codeInput.trim() : !selectedFile}
                className="flex items-center gap-2 rounded-lg bg-aegis-primary px-6 py-2.5
                  text-sm font-bold text-aegis-bg transition-all
                  hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,212,195,0.3)]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                id="analyze-fix-btn"
              >
                <Zap className="h-4 w-4" />
                Analyze & Fix Code
              </button>
            )}
          </div>
        </div>
      </div>

      
      <AnimatePresence>
        {(streamOutput || isActive || phase === "complete" || phase === "error") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden
              shadow-[0_0_60px_rgba(0,0,0,0.5)]"
          >
            
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-5 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff3b30]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff9500]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00d4c3]/70" />
                </div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-aegis-primary/70" />
                  <span className="text-[11px] font-semibold text-aegis-text/80 font-mono tracking-wider">
                    ANALYSIS & FIXED CODE
                  </span>
                </div>
                {isActive && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-aegis-primary/80">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aegis-primary opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aegis-primary" />
                    </span>
                    STREAMING
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {statusMessage && (
                  <motion.span
                    key={statusMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-mono text-aegis-muted/50"
                  >
                    {statusMessage}
                  </motion.span>
                )}

                {phase === "complete" && streamOutput && (
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[10px] font-bold font-mono transition-all ${
                      copied
                        ? "border-aegis-primary/30 bg-aegis-primary/10 text-aegis-primary"
                        : "border-white/10 bg-white/[0.03] text-aegis-muted hover:border-aegis-primary/30 hover:text-aegis-primary"
                    }`}
                    id="copy-fixed-code-btn"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        COPIED
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        COPY FIXED CODE
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            
            <pre
              ref={outputRef}
              className="flex-1 overflow-y-auto p-5 text-sm font-mono text-aegis-text/80
                leading-relaxed whitespace-pre-wrap break-words
                min-h-[300px] max-h-[500px]"
            >
              {streamOutput || (
                <span className="text-aegis-muted/30 italic">
                  Waiting for AI response...
                </span>
              )}
              {isActive && (
                <motion.span
                  className="inline-block w-2 h-4 bg-aegis-primary/80 ml-0.5 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                />
              )}
            </pre>

            
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-5 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-aegis-primary/40">❯</span>
                <span className="text-[10px] font-mono text-aegis-muted/35">
                  aegis-ai@secure-coder ~ /code-scanner
                </span>
              </div>
              <span className="text-[10px] font-mono text-aegis-muted/25">
                {phase === "idle"
                  ? "ready"
                  : phase === "complete"
                  ? "analysis complete"
                  : phase === "error"
                  ? "error"
                  : "analyzing..."}
                {streamOutput ? ` • ${streamOutput.length} chars` : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
