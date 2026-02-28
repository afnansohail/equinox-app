import { create } from "zustand";
import { supabase } from "../services/supabase";

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  isAnonymous: boolean;
  hasCompletedOnboarding: boolean;
  initialize: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error?: string }>;
  linkAnonymousToEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setOnboardingComplete: () => void;
  getDisplayName: () => string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isAnonymous: false,
  hasCompletedOnboarding: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const isAnon = session.user?.is_anonymous ?? false;
        set({
          user: session.user,
          session,
          loading: false,
          isAnonymous: isAnon,
          hasCompletedOnboarding: true,
        });
      } else {
        set({ loading: false, hasCompletedOnboarding: false });
      }

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        const isAnon = nextSession?.user?.is_anonymous ?? false;
        set({
          user: nextSession?.user ?? null,
          session: nextSession,
          loading: false,
          isAnonymous: isAnon,
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

      set({
        user: data.user,
        session: data.session,
        loading: false,
        isAnonymous: true,
        hasCompletedOnboarding: true,
      });

      await supabase.from("user_settings").upsert({
        user_id: data.user!.id,
        refresh_interval_minutes: 30,
      });
    } catch (error) {
      console.error("[Auth] Anonymous sign-in error:", error);
      set({ loading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
        isAnonymous: false,
        hasCompletedOnboarding: true,
      });

      return {};
    } catch (error: any) {
      console.error("[Auth] Email sign-in error:", error);
      return { error: error.message || "Failed to sign in" };
    }
  },

  signUpWithEmail: async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name || email.split("@")[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        set({
          user: data.user,
          session: data.session,
          loading: false,
          isAnonymous: false,
          hasCompletedOnboarding: true,
        });

        await supabase.from("user_settings").upsert({
          user_id: data.user.id,
          refresh_interval_minutes: 30,
        });
      }

      return {};
    } catch (error: any) {
      console.error("[Auth] Email sign-up error:", error);
      return { error: error.message || "Failed to sign up" };
    }
  },

  linkAnonymousToEmail: async (email: string, password: string) => {
    try {
      // Update anonymous user with email/password
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      set({
        user: data.user,
        isAnonymous: false,
      });

      return {};
    } catch (error: any) {
      console.error("[Auth] Link account error:", error);
      return { error: error.message || "Failed to link account" };
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      console.error("[Auth] Password reset error:", error);
      return { error: error.message || "Failed to send reset email" };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({
        user: null,
        session: null,
        isAnonymous: false,
        hasCompletedOnboarding: false,
      });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  },

  setOnboardingComplete: () => {
    set({ hasCompletedOnboarding: true });
  },

  getDisplayName: () => {
    const { user, isAnonymous } = get();
    if (isAnonymous) return "Guest";
    const displayName = user?.user_metadata?.display_name;
    if (displayName) return displayName;
    return user?.email?.split("@")[0] ?? "User";
  },
}));
