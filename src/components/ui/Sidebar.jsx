import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { GreatHelm } from './Ornaments';

function IconHome() {
  return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IconHistory() {
  return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconProjects() {
  return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconHabits() {
  return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function IconCalendar() {
  return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconTasks() {
  return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function IconNotes() {
  return <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function IconLogout() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function IconReset() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>;
}

const NAV_ITEMS = [
  { key: null,       label: 'Tablero',   Icon: IconHome },
  { key: 'history',  label: 'Crónicas',  Icon: IconHistory },
  { key: 'projects', label: 'Empresas',  Icon: IconProjects },
  { key: 'habits',   label: 'Virtudes',  Icon: IconHabits },
  { key: 'weekly',   label: 'Semana',    Icon: IconCalendar },
  { key: 'tasks',    label: 'Tareas',    Icon: IconTasks },
  { key: 'notes',    label: 'Notas',     Icon: IconNotes },
];

export default function Sidebar({ navScreen, setNavScreen, onReset }) {
  const user       = useStore((s) => s.user);
  const logout     = useStore((s) => s.logout);
  const currentDay = useStore((s) => s.currentDay);
  const [confirm,  setConfirm]  = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    try { await onReset?.(); }
    finally { setResetting(false); setConfirm(false); }
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 z-40"
      style={{
        background: 'linear-gradient(180deg, #0f0d1a 0%, #0c0a14 60%, #09080f 100%)',
        borderRight: '1px solid #2c2740',
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
      }}>

      {/* Subtle top accent line */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #d4a956, transparent)', opacity: 0.5 }} />

      {/* Brand */}
      <div className="px-5 py-6 relative overflow-hidden" style={{ borderBottom: '1px solid #2c2740' }}>
        {/* Faint helm watermark */}
        <div className="absolute right-2 top-0 opacity-[0.06] pointer-events-none">
          <GreatHelm size={72} color="#d4a956" strokeWidth={1} />
        </div>
        <div className="relative">
          <p className="font-cinzel text-[#d4a956] text-xl font-bold tracking-[0.14em]">VIGILIA</p>
          <p className="font-cinzel text-[#4d4568] text-[7px] tracking-[0.5em] mt-0.5 uppercase">XXX · DIES</p>
          <div className="h-px mt-3 mb-2" style={{ background: 'linear-gradient(90deg, #2c2740, transparent)' }} />
          <p className="text-[#9490aa] text-sm truncate">{user?.username}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = navScreen === key;
          return (
            <button
              key={label}
              onClick={() => setNavScreen(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? 'text-[#d4a956] border border-[#d4a956]/20'
                  : 'text-[#9490aa] hover:text-[#f0e6d0] border border-transparent hover:border-[#2c2740]'
              }`}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(212,169,86,0.12) 0%, rgba(212,169,86,0.04) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(212,169,86,0.08)',
              } : {
                background: 'transparent',
              }}
            >
              <span className={`transition-colors ${active ? 'text-[#d4a956]' : ''}`}>
                <Icon />
              </span>
              <span className="font-cinzel tracking-[0.06em] text-[12px]">{label}</span>
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-[#d4a956] opacity-80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Score panel */}
      {currentDay && (
        <div className="mx-3 mb-3 rounded-lg px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(212,169,86,0.07) 0%, rgba(212,169,86,0.02) 100%)',
            border: '1px solid rgba(212,169,86,0.15)',
          }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #2c2740, transparent)' }} />
            <p className="font-cinzel text-[7px] text-[#4d4568] tracking-[0.3em] uppercase">Jornada</p>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #2c2740)' }} />
          </div>
          <p className="font-mono text-[#d4a956] text-2xl font-black text-center" style={{ textShadow: '0 0 20px rgba(212,169,86,0.3)' }}>
            {currentDay.score ?? 0}
          </p>
          <p className="font-cinzel text-[#4d4568] text-[7px] tracking-[0.25em] text-center uppercase">puntos</p>
        </div>
      )}

      {/* Reset + Logout */}
      <div className="px-3 pb-4 flex flex-col gap-1" style={{ borderTop: '1px solid #2c2740', paddingTop: '12px' }}>
        <button
          onClick={() => setConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border border-transparent"
          style={{ color: '#4d4568' }}
          onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.2)'; e.currentTarget.style.background = 'rgba(212,169,86,0.04)'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
        >
          <IconReset />
          <span className="font-cinzel tracking-[0.06em] text-[11px]">Reiniciar desde cero</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#4d4568] hover:text-[#9b1f30] transition-colors border border-transparent hover:border-[#9b1f30]/20"
        >
          <IconLogout />
          <span className="font-cinzel tracking-[0.06em] text-[11px]">Salir</span>
        </button>
      </div>

      {/* Confirm reset modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, #1a0e14 0%, #110e1c 100%)', border: '1px solid rgba(155,31,48,0.4)' }}>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                style={{ border: '1px solid rgba(155,31,48,0.4)', background: 'rgba(155,31,48,0.08)' }}>
                <span style={{ color: '#9b1f30', fontSize: '20px' }}>⚠</span>
              </div>
              <h3 className="font-cinzel text-lg font-bold mb-2" style={{ color: '#f0e6d0' }}>¿Reiniciar todo?</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9490aa' }}>
                Esto eliminará permanentemente todos tus días, bloques, evidencias, proyectos y hábitos.
                Tu cuenta permanecerá activa.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="w-full py-3 rounded-lg font-cinzel text-[11px] tracking-[0.15em] uppercase font-bold transition-colors disabled:opacity-30"
                style={{ background: '#9b1f30', color: '#f0e6d0' }}
              >
                {resetting ? 'Eliminando...' : 'Sí, borrar todo y empezar de cero'}
              </button>
              <button
                onClick={() => setConfirm(false)}
                disabled={resetting}
                className="w-full py-3 rounded-lg font-cinzel text-[11px] tracking-[0.1em] uppercase transition-colors disabled:opacity-30"
                style={{ border: '1px solid #2c2740', color: '#4d4568', background: 'transparent' }}
                onMouseOver={e => { e.currentTarget.style.color = '#9490aa'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom subtle accent */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #2c2740, transparent)' }} />
    </aside>
  );
}
