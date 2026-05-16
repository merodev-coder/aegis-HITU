import { create } from "zustand";
import { apiFetch } from "../lib/api";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "analyst";
}

interface AuthState {
  user: User | null;
  isAuthLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  verifySession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthLoading: true,

  login: (user) => {
    set({ user, isAuthLoading: false });
  },

  logout: () => {
    set({ user: null, isAuthLoading: false });
    apiFetch("/api/auth/logout", {
      method: "POST",
    }).catch(() => {});
  },

  verifySession: async () => {
    try {
      const response = await apiFetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        set({ user: data.user, isAuthLoading: false });
      } else {
        set({ isAuthLoading: false });
      }
    } catch {
      set({ isAuthLoading: false });
    }
  },
}));
