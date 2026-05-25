import { useEffect, useState } from 'react';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';

const AREA_OPTIONS = Object.entries(AREAS).filter(([id]) => id !== 'OTROS');

const AREA_COLORS = {
  NEGOCIO:   { bg: 'rgba(96,165,250,0.12)', border: '#60a5fa', text: '#60a5fa' },
  SEGUNDA:   { bg: 'rgba(167,139,250,0.12)', border: '#a78bfa', text: '#a78bfa' },
  ESTUDIO:   { bg: 'rgba(251,191,36,0.12)',  border: '#fbbf24', text: '#fbbf24' },
  EJERCICIO: { bg: 'rgba(52,211,153,0.12)',  border: '#34d399', text: '#34d399' },
  OTROS:     { bg: 'rgba(107,114,128,0.12)', border: '#6b7280', text: '#6b7280' },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

const EMPTY_FORM = { name: '', area_id: 'NEGOCIO', type: 'percent', deadline: '' };

export default function Projects() {
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filterArea, setFilterArea] = useState('ALL');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [progress,   setProgress]   = useState({});

  function load() {
    setLoading(true);
    api.get('/api/projects')
       .then((r) => {
         const projs = r.data.data || [];
         setProjects(projs);
         setProgress(Object.fromEntries(projs.map((p) => [p.id, p.progress || 0])));
       })
       .catch(() => {})
       .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/projects', form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleProgressChange(id, val) {
    setProgress((prev) => ({ ...prev, [id]: val }));
  }

  async function handleProgressSave(id) {
    await api.put(`/api/projects/${id}`, { progress: progress[id] }).catch(() => {});
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar proyecto?')) return;
    await api.delete(`/api/projects/${id}`).catch(() => {});
    load();
  }

  const filtered = filterArea === 'ALL'
    ? projects
    : projects.filter((p) => p.area_id === filterArea);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Proyectos</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-white text-black text-xs font-black px-4 py-2 rounded-xl active:scale-95 transition-transform"
        >
          + Nuevo
        </button>
      </div>

      {/* New project form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C] flex flex-col gap-3">
          <input
            required
            placeholder="Nombre del proyecto"
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
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2C2C2C]"
            >
              <option value="percent">% progreso</option>
              <option value="binary">Sí/No</option>
            </select>
          </div>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            className="bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2C2C2C]"
          />
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

      {/* Area filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['ALL', 'Todos'], ...AREA_OPTIONS.map(([id, a]) => [id, a.label.split(' ')[0]])].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilterArea(id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              filterArea === id ? 'bg-white text-black' : 'bg-[#181818] text-[#6B7280]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#6B7280] text-sm text-center py-12">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-[#6B7280] text-sm text-center py-12">Sin proyectos.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((p) => {
            const days = daysUntil(p.deadline);
            const overdue = days !== null && days < 0;
            const colors = AREA_COLORS[p.area_id] || AREA_COLORS.OTROS;
            const prog = progress[p.id] ?? p.progress ?? 0;

            return (
              <div
                key={p.id}
                className={`bg-[#101010] rounded-2xl p-4 border flex flex-col gap-3 ${
                  overdue ? 'border-red-700' : 'border-[#2C2C2C]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">{p.name}</p>
                    {p.deadline && (
                      <p className={`text-xs mt-0.5 ${overdue ? 'text-red-400' : 'text-[#6B7280]'}`}>
                        {overdue
                          ? `Vencido hace ${Math.abs(days)}d`
                          : days === 0 ? 'Vence hoy' : `${days}d restantes`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}20` }}
                    >
                      {AREAS[p.area_id]?.label.split(' ')[0] || p.area_id}
                    </span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-[#374151] hover:text-red-500 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {p.type === 'percent' ? (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6B7280]">Progreso</span>
                      <span className="text-white font-mono font-bold">{prog}%</span>
                    </div>
                    <input
                      type="range" min={0} max={100} value={prog}
                      onChange={(e) => handleProgressChange(p.id, Number(e.target.value))}
                      onMouseUp={() => handleProgressSave(p.id)}
                      onTouchEnd={() => handleProgressSave(p.id)}
                      className="w-full"
                    />
                    <div className="h-1.5 bg-[#222] rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${prog}%`, backgroundColor: colors.text }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const newVal = prog === 100 ? 0 : 100;
                      setProgress((prev) => ({ ...prev, [p.id]: newVal }));
                      await api.put(`/api/projects/${p.id}`, { progress: newVal }).catch(() => {});
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                      prog === 100 ? 'bg-green-600 text-white' : 'bg-[#222] text-[#6B7280]'
                    }`}
                  >
                    {prog === 100 ? '✓ Completado' : 'Marcar completo'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
