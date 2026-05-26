import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import api from './api/index.js';

import Login         from './components/screens/Login';
import Sidebar       from './components/ui/Sidebar';
import BottomNav     from './components/ui/BottomNav';

import DayLost       from './components/screens/DayLost';
import YesterdaySummary from './components/screens/YesterdaySummary';
import DayPlanner    from './components/screens/DayPlanner';
import MorningRitual from './components/screens/MorningRitual';
import Dashboard     from './components/screens/Dashboard';
import DayClose      from './components/screens/DayClose';
import DayComplete   from './components/screens/DayComplete';

import History       from './components/screens/History';
import Projects      from './components/screens/Projects';
import Habits        from './components/screens/Habits';

function Spinner() {
  return (
    <div className="min-h-screen bg-stone flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#3a2e22] border-t-[#c9a254] rounded-full animate-spin mx-auto mb-4" />
        <p className="font-cinzel text-[#5a4838] text-xs tracking-[0.3em] uppercase">Cargando...</p>
      </div>
    </div>
  );
}

function AppShell({ navScreen, setNavScreen, children }) {
  return (
    <div className="flex min-h-screen bg-stone">
      <Sidebar navScreen={navScreen} setNavScreen={setNavScreen} />
      <main className="flex-1 md:ml-60 pb-20 md:pb-0 overflow-auto min-h-screen">
        {children}
      </main>
      <BottomNav navScreen={navScreen} setNavScreen={setNavScreen} />
    </div>
  );
}

export default function App() {
  const token        = useStore((s) => s.token);
  const currentDay   = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const setConfig    = useStore((s) => s.setConfig);
  const logout       = useStore((s) => s.logout);

  const [loading,   setLoading]   = useState(true);
  const [navScreen, setNavScreen] = useState(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    async function init() {
      try {
        const [dayRes, cfgRes] = await Promise.all([
          api.get('/api/days/today'),
          api.get('/api/config'),
        ]);
        setCurrentDay(dayRes.data.data);
        setConfig(cfgRes.data.data);
      } catch (err) {
        if (err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) return <Login />;
  if (loading || !currentDay) return <Spinner />;

  const phase = currentDay.phase;

  const NAV_SCREENS = {
    history:  <History />,
    projects: <Projects />,
    habits:   <Habits />,
  };
  if (navScreen && NAV_SCREENS[navScreen]) {
    return (
      <AppShell navScreen={navScreen} setNavScreen={setNavScreen}>
        {NAV_SCREENS[navScreen]}
      </AppShell>
    );
  }

  const FULLSCREEN = ['ritual', 'day_lost', 'day_complete'];
  if (FULLSCREEN.includes(phase)) {
    const SCREENS = {
      day_lost:     <DayLost />,
      ritual:       <MorningRitual />,
      day_complete: <DayComplete />,
    };
    return SCREENS[phase] || <Spinner />;
  }

  const SCREENS = {
    yesterday: <YesterdaySummary />,
    planner:   <DayPlanner />,
    dashboard: <Dashboard setNavScreen={setNavScreen} />,
    close:     <DayClose />,
  };

  return (
    <AppShell navScreen={navScreen} setNavScreen={setNavScreen}>
      {SCREENS[phase] || <Spinner />}
    </AppShell>
  );
}
