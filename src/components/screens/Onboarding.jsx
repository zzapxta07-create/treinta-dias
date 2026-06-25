import { useState } from 'react';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const AREAS = [
  { id: 'NEGOCIO',   label: 'Negocio Principal',  color: '#3B82F6', emoji: '🏛' },
  { id: 'SEGUNDA',   label: 'Segunda Empresa',     color: '#A855F7', emoji: '⚔' },
  { id: 'ESTUDIO',   label: 'Estudio Individual',  color: '#F59E0B', emoji: '📖' },
  { id: 'EJERCICIO', label: 'Ejercicio',            color: '#10B981', emoji: '🛡' },
  { id: 'OTROS',     label: 'Otros',               color: '#9490aa', emoji: '◆' },
];

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
};

const inputStyle = {
  width: '100%',
  background: '#09080e',
  color: '#f0e6d0',
  border: '1px solid #2c2740',
  borderRadius: '8px',
  padding: '10px 12px',
  outline: 'none',
  fontFamily: "'Crimson Text', serif",
  fontSize: '14px',
  transition: 'border-color 0.2s',
};

// ── Step 1: Welcome ────────────────────────────────────────────────────────────
function StepWelcome({ onNext }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ border: '1px solid rgba(212,169,86,0.4)', background: '#110e1c' }}>
        <span style={{ fontSize: '40px' }}>⚔</span>
      </div>
      <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-3" style={{ color: '#4d4568' }}>
        Vigilia · XXX Dies
      </p>
      <h1 className="font-cinzel text-3xl font-bold tracking-[0.06em] mb-3" style={{ color: '#f0e6d0' }}>
        Nuevo Comienzo
      </h1>
      <DiamondOrnament />
      <p className="text-sm leading-relaxed mt-4 mb-8 max-w-sm mx-auto" style={{ color: '#9490aa' }}>
        Tus datos anteriores han sido eliminados. En los próximos pasos configurarás
        tus empresas y virtudes para comenzar los 30 días desde cero.
      </p>
      <button onClick={onNext} className="btn-primary px-8">
        Configurar desde cero →
      </button>
    </div>
  );
}

