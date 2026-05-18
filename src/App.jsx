import { useEffect, useRef, useState } from "react";
import { useStore } from "./store/useStore";
import { appDayKey, isLate } from "./utils/dateUtils";
import { loadFromCloud } from "./lib/cloudSync";
import { CLOUD_ENABLED } from "./lib/supabase";

import Header from "./components/ui/Header";
import UpsPrompt from "./components/screens/UpsPrompt";
import DayLost from "./components/screens/DayLost";
import YesterdaySummary from "./components/screens/YesterdaySummary";
import DayPlanner from "./components/screens/DayPlanner";
import ShowerMode from "./components/screens/ShowerMode";
import Dashboard from "./components/screens/Dashboard";
import EvidenceMode from "./components/screens/EvidenceMode";
import DayClose from "./components/screens/DayClose";
import DayComplete from "./components/screens/DayComplete";
import History from "./components/screens/History";
import FinalSummary from "./components/screens/FinalSummary";
import ResetLocked from "./components/screens/ResetLocked";

export default function App() {
  const phase = useStore((s) => s.currentDay.phase);
  const ups = useStore((s) => s.ups);
  const initDay = useStore((s) => s.initDay);
  const setPhase = useStore((s) => s.setPhase);
  const markEnteredOnTime = useStore((s) => s.markEnteredOnTime);
  const declineUps = useStore((s) => s.declineUps);

  const [syncing, setSyncing] = useState(CLOUD_ENABLED);
  const [resetLocked, setResetLocked] = useState(null);
  const lastSyncedAtRef = useRef(null);

  // Cross-device sync: poll every 15s + sync immediately when tab regains focus
  useEffect(() => {
    if (!CLOUD_ENABLED) return;

    async function syncFromCloud() {
      const cloud = await loadFromCloud().catch(() => null);
      if (!cloud?.data || !cloud.updated_at) return;
      if (lastSyncedAtRef.current && cloud.updated_at <= lastSyncedAtRef.current) return;

      // Don't overwrite if this device has an active timer
      const local = useStore.getState();
      if (local.currentDay?.evidenceTimer || local.currentDay?.showerTimer) return;

      // Don't regress to an older day
      const localDate = local.currentDay?.dateKey;
      const cloudDate = cloud.data.currentDay?.dateKey;
      if (localDate && cloudDate && cloudDate < localDate) return;

      lastSyncedAtRef.current = cloud.updated_at;
      let syncData = cloud.data;
      if (syncData.currentDay?.phase === "dashboard" && syncData.currentDay?.closeComplete) {
        syncData = { ...syncData, currentDay: { ...syncData.currentDay, phase: "day_complete" } };
      }
      useStore.setState(syncData);
    }

    const interval = setInterval(syncFromCloud, 15_000);

    function onVisible() {
      if (document.visibilityState === "visible") syncFromCloud();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // On mount: check for reset lock, then load state
  useEffect(() => {
    async function init() {
      // Chequea si hay un reset pending
      const resetUnlock = localStorage.getItem("treinta-dias-reset-unlock");
      if (resetUnlock) {
        const unlocksAt = parseInt(resetUnlock, 10);
        if (Date.now() < unlocksAt) {
          setResetLocked(unlocksAt);
          setSyncing(false);
          return;
        } else {
          // Reset time has passed, clear the flag
          localStorage.removeItem("treinta-dias-reset-unlock");
        }
      }

      if (CLOUD_ENABLED) {
        try {
          const cloud = await Promise.race([
            loadFromCloud(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
          ]);
          if (cloud?.data) {
            const cloudDate = cloud.data.currentDay?.dateKey;
            if (cloudDate || cloud.data.monthStart) {
              let data = cloud.data;
              const timer = data.currentDay?.showerTimer;
              if (timer && timer.deadline < Date.now() && !data.currentDay?.showerComplete) {
                data = {
                  ...data,
                  currentDay: {
                    ...data.currentDay,
                    showerTimer: { deadline: Date.now() + 20 * 60 * 1000 },
                  },
                };
              }
              // Fix stale state: dashboard + closeComplete → day_complete
              if (data.currentDay?.phase === "dashboard" && data.currentDay?.closeComplete) {
                data = { ...data, currentDay: { ...data.currentDay, phase: "day_complete" } };
              }
              useStore.setState(data);
              // Mark this as the last synced timestamp so periodic sync doesn't re-apply
              if (cloud.updated_at) lastSyncedAtRef.current = cloud.updated_at;
            }
          }
        } catch {
          // Supabase unavailable or timed out — use localStorage fallback
        }
      }
      setSyncing(false);
      const dateKey = appDayKey();
      initDay(dateKey);
    }
    init();
  }, []);

  // After initDay sets phase to "init", decide screen
  useEffect(() => {
    if (phase !== "init" || syncing) return;

    const state = useStore.getState();
    const isDay1 = state.dayNumber === 1 && Object.keys(state.days).length === 0;

    if (isDay1) {
      markEnteredOnTime(true);
      setPhase("yesterday");
      return;
    }

    const late = isLate();
    markEnteredOnTime(!late);
    if (!late) {
      setPhase("yesterday");
    } else {
      // Always show ups_prompt when late — never auto-lose the day
      setPhase("ups_prompt");
    }
  }, [phase, syncing]);

  if (resetLocked) {
    return <ResetLocked unlocksAt={resetLocked} />;
  }

  if (syncing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-sm mb-2">Sincronizando...</div>
          <div className="w-6 h-6 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const SCREENS = {
    init: (
      <div className="flex items-center justify-center h-screen text-gray-600 text-sm">
        Cargando...
      </div>
    ),
    ups_prompt: <UpsPrompt />,
    day_lost: <DayLost />,
    yesterday: <YesterdaySummary />,
    planner: <DayPlanner />,
    shower: <ShowerMode />,
    dashboard: <Dashboard />,
    evidence: <EvidenceMode />,
    close: <DayClose />,
    day_complete: <DayComplete />,
    history: <History />,
    final: <FinalSummary />,
  };

  const hideHeader = ["shower", "evidence", "day_lost", "ups_prompt", "init", "day_complete"].includes(phase);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {!hideHeader && <Header />}
      <div className={!hideHeader ? "pt-14" : ""}>{SCREENS[phase] || SCREENS.init}</div>
    </div>
  );
}
