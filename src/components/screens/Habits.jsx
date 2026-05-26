import { useEffect, useState } from 'react';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';

const AREA_COLORS = {
  NEGOCIO:   '#3B82F6',
  SEGUNDA:   '#A855F7',
  ESTUDIO:   '#F59E0B',
  EJERCICIO: '#10B981',
  OTROS:     '#9a8470',
};

const AREA_OPTIONS = Object.entries(AREAS);
const FREQ_OPTIONS = ['daily', 'weekly'];
const FREQ_LABELS  = { daily: 'Diario', weekly: 'Semanal' };
const EMPTY_FORM   = { name: '', area_id: 'NEGOCIO', frequency: 'daily' };

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
          ? 'bg-[#2a2520]'
          : log.completed === false
            ? 'bg-[#8b1a2a]'
            : 'bg-[#c9a254]';
        return <div key={key} title={key} className={`w-4 h-4 rounded-sm ${bg}`} />;
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
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-1">
            Registro Permanente
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">Virtudes</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="font-cinzel text-[10px] tracking-[0.15em] uppercase bg-transparent text-[#c9a254] border border-[#c9a254]/40 px-4 py-2 rounded active:scale-95 transition-all hover:bg-[#c9a254]/10"
        >
          + Nueva
        </button>
      </div>

      {/* Ornament */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#3a2e22]" />
        <span className="text-[#5a4838] text-xs">◆</span>
        <div className="flex-1 h-px bg-[#3a2e22]" />
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#110d0a] rounded-lg p-4 mb-6 border border-[#3a2e22] flex flex-col gap-3">
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.25em] uppercase mb-1">Nueva Virtud</p>
          <input
            required
            placeholder="Nombre del hábito"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22] focus:border-[#c9a254] placeholder-[#3a2e22] transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={form.area_id}
              onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
              className="flex-1 bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22]"
            >
              {AREA_OPTIONS.map(([id, a]) => (
                <option key={id} value={id}>{a.label}</option>
              ))}
            </select>
            <select
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              className="flex-1 bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22]"
            >
              {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 font-cinzel text-[10px] tracking-[0.15em] uppercase bg-[#f0e6d0] text-[#0a0806] font-bold py-2.5 rounded active:scale-95 disabled:opacity-50 transition-transform"
            >
              {saving ? 'Guardando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded text-sm text-[#9a8470] bg-[#110d0a] border border-[#3a2e22]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="font-cinzel text-[#5a4838] text-sm text-center py-12 tracking-widest">
          Consultando el códex...
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-cinzel text-[#5a4838] text-xs tracking-[0.2em] uppercase">
            Ninguna virtud registrada
          </p>
          <p className="text-[#3a2e22] text-sm mt-2">Crea la primera disciplina.</p>
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

                    return (
                      <div
                        key={habit.id}
                        className={`bg-[#110d0a] rounded-lg p-3 border transition-colors ${
                          state === 'done'    ? 'border-[#c9a254]/30' :
                          state === 'no_hice' ? 'border-[#8b1a2a]/30' :
                                               'border-[#3a2e22]'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`text-sm leading-tight ${
                              state === 'done'    ? 'text-[#9a8470] line-through' :
                              state === 'no_hice' ? 'text-[#5a4838] line-through'  :
                                                   'text-[#f0e6d0]'
                            }`}>
                              {habit.name}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="font-cinzel text-[8px] text-[#5a4838] tracking-widest uppercase">
                                {FREQ_LABELS[habit.frequency] || habit.frequency}
                              </span>
                              {habit.streak > 0 && (
                                <span className="font-cinzel text-[9px] font-bold text-[#c9a254]">
                                  ✦ {habit.streak}d
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="text-[#3a2e22] hover:text-[#8b1a2a] text-xs transition-colors shrink-0 p-1"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => handleSetState(habit, true)}
                            disabled={!!toggling[habit.id]}
                            className={`flex-1 py-2 rounded text-[10px] font-cinzel tracking-[0.1em] uppercase transition-colors disabled:opacity-50 ${
                              state === 'done'
                                ? 'bg-[#c9a254] text-[#0a0806]'
                                : 'bg-[#1a1410] text-[#9a8470] border border-[#3a2e22] hover:border-[#c9a254] hover:text-[#c9a254]'
                            }`}
                          >
                            ✓ Realizado
                          </button>
                          <button
                            onClick={() => handleSetState(habit, false)}
                            disabled={!!toggling[habit.id]}
                            className={`flex-1 py-2 rounded text-[10px] font-cinzel tracking-[0.1em] uppercase transition-colors disabled:opacity-50 ${
                              state === 'no_hice'
                                ? 'bg-[#8b1a2a] text-[#f0e6d0]'
                                : 'bg-[#1a1410] text-[#9a8470] border border-[#3a2e22] hover:border-[#8b1a2a] hover:text-[#8b1a2a]'
                            }`}
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
