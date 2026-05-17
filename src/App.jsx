import { useEffect } from "react";
import { useStore } from "./store/useStore";
import { appDayKey, isLate } from "./utils/dateUtils";

import Header from "./components/ui/Header";
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
  const currentDateKey = useStore((s) => s.currentDay.dateKey);
  const ups = useStore((s) => s.ups);
  const dayNumber = useStore((s) => s.dayNumber);
  const initDay = useStore((s) => s.initDay);
  const setPhase = useStore((s) => s.setPhase);
  const markEnteredOnTime = useStore((s) => s.markEnteredOnTime);
  const declineUps = useStore((s) => s.declineUps);

  useEffect(() => {
    const dateKey = appDayKey();
    initDay(dateKey);
  }, []);

  useEffect(() => {
    if (phase !== "init") return;
    const late = isLate();
    markEnteredOnTime(!late);
    if (!late) {
      setPhase("yesterday");
    } else if (!ups.used && ups.total > 0) {
      setPhase("ups_prompt");
    } else {
      declineUps();
    }
  }, [phase]);

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
    </div>
  );
}
