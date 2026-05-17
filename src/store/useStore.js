import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PROJECTS } from "../data/defaultProjects";
import { appDayKey } from "../utils/dateUtils";
import { calcDayScore } from "../utils/scoring";

const INITIAL_CURRENT_DAY = {
  dateKey: null,
  phase: "init",
  enteredOnTime: null,
  usedUps: false,
  isSpecialDay: false,
  usedReplan: false,
  showerTimer: null,
  showerPhoto: null,
  dailyPhrase: "",
  showerComplete: false,
  blocks: [],
  evidenceTimer: null,
  evidences: [],
  penalties: [],
  allEvidencesComplete: false,
  closeComplete: false,
  closePhoto: null,
  closeTime: null,
  emotionalState: null,
};

export const useStore = create(
  persist(
    (set, get) => ({
      // Month config
      monthStart: null,
      dayNumber: 1,

      // Global counters
      ups: { total: 1, used: false },
      specialDays: { total: 4, usedDays: [] },
      replanDays: { total: 5, usedDays: [] },

      // Projects
      projects: DEFAULT_PROJECTS,

      // Days history: { "YYYY-MM-DD": DayRecord }
      days: {},

      // Active day state
      currentDay: { ...INITIAL_CURRENT_DAY },

      // ── Init / Day transition ──────────────────────────────
      initDay(dateKey) {
        const state = get();
        if (
          state.currentDay.dateKey === dateKey &&
          state.currentDay.phase !== "init"
        )
          return;

        const isFirst = !state.monthStart;
        const monthStart = isFirst ? dateKey : state.monthStart;

        const start = new Date(monthStart + "T12:00:00");
        const current = new Date(dateKey + "T12:00:00");
        const dayNumber = Math.round((current - start) / 86400000) + 1;

        set({
          monthStart,
          dayNumber,
          currentDay: {
            ...INITIAL_CURRENT_DAY,
            dateKey,
            phase: "init",
          },
        });
      },

      setPhase(phase) {
        set((s) => ({ currentDay: { ...s.currentDay, phase } }));
      },

      // ── UPS / Late entry ───────────────────────────────────
      useUps() {
        set((s) => ({
          ups: { ...s.ups, used: true },
          currentDay: {
            ...s.currentDay,
            enteredOnTime: true,
            usedUps: true,
            phase: "yesterday",
          },
        }));
      },

      declineUps() {
        const dateKey = get().currentDay.dateKey;
        set((s) => ({
          currentDay: { ...s.currentDay, phase: "day_lost" },
          days: {
            ...s.days,
            [dateKey]: {
              dateKey,
              status: "lost",
              score: 0,
              globalPenalty: 150,
              blocks: [],
              evidences: [],
              penalties: [],
            },
          },
        }));
      },

      markEnteredOnTime(onTime) {
        set((s) => ({
          currentDay: { ...s.currentDay, enteredOnTime: onTime },
        }));
      },

      // ── Special / Replan days ──────────────────────────────
      activateSpecialDay() {
        const dateKey = get().currentDay.dateKey;
        set((s) => ({
          specialDays: {
            ...s.specialDays,
            usedDays: [...s.specialDays.usedDays, dateKey],
          },
          currentDay: { ...s.currentDay, isSpecialDay: true },
        }));
      },

      activateReplanDay() {
        const dateKey = get().currentDay.dateKey;
        set((s) => ({
          replanDays: {
            ...s.replanDays,
            usedDays: [...s.replanDays.usedDays, dateKey],
          },
          currentDay: { ...s.currentDay, usedReplan: true },
        }));
      },

      // ── Planner ────────────────────────────────────────────
      setBlocks(blocks) {
        set((s) => ({ currentDay: { ...s.currentDay, blocks } }));
      },

      confirmPlanning() {
        const deadline = Date.now() + 30 * 60 * 1000;
        set((s) => ({
          currentDay: {
            ...s.currentDay,
            phase: "shower",
            showerTimer: { deadline },
          },
        }));
      },

      // ── Shower ─────────────────────────────────────────────
      completeShower(photo, phrase) {
        set((s) => ({
          currentDay: {
            ...s.currentDay,
            showerPhoto: photo,
            dailyPhrase: phrase,
            showerComplete: true,
            showerTimer: null,
            phase: "dashboard",
          },
        }));
      },

      showerFailed() {
        const dateKey = get().currentDay.dateKey;
        set((s) => ({
          currentDay: { ...s.currentDay, phase: "day_lost" },
          days: {
            ...s.days,
            [dateKey]: {
              dateKey,
              status: "lost",
              score: 0,
              globalPenalty: 150,
              blocks: s.currentDay.blocks,
              evidences: [],
              penalties: [],
            },
          },
        }));
      },

      // ── Evidence timer ─────────────────────────────────────
      startEvidenceTimer(blockId, slotIndex) {
        const deadline = Date.now() + 15 * 60 * 1000;
        set((s) => ({
          currentDay: {
            ...s.currentDay,
            phase: "evidence",
            evidenceTimer: { deadline, blockId, slotIndex },
          },
        }));
      },

      submitEvidence(data) {
        set((s) => {
          const pen = [];
          if (data.noHice) {
            const block = s.currentDay.blocks.find(
              (b) => b.id === data.blockId
            );
            const dur = block ? block.endMinutes - block.startMinutes : 30;
            const pts = Math.max(8, Math.floor(dur / 30) * 8);
            pen.push({
              blockId: data.blockId,
              slotIndex: data.slotIndex,
              points: pts,
              reason: "no_hice",
            });
          }
          return {
            currentDay: {
              ...s.currentDay,
              phase: "dashboard",
              evidenceTimer: null,
              evidences: [
                ...s.currentDay.evidences,
                { ...data, ts: Date.now() },
              ],
              penalties: [...s.currentDay.penalties, ...pen],
            },
          };
        });
      },

      // ── Day Close ──────────────────────────────────────────
      closeDay({ photo, emotionalState, projectProgress }) {
        const { currentDay, projects } = get();

        const updatedProjects = projects.map((p) => {
          if (projectProgress[p.id] !== undefined) {
            if (p.type === "binary") {
              return { ...p, done: projectProgress[p.id] >= 100 };
            }
            return { ...p, progress: projectProgress[p.id] };
          }
          return p;
        });

        const dayRecord = {
          ...currentDay,
          closeComplete: true,
          closePhoto: photo,
          closeTime: Date.now(),
          emotionalState,
          status: "complete",
        };
        const score = calcDayScore(dayRecord);

        set((s) => ({
          projects: updatedProjects,
          days: {
            ...s.days,
            [currentDay.dateKey]: { ...dayRecord, score },
          },
          currentDay: {
            ...s.currentDay,
            phase: "dashboard",
            closeComplete: true,
            closePhoto: photo,
            closeTime: Date.now(),
            emotionalState,
          },
        }));
      },

      // ── Recovery ───────────────────────────────────────────
      recoverDay() {
        const dateKey = get().currentDay.dateKey;
        set((s) => {
          const days = { ...s.days };
          delete days[dateKey];
          const hasBlocks = s.currentDay.blocks?.length > 0;
          return {
            days,
            currentDay: {
              ...s.currentDay,
              phase: hasBlocks ? "dashboard" : "planner",
              showerComplete: true,
              showerTimer: null,
            },
          };
        });
      },

      // ── Projects ───────────────────────────────────────────
      addProject(project) {
        set((s) => ({
          projects: [
            ...s.projects,
            { ...project, id: Date.now().toString() },
          ],
        }));
      },
    }),
    {
      name: "treinta-dias-store",
      version: 1,
    }
  )
);

import { debouncedSave } from "../lib/cloudSync";

// Check localStorage size + trigger cloud sync on every state change
useStore.subscribe((state) => {
  try {
    const data = localStorage.getItem("treinta-dias-store");
    if (data && data.length > 4_000_000) {
      console.warn(
        "⚠️ localStorage cerca del límite de 4MB. Considerá limpiar fotos antiguas."
      );
    }
  } catch (_) {}

  // Sync to Supabase (debounced 2s, no-op if CLOUD_ENABLED is false)
  const { monthStart, dayNumber, ups, specialDays, replanDays, projects, days, currentDay } = state;
  debouncedSave({ monthStart, dayNumber, ups, specialDays, replanDays, projects, days, currentDay });
});
