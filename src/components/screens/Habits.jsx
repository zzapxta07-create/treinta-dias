import { useEffect, useState } from 'react';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';

const AREA_COLORS = {
  NEGOCIO:   '#3B82F6',
  SEGUNDA:   '#A855F7',
  ESTUDIO:   '#F59E0B',
  EJERCICIO: '#10B981',
  OTROS:     '#6b7280',
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
            ? 'bg-[#8c3040]'
            : 'bg-[#c9a84c]';
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-[#f5f0e8]">Hábitos</h1>
          <p className="text-[#8b7d6b] text-xs mt-0.5">Registro diario de conductas</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#c9a84c] text-[#0c0a09] text-xs font-black px-4 py-2 rounded-xl active:scale-95 transition-transform"
        >
          + Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#12100e] rounded-2xl p-4 mb-4 border border-[#2a2520] flex flex-col gap-3">
          <input
            required
            placeholder="Nombre del hábito"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-[#1c1915] text-[#f5f0e8] text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2a2520] focus:border-[#c9a84c] placeholder-[#4a3f35]"
          />
          <div className="flex gap-2">
            <select
              value={form.area_id}
              onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
              className="flex-1 bg-[#1c1915] text-[#f5f0e8] text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2a2520]"
            >
              {AREA_OPTIONS.map(([id, a]) => (
                <option key={id} value={id}>{a.label}</option>
              ))}
            </select>
            <select
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              className="flex-1 bg-[#1c1915] text-[#f5f0e8] text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2a2520]"
            >
              {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#c9a84c] text-[#0c0a09] font-black py-2.5 rounded-xl text-sm active:scale-95 disabled:opacity-50 transition-transform"
            >
              {saving ? 'Guardando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm text-[#8b7d6b] bg-[#1c1915] border border-[#2a2520]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-[#8b7d6b] text-sm text-center py-12">Cargando...</div>
      ) : habits.length === 0 ? (
        <div className="text-[#8b7d6b] text-sm text-center py-12">Sin hábitos. Crea el primero.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([areaId, items]) => {
            const color = AREA_COLORS[areaId] || AREA_COLORS.OTROS;
            return (
              <div key={areaId}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {AREAS[areaId]?.label || areaId}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((habit) => {
                    const todayLog = habit.recent_logs?.find((l) => getLogDateKey(l) === TODAY);
                    const state = !todayLog ? 'pending'
                      : todayLog.completed === false ? 'no_hice' : 'done';

                    return (
                      <div
                        key={habit.id}
                        className={`bg-[#12100e] rounded-xl p-3 border transition-colors ${
                          state === 'done'    ? 'border-[#c9a84c]/30' :
                          state === 'no_hice' ? 'border-[#8c3040]/30' :
                                               'border-[#2a2520]'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`text-sm font-medium leading-tight ${
                              state === 'done'    ? 'text-[#8b7d6b] line-through' :
                              state === 'no_hice' ? 'text-[#4a3f35] line-through'  :
                                                   'text-[#f5f0e8]'
                            }`}>
                              {habit.name}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-[#4a3f35]">{FREQ_LABELS[habit.frequency] || habit.frequency}</span>
                              {habit.streak > 0 && (
                                <span className="text-xs font-bold text-[#c9a84c]">✦ {habit.streak}d</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="text-[#2a2520] hover:text-[#8c3040] text-xs transition-colors shrink-0 p-1"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => handleSetState(habit, true)}
                            disabled={!!toggling[habit.id]}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                              state === 'done'
                                ? 'bg-[#c9a84c] text-[#0c0a09]'
                                : 'bg-[#1c1915] text-[#8b7d6b] border border-[#2a2520] hover:border-[#c9a84c] hover:text-[#c9a84c]'
                            }`}
                          >
                            ✓ Realizado
                          </button>
                          <button
                            onClick={() => handleSetState(habit, false)}
                            disabled={!!toggling[habit.id]}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                              state === 'no_hice'
                                ? 'bg-[#8c3040] text-[#f5f0e8]'
                                : 'bg-[#1c1915] text-[#8b7d6b] border border-[#2a2520] hover:border-[#8c3040] hover:text-[#8c3040]'
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
