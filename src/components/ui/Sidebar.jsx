import { useStore } from '../../store/useStore';

function IconHome() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IconHistory() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconProjects() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconHabits() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function IconCalendar() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconLogout() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

const NAV_ITEMS = [
  { key: null,       label: 'Tablero',   Icon: IconHome },
  { key: 'history',  label: 'Crónicas',  Icon: IconHistory },
  { key: 'projects', label: 'Empresas',  Icon: IconProjects },
  { key: 'habits',   label: 'Virtudes',  Icon: IconHabits },
  { key: 'weekly',   label: 'Semana',    Icon: IconCalendar },
];

export default function Sidebar({ navScreen, setNavScreen }) {
  const user       = useStore((s) => s.user);
  const logout     = useStore((s) => s.logout);
  const currentDay = useStore((s) => s.currentDay);

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-[#110d0a] border-r border-[#3a2e22] z-40">

      {/* Brand */}
      <div className="px-5 py-6 border-b border-[#3a2e22]">
        <p className="font-cinzel text-[#c9a254] text-xl font-bold tracking-[0.12em]">VIGILIA</p>
        <p className="font-cinzel text-[#5a4838] text-[8px] tracking-[0.35em] mt-0.5">XXX DIES</p>
        <div className="h-px bg-[#3a2e22] my-3" />
        <p className="text-[#9a8470] text-sm truncate">{user?.username}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = navScreen === key;
          return (
            <button
              key={label}
              onClick={() => setNavScreen(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#c9a254]/15 text-[#c9a254] border border-[#c9a254]/25'
                  : 'text-[#9a8470] hover:text-[#f0e6d0] hover:bg-[#1a1410] border border-transparent'
              }`}
            >
              <Icon />
              <span className="font-cinzel tracking-[0.05em] text-[13px]">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Today's score */}
      {currentDay && (
        <div className="px-5 py-4 border-t border-[#3a2e22]">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-px bg-[#3a2e22]" />
            <p className="font-cinzel text-[8px] text-[#5a4838] tracking-[0.25em] uppercase">Hoy</p>
            <div className="flex-1 h-px bg-[#3a2e22]" />
          </div>
          <p className="font-mono text-[#c9a254] text-2xl font-black text-center">{currentDay.score ?? 0}</p>
          <p className="font-cinzel text-[#5a4838] text-[8px] tracking-[0.2em] text-center uppercase">puntos</p>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#5a4838] hover:text-[#8b1a2a] hover:bg-[#1a1410] transition-colors border border-transparent"
        >
          <IconLogout />
          <span className="font-cinzel tracking-[0.05em] text-[12px]">Salir</span>
        </button>
      </div>
    </aside>
  );
}
