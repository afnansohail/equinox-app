import { create } from "zustand";
import { supabase } from "../services/supabase";

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        set({ user: session.user, session, loading: false });
      } else {
        await get().signInAnonymously();
      }

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        set({
          user: nextSession?.user ?? null,
          session: nextSession,
          loading: false,
        });
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ loading: false });
    }
  },

  signInAnonymously: async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      set({ user: data.user, session: data.session, loading: false });

      await supabase.from("user_settings").upsert({
        user_id: data.user!.id,
        refresh_interval_minutes: 30,
      });
    } catch (error) {
      console.error("[Auth] Anonymous sign-in error:", error);
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  },
}));
