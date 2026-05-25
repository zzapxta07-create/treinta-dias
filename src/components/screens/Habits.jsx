import { useEffect, useState } from 'react';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';

const AREA_COLORS = {
  NEGOCIO:   '#60a5fa',
  SEGUNDA:   '#a78bfa',
  ESTUDIO:   '#fbbf24',
  EJERCICIO: '#34d399',
  OTROS:     '#6b7280',
};

const AREA_OPTIONS = Object.entries(AREAS);
const FREQ_OPTIONS = ['daily', 'weekly'];
const FREQ_LABELS  = { daily: 'Diario', weekly: 'Semanal' };

const EMPTY_FORM = { name: '', area_id: 'NEGOCIO', frequency: 'daily' };

function MiniHeatmap({ logs }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    // backend returns date_key as Date object; compare via string slice
    return { key, done: logs?.some((l) => {
      const dk = typeof l.date_key === 'string' ? l.date_key : l.date_key?.toISOString?.()?.slice(0,10);
      return dk === key && l.completed !== false;
    }) };
  });

  return (
    <div className="flex gap-1">
      {days.map(({ key, done }) => (
        <div
          key={key}
          title={key}
          className={`w-4 h-4 rounded-sm ${done ? 'bg-green-500' : 'bg-[#222]'}`}
        />
      ))}
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

  async function handleToggle(habit) {
    if (toggling[habit.id]) return;
    setToggling((t) => ({ ...t, [habit.id]: true }));

    const todayKey = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    const doneTodayLog = habit.recent_logs?.find((l) => {
      const dk = typeof l.date_key === 'string' ? l.date_key : l.date_key?.toISOString?.()?.slice(0,10);
      return dk === todayKey && l.completed !== false;
    });

    try {
      await api.post(`/api/habits/${habit.id}/log`, {
        date_key: todayKey,
        completed: !doneTodayLog,
      });
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

  // Group by area
  const grouped = AREA_OPTIONS.reduce((acc, [id]) => {
    const items = habits.filter((h) => h.area_id === id);
    if (items.length > 0) acc[id] = items;
    return acc;
  }, {});

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Hábitos</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-white text-black text-xs font-black px-4 py-2 rounded-xl active:scale-95 transition-transform"
        >
          + Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C] flex flex-col gap-3">
          <input
            required
            placeholder="Nombre del hábito"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2C2C2C] focus:border-[#444]"
          />
          <div className="flex gap-2">
            <select
              value={form.area_id}
              onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
              className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2C2C2C]"
            >
              {AREA_OPTIONS.map(([id, a]) => (
                <option key={id} value={id}>{a.label}</option>
              ))}
            </select>
            <select
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2C2C2C]"
            >
              {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-white text-black font-black py-2.5 rounded-xl text-sm active:scale-95 disabled:opacity-50 transition-transform"
            >
              {saving ? 'Guardando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm text-[#6B7280] bg-[#1a1a1a]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-[#6B7280] text-sm text-center py-12">Cargando...</div>
      ) : habits.length === 0 ? (
        <div className="text-[#6B7280] text-sm text-center py-12">Sin hábitos. Crea el primero.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([areaId, items]) => {
            const color = AREA_COLORS[areaId] || AREA_COLORS.OTROS;
            return (
              <div key={areaId}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {AREAS[areaId]?.label || areaId}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((habit) => {
                    const doneToday = habit.recent_logs?.some((l) => {
                      const dk = typeof l.date_key === 'string' ? l.date_key : l.date_key?.toISOString?.()?.slice(0,10);
                      return dk === todayKey && l.completed !== false;
                    });
                    return (
                      <div
                        key={habit.id}
                        className="bg-[#101010] rounded-xl p-3 border border-[#2C2C2C] flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggle(habit)}
                            disabled={!!toggling[habit.id]}
                            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                              doneToday
                                ? 'border-green-500 bg-green-500'
                                : 'border-[#444] bg-transparent hover:border-[#666]'
                            } disabled:opacity-50`}
                          >
                            {doneToday && <span className="text-black text-sm font-black">✓</span>}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-tight ${doneToday ? 'text-[#6B7280] line-through' : 'text-white'}`}>
                              {habit.name}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-[#374151]">{FREQ_LABELS[habit.frequency] || habit.frequency}</span>
                              {habit.streak > 0 && (
                                <span className="text-xs font-bold" style={{ color }}>
                                  🔥 {habit.streak}d
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="text-[#374151] hover:text-red-500 text-xs transition-colors shrink-0 p-1"
                          >
                            ✕
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
