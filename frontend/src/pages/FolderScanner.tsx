import {
  FolderSearch,
  Search,
  Filter,
  Trash2,
  Activity,
  Loader2,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../lib/api";
import toast from "react-hot-toast";

interface Threat {
  file: string;
  threatType: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  analysis: string;
}

interface ScanProgress {
  current: number;
  total: number;
  fileName: string;
}

export default function FolderScanner() {
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [ignoreContent, setIgnoreContent] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const fileList: { path: string; content: string }[] = [];
    let ignoreFileContent = "";

    const loadPromises = Array.from(selectedFiles).map(async (file) => {
      
      const path = (file as any).webkitRelativePath || file.name;
      
      
      const isText = /\.(js|ts|tsx|jsx|py|go|rs|c|cpp|h|java|php|html|css|json|yml|yaml|md|txt|gitignore|ignore)$/i.test(file.name);
      if (!isText && file.name !== ".gitignore" && file.name !== ".ignore") return;

      const content = await file.text();
      
      if (file.name === ".gitignore" || file.name === ".ignore") {
        ignoreFileContent += content + "\n";
      } else {
        fileList.push({ path, content });
      }
    });

    toast.promise(Promise.all(loadPromises), {
      loading: "Reading files...",
      success: () => `Loaded ${fileList.length} files.`,
      error: "Error reading some files.",
    });

    await Promise.all(loadPromises);
    setFiles(fileList);
    setIgnoreContent(ignoreFileContent);
  };

  const startScan = async () => {
    if (files.length === 0) {
      toast.error("No files to scan.");
      return;
    }

    setScanning(true);
    setThreats([]);
    setProgress(null);

    try {
      const response = await apiFetch("/api/scanner/scan-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, ignoreContent }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") break;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === "progress") {
                setProgress({ current: data.current, total: data.total, fileName: data.fileName });
              } else if (data.type === "threat") {
                setThreats((prev) => [...prev, data]);
              } else if (data.type === "complete") {
                toast.success("Scan complete!");
              }
            } catch (e) {
              console.error("Error parsing SSE data", e);
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Scan failed.");
    } finally {
      setScanning(false);
      setProgress(null);
    }
  };

  
  const filteredThreats = useMemo(() => {
    return threats.filter((t) => {
      const matchesSeverity = severityFilter === "all" || t.severity.toLowerCase() === severityFilter;
      if (!matchesSeverity) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.file.toLowerCase().includes(q) || t.threatType.toLowerCase().includes(q) || t.analysis.toLowerCase().includes(q);
    });
  }, [threats, search, severityFilter]);

  
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-aegis-text flex items-center gap-3">
            <FolderSearch className="h-6 w-6 text-aegis-primary" />
            Folder Scanner
          </h1>
          <p className="mt-1 text-sm text-aegis-muted">
            Analyze local directory for security vulnerabilities using Aegis AI
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFolderSelect}
            {...({ webkitdirectory: "", directory: "" } as any)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-aegis-text hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Select Directory
          </button>
          <button
            onClick={startScan}
            disabled={scanning || files.length === 0}
            className="flex items-center gap-2 rounded-lg bg-aegis-primary px-4 py-2 text-sm font-bold text-aegis-bg hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,212,195,0.3)]"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            {scanning ? "Scanning..." : "Start Scan"}
          </button>
        </div>
      </div>

      
      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border border-aegis-primary/20 bg-aegis-primary/5 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-aegis-primary flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing: {progress.fileName}
              </span>
              <span className="text-xs font-mono text-aegis-primary/70">
                {progress.current} / {progress.total} files
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-aegis-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-aegis-surface/60 px-3 py-2 backdrop-blur-md">
          <Search className="h-4 w-4 text-aegis-muted/40" />
          <input
            type="text"
            placeholder="Search threats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-aegis-text outline-none placeholder:text-aegis-muted/35"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-aegis-surface/60 px-3 py-2">
          <Filter className="h-4 w-4 text-aegis-muted/40" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-sm outline-none cursor-pointer text-aegis-text"
          >
            <option value="all" className="bg-aegis-bg">All Severities</option>
            <option value="critical" className="bg-aegis-bg text-[#ff3b30]">Critical</option>
            <option value="high" className="bg-aegis-bg text-[#ff9500]">High</option>
            <option value="medium" className="bg-aegis-bg text-[#ffcc00]">Medium</option>
            <option value="low" className="bg-aegis-bg text-[#00d4c3]">Low</option>
          </select>
        </div>

        {threats.length > 0 && (
          <button
            onClick={() => setThreats([])}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-aegis-muted hover:text-aegis-text transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-5 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-aegis-primary" />
            <span className="text-xs font-bold font-mono tracking-wider">THREAT ANALYSIS REPORT</span>
          </div>
          <span className="text-[10px] font-mono text-aegis-muted/40">
            {filteredThreats.length} threats found in {files.length} files
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-bold text-aegis-muted/60 uppercase tracking-widest">
              <tr>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">File Path</th>
                <th className="px-5 py-3">Threat Type</th>
                <th className="px-5 py-3">Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <AnimatePresence>
                {filteredThreats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        {scanning ? (
                          <Loader2 className="h-8 w-8 text-aegis-primary/20 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-8 w-8 text-aegis-muted/10" />
                        )}
                        <p className="text-aegis-muted/30 font-mono text-xs">
                          {scanning ? "Analyzing source code..." : threats.length > 0 ? "No threats match filter" : "Select a folder to start security audit"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredThreats.map((threat, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                          threat.severity === "Critical" ? "text-[#ff3b30] border-[#ff3b30]/20 bg-[#ff3b30]/5" :
                          threat.severity === "High" ? "text-[#ff9500] border-[#ff9500]/20 bg-[#ff9500]/5" :
                          threat.severity === "Medium" ? "text-[#ffcc00] border-[#ffcc00]/20 bg-[#ffcc00]/5" :
                          "text-[#00d4c3] border-[#00d4c3]/20 bg-[#00d4c3]/5"
                        }`}>
                          <AlertTriangle className="h-3 w-3" />
                          {threat.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-aegis-text/90">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-3.5 w-3.5 text-aegis-muted/40" />
                          {threat.file}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-aegis-text font-medium">{threat.threatType}</td>
                      <td className="px-5 py-4 text-aegis-muted text-xs leading-relaxed">{threat.analysis}</td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
