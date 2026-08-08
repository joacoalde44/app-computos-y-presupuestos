import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  suscripto: boolean;
};

type AuthState = {
  accessToken: string | null;
  usuario: Usuario | null;
  setSession: (accessToken: string, usuario: Usuario) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,
      setSession: (accessToken, usuario) => set({ accessToken, usuario }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ accessToken: null, usuario: null }),
    }),
    { name: "auth-storage", partialize: (state) => ({ usuario: state.usuario }) }
  )
);
