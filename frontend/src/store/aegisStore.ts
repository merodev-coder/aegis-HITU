import { create } from 'zustand';


export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "ai",
    text: "Hello! I am Aegis AI. How can I assist you with your security posture today?",
  },
];

interface AegisState {
  
  chatHistory: ChatMessage[];
  setChatHistory: (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;

  
  scannerInput: string;
  setScannerInput: (input: string) => void;
  scannerPhase: "idle" | "scanning" | "streaming" | "complete" | "error";
  setScannerPhase: (phase: "idle" | "scanning" | "streaming" | "complete" | "error") => void;
  scannerOutput: string;
  setScannerOutput: (output: string | ((prev: string) => string)) => void;

  
  logPhase: "idle" | "uploading" | "streaming" | "parsing" | "complete" | "error" | "analyzing";
  setLogPhase: (phase: "idle" | "uploading" | "streaming" | "parsing" | "complete" | "error" | "analyzing") => void;
  logOutput: string;
  setLogOutput: (output: string | ((prev: string) => string)) => void;
  logAlerts: any[];
  setLogAlerts: (alerts: any[] | ((prev: any[]) => any[])) => void;
}

export const useAegisStore = create<AegisState>((set) => ({
  
  chatHistory: initialMessages,
  setChatHistory: (history) => set((state) => ({ 
    chatHistory: typeof history === 'function' ? history(state.chatHistory) : history 
  })),

  
  scannerInput: "",
  setScannerInput: (input) => set({ scannerInput: input }),
  scannerPhase: "idle",
  setScannerPhase: (phase) => set({ scannerPhase: phase }),
  scannerOutput: "",
  setScannerOutput: (output) => set((state) => ({ 
    scannerOutput: typeof output === 'function' ? output(state.scannerOutput) : output 
  })),

  
  logPhase: "idle",
  setLogPhase: (phase) => set({ logPhase: phase }),
  logOutput: "",
  setLogOutput: (output) => set((state) => ({ 
    logOutput: typeof output === 'function' ? output(state.logOutput) : output 
  })),
  logAlerts: [],
  setLogAlerts: (alerts) => set((state) => ({
    logAlerts: typeof alerts === 'function' ? alerts(state.logAlerts) : alerts
  })),
}));
