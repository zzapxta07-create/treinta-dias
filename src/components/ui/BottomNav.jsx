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

const NAV_ITEMS = [
  { key: null,       label: 'Tablero',  Icon: IconHome },
  { key: 'history',  label: 'Crónicas', Icon: IconHistory },
  { key: 'projects', label: 'Empresas', Icon: IconProjects },
  { key: 'habits',   label: 'Virtudes', Icon: IconHabits },
];

export default function BottomNav({ navScreen, setNavScreen }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#110d0a] border-t border-[#3a2e22] flex">
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const active = navScreen === key;
        return (
          <button
            key={label}
            onClick={() => setNavScreen(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active ? 'text-[#c9a254]' : 'text-[#5a4838]'
            }`}
          >
            <Icon />
            <span className="font-cinzel text-[8px] tracking-[0.1em] uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
