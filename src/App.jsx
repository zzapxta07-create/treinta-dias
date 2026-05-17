import { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import { appDayKey, isLate } from "./utils/dateUtils";
import { loadFromCloud } from "./lib/cloudSync";
import { CLOUD_ENABLED } from "./lib/supabase";

import Header from "./components/ui/Header";
import DemoPanel from "./components/ui/DemoPanel";
import UpsPrompt from "./components/screens/UpsPrompt";
import DayLost from "./components/screens/DayLost";
import YesterdaySummary from "./components/screens/YesterdaySummary";
import DayPlanner from "./components/screens/DayPlanner";
import ShowerMode from "./components/screens/ShowerMode";
import Dashboard from "./components/screens/Dashboard";
import EvidenceMode from "./components/screens/EvidenceMode";
import DayClose from "./components/screens/DayClose";
import History from "./components/screens/History";
import FinalSummary from "./components/screens/FinalSummary";

export default function App() {
  const phase = useStore((s) => s.currentDay.phase);
  const ups = useStore((s) => s.ups);
  const initDay = useStore((s) => s.initDay);
  const setPhase = useStore((s) => s.setPhase);
  const markEnteredOnTime = useStore((s) => s.markEnteredOnTime);
  const declineUps = useStore((s) => s.declineUps);

  const [syncing, setSyncing] = useState(CLOUD_ENABLED); // show loader only if cloud is configured

  // On mount: try to load latest state from Supabase
  useEffect(() => {
    async function init() {
      if (CLOUD_ENABLED) {
        const cloud = await loadFromCloud();
        if (cloud?.data) {
          // Merge cloud state into store — cloud wins over localStorage
          const localUpdated = JSON.parse(
            localStorage.getItem("treinta-dias-store") || "{}"
          )?.state?.currentDay?.dateKey;
          const cloudDate = cloud.data.currentDay?.dateKey;
          // Only apply cloud state if it has data
          if (cloudDate || cloud.data.monthStart) {
            useStore.setState(cloud.data);
          }
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
    const late = isLate();
    markEnteredOnTime(!late);
    if (!late) {
      setPhase("yesterday");
    } else if (!ups.used && ups.total > 0) {
      setPhase("ups_prompt");
    } else {
      declineUps();
    }
  }, [phase, syncing]);

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
    history: <History />,
    final: <FinalSummary />,
  };

  const hideHeader = ["shower", "evidence", "day_lost", "ups_prompt", "init"].includes(phase);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {!hideHeader && <Header />}
      <div className={!hideHeader ? "pt-14" : ""}>{SCREENS[phase] || SCREENS.init}</div>
      <DemoPanel />
    </div>
  );
}
