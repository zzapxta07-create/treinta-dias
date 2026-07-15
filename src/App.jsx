import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import api from './api/index.js';

import Login         from './components/screens/Login';
import Sidebar       from './components/ui/Sidebar';
import BottomNav     from './components/ui/BottomNav';
import Onboarding    from './components/screens/Onboarding';

import DayLost       from './components/screens/DayLost';
import YesterdaySummary from './components/screens/YesterdaySummary';
import DayPlanner    from './components/screens/DayPlanner';
import MorningRitual from './components/screens/MorningRitual';
import Dashboard     from './components/screens/Dashboard';
import DayClose      from './components/screens/DayClose';
import DayComplete   from './components/screens/DayComplete';
import UpsPrompt     from './components/screens/UpsPrompt';

import History       from './components/screens/History';
import Projects      from './components/screens/Projects';
import Habits        from './components/screens/Habits';
import WeeklyPlanner from './components/screens/WeeklyPlanner';
import Notes         from './components/screens/Notes';
import Tasks         from './components/screens/Tasks';
import Config        from './components/screens/Config';

function Spinner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09080e' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#2c2740] border-t-[#d4a956] rounded-full animate-spin mx-auto mb-4" />
        <p className="font-cinzel text-[#4d4568] text-xs tracking-[0.3em] uppercase">Cargando...</p>
        {slow && (
          <p className="font-cinzel text-[#4d4568] text-[9px] tracking-[0.2em] mt-3 uppercase opacity-60">
            Despertando servidor...
          </p>
        )}
      </div>
    </div>
  );
}

function AppShell({ navScreen, setNavScreen, onReset, children }) {
  return (
    <div className="flex min-h-screen bg-stone">
      <Sidebar navScreen={navScreen} setNavScreen={setNavScreen} onReset={onReset} />
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
  const setAreas     = useStore((s) => s.setAreas);
  const logout       = useStore((s) => s.logout);

  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState(null);
  const [retryKey,    setRetryKey]    = useState(0);
  const [navScreen,   setNavScreen]   = useState(null);
  const [onboarding,  setOnboarding]  = useState(false);

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
        api.get('/api/areas').then(r => setAreas(r.data.data)).catch(() => {});
      } catch (err) {
        if (err.response?.status === 401) { logout(); return; }
        setLoadError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReset() {
    await api.post('/api/reset');
    setCurrentDay(null);
    setAreas(null);
    setOnboarding(true);
    setNavScreen(null);
  }

  async function handleOnboardingComplete() {
    setOnboarding(false);
    setLoading(true);
    try {
      const [dayRes, cfgRes] = await Promise.all([
        api.get('/api/days/today'),
        api.get('/api/config'),
      ]);
      setCurrentDay(dayRes.data.data);
      setConfig(cfgRes.data.data);
      api.get('/api/areas').then(r => setAreas(r.data.data)).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  if (!token) return <Login />;
  if (onboarding) return <Onboarding onComplete={handleOnboardingComplete} />;
  if (loading) return <Spinner />;
  if (loadError || !currentDay) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09080e' }}>
      <div className="text-center px-6">
        <p className="font-cinzel text-[#9b1f30] text-sm mb-2 tracking-widest uppercase">Error de conexión</p>
        <p className="text-[#4d4568] text-xs mb-6">{loadError || 'No se pudo cargar el día.'}</p>
        <button
          onClick={() => { setLoadError(null); setLoading(true); setRetryKey(k => k + 1); }}
          className="font-cinzel text-[#d4a956] text-[11px] tracking-[0.2em] uppercase border border-[#d4a956]/30 px-6 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  const phase = currentDay.phase;

  const NAV_SCREENS = {
    history:  <History />,
    projects: <Projects />,
    habits:   <Habits />,
    weekly:   <WeeklyPlanner />,
    notes:    <Notes />,
    tasks:    <Tasks />,
    config:   <Config />,
  };
  if (navScreen && NAV_SCREENS[navScreen]) {
    return (
      <AppShell navScreen={navScreen} setNavScreen={setNavScreen} onReset={handleReset}>
        {NAV_SCREENS[navScreen]}
      </AppShell>
    );
  }

  const FULLSCREEN = ['ritual', 'day_lost', 'day_complete', 'ups_prompt'];
  if (FULLSCREEN.includes(phase)) {
    const SCREENS = {
      day_lost:     <DayLost />,
      ritual:       <MorningRitual />,
      day_complete: <DayComplete />,
      ups_prompt:   <UpsPrompt />,
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
    <AppShell navScreen={navScreen} setNavScreen={setNavScreen} onReset={handleReset}>
      {SCREENS[phase] || <Spinner />}
    </AppShell>
  );
}
