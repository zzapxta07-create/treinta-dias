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
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IconHistory() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconProjects() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconHabits() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function IconCalendar() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconBell() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}

const NAV_ITEMS = [
  { key: null,       label: 'Tablero',  Icon: IconHome },
  { key: 'history',  label: 'Crónicas', Icon: IconHistory },
  { key: 'projects', label: 'Empresas', Icon: IconProjects },
  { key: 'habits',   label: 'Virtudes', Icon: IconHabits },
  { key: 'weekly',   label: 'Semana',   Icon: IconCalendar },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#110d0a] border-t border-[#3a2e22] flex">
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
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
              active ? 'text-[#c9a254]' : 'text-[#5a4838]'
            }`}
          >
            <div className="relative">
              <Icon />
              {isHome && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#8b1a2a] font-mono text-[#f0e6d0] text-[7px] font-black leading-none">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="font-cinzel text-[8px] tracking-[0.1em] uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
