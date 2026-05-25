import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── Auth (persisted) ────────────────────────────────────
      token: null,
      user: null,

      // ─── App state from API (not persisted) ──────────────────
      currentDay: null,
      config: null,

      // ─── Client-side timers (ephemeral) ──────────────────────
      ritualTimer: null,    // { deadline }

      // ─── Actions ─────────────────────────────────────────────
      setAuth(token, user) {
        set({ token, user });
      },

      logout() {
        set({ token: null, user: null, currentDay: null, config: null, ritualTimer: null });
      },

      setCurrentDay(day) {
        set({ currentDay: day });
      },

      setConfig(config) {
        set({ config });
      },

      startRitualTimer() {
        set({ ritualTimer: { deadline: Date.now() + 30 * 60 * 1000 } });
      },

      clearRitualTimer() {
        set({ ritualTimer: null });
      },
    }),
    {
      name: 'productivity-auth',
      // Only persist auth — everything else comes from the backend
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
