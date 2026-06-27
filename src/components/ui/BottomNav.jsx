import { useStore } from '../../store/useStore';
import { useEffect, useState } from 'react';

function useNowMinutes() {
  const [mins, setMins] = useState(() => {
    const d = new Date(); return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date(); setMins(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, []);
  return mins;
}

function IconHome() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IconHistory() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconProjects() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconHabits() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function IconCalendar() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconTasks() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function IconNotes() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function IconConfig() {
  return <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}

const NAV_ITEMS = [
  { key: null,       label: 'Tablero',  Icon: IconHome },
  { key: 'history',  label: 'Crónicas', Icon: IconHistory },
  { key: 'projects', label: 'Empresas', Icon: IconProjects },
  { key: 'habits',   label: 'Virtudes', Icon: IconHabits },
  { key: 'weekly',   label: 'Semana',   Icon: IconCalendar },
  { key: 'tasks',    label: 'Tareas',   Icon: IconTasks },
  { key: 'notes',    label: 'Notas',    Icon: IconNotes },
  { key: 'config',   label: 'Config',   Icon: IconConfig },
];

export default function BottomNav({ navScreen, setNavScreen }) {
  const currentDay = useStore((s) => s.currentDay);
  const nowMins    = useNowMinutes();

  const pendingCount = (() => {
    if (!currentDay) return 0;
    const blocks    = (currentDay.blocks || []).filter(b => b.area_id !== 'OTROS');
    const evidences = currentDay.evidences || [];
    return blocks.filter(b =>
      (b.end_minutes ?? b.endMinutes) <= nowMins &&
      !evidences.some(e => e.block_id === b.id)
    ).length;
  })();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: 'linear-gradient(180deg, rgba(11,9,18,0.97) 0%, rgba(9,7,14,1) 100%)',
        borderTop: '1px solid #2c2740',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #2c2740 30%, #3e3858 50%, #2c2740 70%, transparent 100%)' }} />

      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const active = navScreen === key;
        const isHome = key === null;
        return (
          <button
            key={label}
            onClick={() => {
              setNavScreen(key);
              if (isHome && pendingCount > 0) {
                setTimeout(() => {
                  document.getElementById('notifications-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-150 relative ${
              active ? 'text-[#d4a956]' : 'text-[#4d4568]'
            }`}
            style={active ? { filter: 'drop-shadow(0 0 6px rgba(212,169,86,0.3))' } : {}}
          >
            {/* Active indicator */}
            {active && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #d4a956, transparent)' }} />
            )}

            <div className="relative">
              <Icon />
              {isHome && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full font-mono text-[#f0e6d0] text-[7px] font-black leading-none"
                  style={{ background: '#9b1f30', boxShadow: '0 0 6px rgba(155,31,48,0.5)' }}>
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="font-cinzel text-[7px] tracking-[0.12em] uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
