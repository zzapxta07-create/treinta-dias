import { useEffect, useState } from 'react';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const AREA_COLORS = {
  NEGOCIO:   '#3B82F6',
  SEGUNDA:   '#A855F7',
  ESTUDIO:   '#F59E0B',
  EJERCICIO: '#10B981',
  OTROS:     '#9490aa',
};

const AREA_OPTIONS = Object.entries(AREAS);
const FREQ_OPTIONS = ['daily', 'weekly'];
const FREQ_LABELS  = { daily: 'Diario', weekly: 'Semanal' };
const EMPTY_FORM   = { name: '', area_id: 'NEGOCIO', frequency: 'daily' };

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const inputStyle = {
  background: '#09080e',
  color: '#f0e6d0',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '10px 12px',
  border: '1px solid #2c2740',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: "'Crimson Text', serif",
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getLogDateKey(l) {
  return typeof l.date_key === 'string' ? l.date_key : l.date_key?.toISOString?.()?.slice(0,10);
}

function MiniHeatmap({ logs }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const log = logs?.find((l) => getLogDateKey(l) === key);
    return { key, log };
  });

  return (
    <div className="flex gap-1">
      {days.map(({ key, log }) => {
        const bg = !log
          ? '#1e1b2e'
          : log.completed === false
          ? '#9b1f30'
          : '#d4a956';
        return <div key={key} title={key} className="w-4 h-4 rounded-sm" style={{ background: bg }} />;
      })}
    </div>
  );
}

export default function Habits() {
  const [habits,   setHabits]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState({});

  const TODAY = todayStr();

  function load() {
    setLoading(true);
    api.get('/api/habits')
       .then((r) => setHabits(r.data.data || []))
       .catch(() => {})
       .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/habits', form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSetState(habit, completed) {
    if (toggling[habit.id]) return;
    setToggling((t) => ({ ...t, [habit.id]: true }));
    try {
      await api.post(`/api/habits/${habit.id}/log`, { date_key: TODAY, completed });
      load();
    } catch {
      // ignore
    } finally {
      setToggling((t) => ({ ...t, [habit.id]: false }));
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar hábito?')) return;
    await api.delete(`/api/habits/${id}`).catch(() => {});
    load();
  }

  const grouped = AREA_OPTIONS.reduce((acc, [id]) => {
    const items = habits.filter((h) => h.area_id === id);
    if (items.length > 0) acc[id] = items;
    return acc;
  }, {});

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">
            Registro Permanente
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">Virtudes</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="font-cinzel text-[10px] tracking-[0.15em] uppercase px-4 py-2 rounded transition-all active:scale-95"
          style={{ color: '#d4a956', border: '1px solid rgba(212,169,86,0.4)', background: 'transparent' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(212,169,86,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          + Nueva
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        <DiamondOrnament color="#4d4568" size={7} />
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-4 mb-6 flex flex-col gap-3" style={panelStyle}>
          <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.25em] uppercase mb-1">Nueva Virtud</p>
          <input
            required
            placeholder="Nombre del hábito"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{ ...inputStyle, width: '100%' }}
            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
          <div className="flex gap-2">
            <select
              value={form.area_id}
              onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
              style={{ ...inputStyle, flex: 1 }}
            >
              {AREA_OPTIONS.map(([id, a]) => (
                <option key={id} value={id}>{a.label}</option>
              ))}
            </select>
            <select
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              style={{ ...inputStyle, flex: 1 }}
            >
              {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded text-sm text-[#9490aa] transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2c2740' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="font-cinzel text-[#4d4568] text-sm text-center py-12 tracking-widest">
          Consultando el códex...
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-cinzel text-[#4d4568] text-xs tracking-[0.2em] uppercase">
            Ninguna virtud registrada
          </p>
          <p className="text-[#2c2740] text-sm mt-2">Crea la primera disciplina.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([areaId, items]) => {
            const color = AREA_COLORS[areaId] || AREA_COLORS.OTROS;
            return (
              <div key={areaId}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <p className="font-cinzel text-[9px] uppercase tracking-[0.25em]" style={{ color }}>
                    {AREAS[areaId]?.label || areaId}
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: color + '30' }} />
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((habit) => {
                    const todayLog = habit.recent_logs?.find((l) => getLogDateKey(l) === TODAY);
                    const state = !todayLog ? 'pending'
                      : todayLog.completed === false ? 'no_hice' : 'done';

                    const borderColor = state === 'done'
                      ? 'rgba(212,169,86,0.3)'
                      : state === 'no_hice'
                      ? 'rgba(155,31,48,0.3)'
                      : '#2c2740';

                    return (
                      <div
                        key={habit.id}
                        className="rounded-xl p-3 transition-colors"
                        style={{
                          background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm leading-tight" style={{
                              color: state === 'done' ? '#9490aa' : state === 'no_hice' ? '#4d4568' : '#f0e6d0',
                              textDecoration: state !== 'pending' ? 'line-through' : 'none',
                            }}>
                              {habit.name}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="font-cinzel text-[8px] text-[#4d4568] tracking-widest uppercase">
                                {FREQ_LABELS[habit.frequency] || habit.frequency}
                              </span>
                              {habit.streak > 0 && (
                                <span className="font-cinzel text-[9px] font-bold text-[#d4a956]">
                                  ✦ {habit.streak}d
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="text-[#2c2740] hover:text-[#9b1f30] text-xs transition-colors shrink-0 p-1"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => handleSetState(habit, true)}
                            disabled={!!toggling[habit.id]}
                            className="flex-1 py-2 rounded text-[10px] font-cinzel tracking-[0.1em] uppercase transition-colors disabled:opacity-50"
                            style={state === 'done'
                              ? { background: '#d4a956', color: '#09080e' }
                              : { background: 'rgba(255,255,255,0.03)', color: '#9490aa', border: '1px solid #2c2740' }
                            }
                          >
                            ✓ Realizado
                          </button>
                          <button
                            onClick={() => handleSetState(habit, false)}
                            disabled={!!toggling[habit.id]}
                            className="flex-1 py-2 rounded text-[10px] font-cinzel tracking-[0.1em] uppercase transition-colors disabled:opacity-50"
                            style={state === 'no_hice'
                              ? { background: '#9b1f30', color: '#f0e6d0' }
                              : { background: 'rgba(255,255,255,0.03)', color: '#9490aa', border: '1px solid #2c2740' }
                            }
                          >
                            ✗ No lo hice
                          </button>
                        </div>

                        <MiniHeatmap logs={habit.recent_logs || []} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
