import { useStore } from '../../store/useStore';
import api from '../../api/index.js';

const AREA_COLORS = {
  NEGOCIO: '#3B82F6', SEGUNDA: '#A855F7',
  ESTUDIO: '#F59E0B', EJERCICIO: '#10B981', OTROS: '#6B7280',
};

function IconHome() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconHistory() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconProjects() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}
function IconHabits() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { key: null,       label: 'Dashboard', Icon: IconHome },
  { key: 'history',  label: 'Historial', Icon: IconHistory },
  { key: 'projects', label: 'Proyectos', Icon: IconProjects },
  { key: 'habits',   label: 'Hábitos',   Icon: IconHabits },
];

export default function Sidebar({ navScreen, setNavScreen }) {
  const user   = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const currentDay = useStore((s) => s.currentDay);

  function handleLogout() {
    logout();
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-[#101010] border-r border-[#2C2C2C] z-40">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#2C2C2C]">
        <p className="text-xs text-[#6B7280] uppercase tracking-widest mb-0.5">Productivity</p>
        <p className="text-white font-bold text-sm truncate">{user?.username}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = navScreen === key;
          return (
            <button
              key={label}
              onClick={() => setNavScreen(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-black'
                  : 'text-[#6B7280] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Icon />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Today's status */}
      {currentDay && (
        <div className="px-5 py-4 border-t border-[#2C2C2C]">
          <p className="text-[10px] text-[#374151] uppercase tracking-widest mb-2">Hoy</p>
          <p className="text-white font-mono text-2xl font-black">{currentDay.score ?? 0}</p>
          <p className="text-[#6B7280] text-xs">puntos</p>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B7280] hover:text-red-400 hover:bg-[#181818] transition-colors"
        >
          <IconLogout />
          Salir
        </button>
      </div>
    </aside>
  );
}
