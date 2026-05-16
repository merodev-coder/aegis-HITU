import { useState, useRef, useEffect } from "react";
import { Send, User, BrainCircuit, Loader2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "react-hot-toast";
import rehypeSanitize from "rehype-sanitize";
import { apiFetch } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function ensureThreatMarkdownFormat(content: string): string {
  const normalized = content.trim();
  const hasAnalysis = /^##\s+Analysis\b/m.test(normalized);
  const hasRiskLevel = /^##\s+Risk Level\b/m.test(normalized);
  const hasRemediation = /^##\s+Remediation\b/m.test(normalized);

  if (hasAnalysis && hasRiskLevel && hasRemediation) {
    return normalized;
  }

  return `## Analysis
${normalized}

## Risk Level
Assessing...

## Remediation
Provide mitigation steps based on the analysis above.`;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello. I am Aegis AI, your dedicated cybersecurity assistant. How can I assist you with your infrastructure today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard", { id: "copy" });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const assistantMessageId = (Date.now() + 1).toString();
    
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    try {
      const response = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.body) throw new Error("No response body");

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
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: ensureThreatMarkdownFormat(msg.content) }
                  : msg
              )
            );
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + parsed.content }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error("SSE parse error", e, payload);
          }
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("Failed to connect to Aegis AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between rounded-xl border border-white/5 bg-aegis-surface/60 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-aegis-primary/20 border border-aegis-primary/30">
            <BrainCircuit className="h-5 w-5 text-aegis-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-aegis-text">Aegis AI</h1>
            <p className="text-xs text-aegis-primary">Security Analysis Copilot</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col overflow-y-auto rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex flex-col gap-6 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[85%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="shrink-0 mt-1">
                      {isUser ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/20">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00d4c3]/20 border border-[#00d4c3]/50 shadow-[0_0_10px_rgba(0,212,195,0.2)]">
                          <BrainCircuit className="h-4 w-4 text-[#00d4c3]" />
                        </div>
                      )}
                    </div>
                    
                    <div
                      className={`relative overflow-hidden rounded-2xl px-5 py-4 ${
                        isUser
                          ? "bg-aegis-primary/10 border border-aegis-primary/20 text-white rounded-tr-sm"
                          : "bg-white/[0.03] border border-white/10 text-aegis-text/90 rounded-tl-sm"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                          {message.content}
                        </p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          {message.content === "" && isLoading ? (
                            <span className="flex items-center gap-2 text-aegis-primary/70 animate-pulse text-sm">
                              <BrainCircuit className="h-4 w-4" /> Analyzing threat vectors...
                            </span>
                          ) : (
                            <ReactMarkdown
                              rehypePlugins={[rehypeSanitize]}
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const language = match ? match[1] : '';
                                  const codeContent = String(children).replace(/\n$/, '');
                                  
                                  if (!inline) {
                                    const codeId = Math.random().toString(36).substr(2, 9);
                                    return (
                                      <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10">
                                        <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-1 border-b border-white/10">
                                          <span className="text-xs text-white/50 font-mono lowercase">{language || 'text'}</span>
                                          <button
                                            onClick={() => handleCopy(codeContent, codeId)}
                                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                          >
                                            {copiedId === codeId ? <Check className="h-3.5 w-3.5 text-[#00d4c3]" /> : <Copy className="h-3.5 w-3.5" />}
                                          </button>
                                        </div>
                                        <SyntaxHighlighter
                                          style={vscDarkPlus as any}
                                          language={language}
                                          PreTag="div"
                                          customStyle={{ margin: 0, padding: '1rem', background: '#0d0d0d', fontSize: '0.85rem' }}
                                          {...props}
                                        >
                                          {codeContent}
                                        </SyntaxHighlighter>
                                      </div>
                                    );
                                  }
                                  return (
                                    <code className="bg-white/10 text-[#00d4c3] px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p({ children }) {
                                  return <p className="mb-4 last:mb-0 leading-relaxed text-[15px]">{children}</p>;
                                },
                                ul({ children }) {
                                  return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>;
                                },
                                ol({ children }) {
                                  return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>;
                                },
                                h1({ children }) { return <h1 className="text-xl font-bold mb-4 mt-6 text-white">{children}</h1>; },
                                h2({ children }) { return <h2 className="text-lg font-bold mb-3 mt-5 text-white">{children}</h2>; },
                                h3({ children }) { return <h3 className="text-base font-bold mb-2 mt-4 text-white">{children}</h3>; },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 rounded-xl border border-white/5 bg-aegis-surface/60 p-4 backdrop-blur-md">
        <div className="relative flex items-end gap-3 rounded-xl border border-white/10 bg-black/50 p-2 shadow-inner focus-within:border-aegis-primary/50 focus-within:bg-black transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aegis about vulnerabilities, logs, or network config..."
            className="max-h-[150px] min-h-[44px] w-full resize-none bg-transparent py-3 pl-4 pr-12 text-sm text-white placeholder-white/30 outline-none scrollbar-thin scrollbar-thumb-white/10"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4c3] text-black transition-all hover:bg-[#00e6d3] hover:shadow-[0_0_15px_rgba(0,212,195,0.4)] disabled:opacity-50 disabled:hover:bg-[#00d4c3] disabled:hover:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-white/30">
          Aegis AI may produce inaccurate information about systems. Verify critical security actions.
        </p>
      </div>
    </div>
  );
}
