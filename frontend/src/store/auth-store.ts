import { create } from "zustand";
import { User, LoginInput } from "@/types/auth";
import { authApi } from "@/services/auth-api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingSession: boolean;
  error: string | null;
  loadMe: () => Promise<void>;
  login: (input: LoginInput) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingSession: true,
  error: null,

  loadMe: async () => {
    set({ isCheckingSession: true });
    try {
      const data = await authApi.getMe();
      set({
        user: data.user,
        isAuthenticated: true,
        isCheckingSession: false,
        error: null,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingSession: false,
      });
    }
  },

  login: async (input: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(input);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat login";
      set({
        error: message,
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
