import { useState } from 'react';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';
import { DEFAULT_AREAS } from '../../data/areas';

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

const PRESET_COLORS = [
  '#3B82F6', '#A855F7', '#F59E0B', '#10B981', '#6B7280',
  '#EC4899', '#EF4444', '#F97316', '#14B8A6', '#8B5CF6',
  '#06B6D4', '#84CC16', '#D97706', '#6366F1', '#F43F5E',
];

const PRESET_EMOJIS = [
  '🏛','⚔','📖','🛡','◆','💼','🚀','💡','🎯','📊',
  '🧠','💪','🌙','⚡','🔥','✨','🎓','🏆','💰','🛠',
  '📝','🎮','🌱','🏋','🎨','🔬','🎸','🌐','📱','🏠',
];

// ── Step 0: Welcome ────────────────────────────────────────────────────────────
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
        tus áreas, empresas y virtudes para comenzar desde cero.
      </p>
      <button onClick={onNext} className="btn-primary px-8">
        Configurar desde cero →
      </button>
    </div>
  );
}

// ── Step 1: Areas ──────────────────────────────────────────────────────────────
function AreaCard({ area, onUpdate }) {
  const [showEmojis, setShowEmojis] = useState(false);

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  return (
    <div className="p-4 rounded-xl" style={{
      ...panelStyle,
      borderLeftWidth: 3,
      borderLeftColor: area.color,
      background: `linear-gradient(135deg, ${hexToRgba(area.color, 0.06)} 0%, #110e1c 100%)`,
    }}>
      {/* Row 1: emoji + name + min */}
      <div className="flex gap-2 items-center mb-3">
        <button
          onClick={() => setShowEmojis(v => !v)}
          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl transition-all"
          title="Cambiar emoji"
          style={{
            background: hexToRgba(area.color, 0.12),
            border: `1px solid ${hexToRgba(area.color, 0.3)}`,
          }}
        >
          {area.emoji}
        </button>
        <input
          value={area.label}
          onChange={e => onUpdate('label', e.target.value)}
          placeholder="Nombre del área..."
          style={{ ...inputStyle, flex: 1 }}
          onFocus={e => { e.target.style.borderColor = area.color; }}
          onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
        />
        <div className="flex-shrink-0 text-center" style={{ minWidth: 52 }}>
          <input
            type="number"
            min="0"
            max="1440"
            value={area.min_minutes}
            onChange={e => onUpdate('min_minutes', parseInt(e.target.value) || 0)}
            style={{ ...inputStyle, width: 52, padding: '10px 8px', textAlign: 'center' }}
            onFocus={e => { e.target.style.borderColor = area.color; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
          <p className="font-cinzel text-[7px] tracking-widest mt-0.5" style={{ color: '#4d4568' }}>MIN/DÍA</p>
        </div>
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="mb-3 p-2 rounded-lg" style={{ background: '#09080e', border: '1px solid #2c2740' }}>
          <div className="flex flex-wrap gap-1">
            {PRESET_EMOJIS.map(em => (
              <button
                key={em}
                onClick={() => { onUpdate('emoji', em); setShowEmojis(false); }}
                className="w-8 h-8 rounded text-lg flex items-center justify-center transition-all"
                style={{
                  background: area.emoji === em ? hexToRgba(area.color, 0.2) : 'transparent',
                  border: area.emoji === em ? `1px solid ${hexToRgba(area.color, 0.5)}` : '1px solid transparent',
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onUpdate('color', c)}
            className="rounded-full transition-all"
            style={{
              width: 18, height: 18,
              background: c,
              outline: area.color === c ? `2px solid ${c}` : 'none',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StepAreas({ onNext, onBack }) {
  const [areas, setAreas] = useState(DEFAULT_AREAS.map(a => ({ ...a })));
  const [saving, setSaving] = useState(false);

  function updateArea(id, field, val) {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
  }

  async function handleNext() {
    setSaving(true);
    try {
      await api.put('/api/areas', { areas });
    } catch {
      // non-critical, proceed
    } finally {
      setSaving(false);
      onNext(areas);
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
          Paso 1 de 3
        </p>
        <h2 className="font-cinzel text-2xl font-bold" style={{ color: '#f0e6d0' }}>Tus Áreas</h2>
        <p className="text-sm mt-2" style={{ color: '#9490aa' }}>
          Personaliza nombre, color, emoji y minutos mínimos diarios de cada área
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {areas.map(area => (
          <AreaCard
            key={area.id}
            area={area}
            onUpdate={(field, val) => updateArea(area.id, field, val)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 rounded-lg font-cinzel text-[11px] tracking-[0.1em] uppercase transition-colors"
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

// ── Step 2: Projects ───────────────────────────────────────────────────────────
function StepProjects({ onNext, onBack, areas }) {
  const [projects, setProjects] = useState([{ name: '', area_id: areas[0]?.id || 'NEGOCIO' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addProject() {
    setProjects(p => [...p, { name: '', area_id: areas[0]?.id || 'NEGOCIO' }]);
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

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
          Paso 2 de 3
        </p>
        <h2 className="font-cinzel text-2xl font-bold" style={{ color: '#f0e6d0' }}>Tus Empresas</h2>
        <p className="text-sm mt-2" style={{ color: '#9490aa' }}>Los proyectos en los que trabajarás estos 30 días</p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {projects.map((proj, i) => {
          const area = areas.find(a => a.id === proj.area_id);
          return (
            <div key={i} className="p-4 rounded-xl" style={{ ...panelStyle, borderLeftWidth: 3, borderLeftColor: area?.color || '#2c2740' }}>
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
                {areas.map(a => (
                  <button
                    key={a.id}
                    onClick={() => updateProject(i, 'area_id', a.id)}
                    className="font-cinzel text-[8px] tracking-[0.08em] uppercase px-2.5 py-1.5 rounded transition-all"
                    style={{
                      border: `1px solid ${proj.area_id === a.id ? a.color : '#2c2740'}`,
                      background: proj.area_id === a.id ? hexToRgba(a.color, 0.12) : 'transparent',
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
function StepHabits({ onNext, onBack, areas }) {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState('');
  const [area, setArea] = useState(areas.find(a => a.id === 'EJERCICIO')?.id || areas[0]?.id || 'EJERCICIO');
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
      onNext();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
          Paso 3 de 3
        </p>
        <h2 className="font-cinzel text-2xl font-bold" style={{ color: '#f0e6d0' }}>Tus Virtudes</h2>
        <p className="text-sm mt-2" style={{ color: '#9490aa' }}>Hábitos diarios a cultivar (opcional)</p>
      </div>

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
          {areas.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>)}
        </select>
        <button onClick={addHabit}
          className="px-4 rounded-lg font-cinzel text-[10px] tracking-widest uppercase"
          style={{ background: 'rgba(212,169,86,0.1)', border: '1px solid rgba(212,169,86,0.4)', color: '#d4a956' }}>
          +
        </button>
      </div>

      {habits.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {habits.map((h, i) => {
            const a = areas.find(ar => ar.id === h.area_id);
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
  const [customAreas, setCustomAreas] = useState(DEFAULT_AREAS.map(a => ({ ...a })));

  function handleAreasNext(savedAreas) {
    setCustomAreas(savedAreas);
    setStep(2);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: '#09080e' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,169,86,0.05) 0%, transparent 60%)' }} />

      <div className="relative w-full max-w-lg">
        {step > 0 && (
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i < step ? '#d4a956' : i === step ? '#9490aa' : '#2c2740' }} />
            ))}
          </div>
        )}

        <div className="rounded-2xl p-8" style={panelStyle}>
          {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
          {step === 1 && (
            <StepAreas
              onNext={handleAreasNext}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepProjects
              areas={customAreas}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepHabits
              areas={customAreas}
              onNext={onComplete}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
