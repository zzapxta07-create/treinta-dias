function IconHome() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IconHistory() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconProjects() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconHabits() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}

const NAV_ITEMS = [
  { key: null,       label: 'Home',      Icon: IconHome },
  { key: 'history',  label: 'Historial', Icon: IconHistory },
  { key: 'projects', label: 'Proyectos', Icon: IconProjects },
  { key: 'habits',   label: 'Hábitos',   Icon: IconHabits },
];

export default function BottomNav({ navScreen, setNavScreen }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#101010] border-t border-[#2C2C2C] flex">
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const active = navScreen === key;
        return (
          <button
            key={label}
            onClick={() => setNavScreen(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              active ? 'text-white' : 'text-[#6B7280]'
            }`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