// ── Step 2: Projects ───────────────────────────────────────────────────────────
function StepProjects({ onNext, onBack }) {
  const [projects, setProjects] = useState([{ name: '', area_id: 'NEGOCIO' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addProject() {
    setProjects(p => [...p, { name: '', area_id: 'NEGOCIO' }]);
  }

  function removeProject(i) {
    setProjects(p => p.filter((_, idx) => idx !== i));
  }

  function updateProject(i, field, val) {
    setProjects(p => p.map((proj, idx) => idx === i ? { ...proj, [field]: val } : proj));
  }

  async function handleNext() {
    const valid = projects.filter(p => p.name.trim());
    if (valid.length === 0) { setError('Agrega al menos una empresa.'); return; }
    setSaving(true);
    try {
      for (const p of valid) {
        await api.post('/api/projects', { name: p.name.trim(), area_id: p.area_id, type: 'percent' });
      }
      onNext();
    } catch {
      setError('Error al guardar proyectos. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
          Paso 1 de 2
        </p>
        <h2 className="font-cinzel text-2xl font-bold" style={{ color: '#f0e6d0' }}>Tus Empresas</h2>
        <p className="text-sm mt-2" style={{ color: '#9490aa' }}>Los proyectos en los que trabajarás estos 30 días</p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {projects.map((proj, i) => {
          const area = AREAS.find(a => a.id === proj.area_id);
          return (
            <div key={i} className="p-4 rounded-xl" style={{ ...panelStyle, borderLeftWidth: 3, borderLeftColor: area?.color }}>
              <div className="flex gap-2 mb-3">
                <input
                  placeholder="Nombre del proyecto..."
                  value={proj.name}
                  onChange={e => updateProject(i, 'name', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
                  onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
                />
                {projects.length > 1 && (
                  <button onClick={() => removeProject(i)}
                    className="px-3 rounded text-sm transition-colors"
                    style={{ color: '#4d4568', border: '1px solid #2c2740', background: '#09080e' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#9b1f30'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}>
                    ✕
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {AREAS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => updateProject(i, 'area_id', a.id)}
                    className="font-cinzel text-[8px] tracking-[0.08em] uppercase px-2.5 py-1.5 rounded transition-all"
                    style={{
                      border: `1px solid ${proj.area_id === a.id ? a.color : '#2c2740'}`,
                      background: proj.area_id === a.id ? `${a.color}18` : 'transparent',
                      color: proj.area_id === a.id ? a.color : '#4d4568',
                    }}
                  >
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={addProject}
        className="w-full py-2.5 rounded-lg font-cinzel text-[10px] tracking-[0.15em] uppercase transition-colors mb-6"
        style={{ border: '1px dashed #2c2740', color: '#4d4568', background: 'transparent' }}
        onMouseOver={e => { e.currentTarget.style.borderColor = '#d4a956'; e.currentTarget.style.color = '#d4a956'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = '#2c2740'; e.currentTarget.style.color = '#4d4568'; }}>
        + Agregar empresa
      </button>

      {error && <p className="text-sm mb-4 text-center" style={{ color: '#9b1f30' }}>{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg font-cinzel text-[11px] tracking-[0.1em] uppercase transition-colors"
          style={{ border: '1px solid #2c2740', color: '#4d4568', background: 'transparent' }}
          onMouseOver={e => { e.currentTarget.style.color = '#9490aa'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}>
          ← Volver
        </button>
        <button onClick={handleNext} disabled={saving} className="flex-[2] btn-primary disabled:opacity-30">
          {saving ? 'Guardando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Habits ─────────────────────────────────────────────────────────────
function StepHabits({ onNext, onBack }) {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState('');
  const [area, setArea] = useState('EJERCICIO');
  const [saving, setSaving] = useState(false);

  function addHabit() {
    if (!name.trim()) return;
    setHabits(h => [...h, { name: name.trim(), area_id: area }]);
    setName('');
  }

  function removeHabit(i) {
    setHabits(h => h.filter((_, idx) => idx !== i));
  }

  async function handleFinish() {
    setSaving(true);
    try {
      for (const h of habits) {
        await api.post('/api/habits', { name: h.name, area_id: h.area_id, frequency: 'daily' });
      }
      onNext();
    } catch {
      onNext(); // non-critical, proceed anyway
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
          Paso 2 de 2
        </p>
        <h2 className="font-cinzel text-2xl font-bold" style={{ color: '#f0e6d0' }}>Tus Virtudes</h2>
        <p className="text-sm mt-2" style={{ color: '#9490aa' }}>Hábitos diarios a cultivar (opcional — puedes agregar más después)</p>
      </div>

      {/* Add habit row */}
      <div className="flex gap-2 mb-3">
        <input
          placeholder="Nombre del hábito..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addHabit()}
          style={{ ...inputStyle, flex: 1 }}
          onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
          onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
        />
        <select
          value={area}
          onChange={e => setArea(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '10px 8px', cursor: 'pointer' }}>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>)}
        </select>
        <button onClick={addHabit}
          className="px-4 rounded-lg font-cinzel text-[10px] tracking-widest uppercase"
          style={{ background: 'rgba(212,169,86,0.1)', border: '1px solid rgba(212,169,86,0.4)', color: '#d4a956' }}>
          +
        </button>
      </div>

      {/* Habit list */}
      {habits.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {habits.map((h, i) => {
            const a = AREAS.find(ar => ar.id === h.area_id);
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{ background: '#09080e', border: '1px solid #2c2740' }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a?.color }} />
                <span className="flex-1 text-sm" style={{ color: '#f0e6d0' }}>{h.name}</span>
                <span className="font-cinzel text-[9px]" style={{ color: '#4d4568' }}>{a?.label}</span>
                <button onClick={() => removeHabit(i)} style={{ color: '#4d4568' }}
                  onMouseOver={e => { e.currentTarget.style.color = '#9b1f30'; }}
                  onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {habits.length === 0 && (
        <div className="py-8 text-center mb-6" style={{ border: '1px dashed #2c2740', borderRadius: '12px' }}>
          <p className="font-cinzel text-[9px] tracking-[0.2em] uppercase" style={{ color: '#2c2740' }}>
            Sin hábitos aún — puedes agregarlos después
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 rounded-lg font-cinzel text-[11px] tracking-[0.1em] uppercase transition-colors"
          style={{ border: '1px solid #2c2740', color: '#4d4568', background: 'transparent' }}
          onMouseOver={e => { e.currentTarget.style.color = '#9490aa'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}>
          ← Volver
        </button>
        <button onClick={handleFinish} disabled={saving} className="flex-[2] btn-primary disabled:opacity-30">
          {saving ? 'Guardando...' : '¡Comenzar Jornada! →'}
        </button>
      </div>
    </div>
  );
}

// ── Main Onboarding ────────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: '#09080e' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,169,86,0.05) 0%, transparent 60%)' }} />

      <div className="relative w-full max-w-lg">
        {/* Progress dots */}
        {step > 0 && (
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i < step ? '#d4a956' : i === step ? '#9490aa' : '#2c2740' }} />
            ))}
          </div>
        )}

        <div className="rounded-2xl p-8" style={panelStyle}>
          {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
          {step === 1 && <StepProjects onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <StepHabits onNext={onComplete} onBack={() => setStep(1)} />}
        </div>
      </div>
    </div>
  );
}
