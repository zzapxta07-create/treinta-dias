import { useEffect, useState } from 'react';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';

const AREA_OPTIONS = Object.entries(AREAS).filter(([id]) => id !== 'OTROS');

const AREA_COLORS = {
  NEGOCIO:   { bg: 'rgba(96,165,250,0.12)',   border: '#60a5fa', text: '#60a5fa' },
  SEGUNDA:   { bg: 'rgba(167,139,250,0.12)',  border: '#a78bfa', text: '#a78bfa' },
  ESTUDIO:   { bg: 'rgba(251,191,36,0.12)',   border: '#fbbf24', text: '#fbbf24' },
  EJERCICIO: { bg: 'rgba(52,211,153,0.12)',   border: '#34d399', text: '#34d399' },
  OTROS:     { bg: 'rgba(154,132,112,0.12)',  border: '#9a8470', text: '#9a8470' },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
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
    if (!confirm('¿Eliminar empresa?')) return;
    await api.delete(`/api/projects/${id}`).catch(() => {});
    load();
  }

  const filtered = filterArea === 'ALL'
    ? projects
    : projects.filter((p) => p.area_id === filterArea);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-1">
            Registro de Empresas
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">Empresas</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="font-cinzel text-[10px] tracking-[0.15em] uppercase bg-transparent text-[#c9a254] border border-[#c9a254]/40 px-4 py-2 rounded active:scale-95 transition-all hover:bg-[#c9a254]/10"
        >
          + Nueva
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#3a2e22]" />
        <span className="text-[#5a4838] text-xs">◆</span>
        <div className="flex-1 h-px bg-[#3a2e22]" />
      </div>

      {/* New project form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#110d0a] rounded-lg p-4 mb-5 border border-[#3a2e22] flex flex-col gap-3">
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.25em] uppercase mb-1">Nueva Empresa</p>
          <input
            required
            placeholder="Nombre de la empresa"
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
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="flex-1 bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22]"
            >
              <option value="percent">% progreso</option>
              <option value="binary">Sí/No</option>
            </select>
          </div>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            className="bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22]"
          />
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

      {/* Area filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['ALL', 'Todas'], ...AREA_OPTIONS.map(([id, a]) => [id, a.label.split(' ')[0]])].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilterArea(id)}
            className={`font-cinzel text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded transition-colors ${
              filterArea === id
                ? 'bg-[#c9a254]/15 text-[#c9a254] border border-[#c9a254]/30'
                : 'bg-[#110d0a] text-[#5a4838] border border-[#3a2e22] hover:text-[#9a8470]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="font-cinzel text-[#5a4838] text-xs text-center py-12 tracking-widest uppercase">
          Consultando el registro...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-cinzel text-[#5a4838] text-xs tracking-[0.2em] uppercase">
            Ninguna empresa registrada
          </p>
        </div>
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
                className={`bg-[#110d0a] rounded-lg p-4 border flex flex-col gap-3 ${
                  overdue ? 'border-[#8b1a2a]/40' : 'border-[#3a2e22]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f0e6d0] font-bold text-sm leading-tight truncate">{p.name}</p>
                    {p.deadline && (
                      <p className={`font-cinzel text-[8px] mt-0.5 tracking-widest uppercase ${overdue ? 'text-[#8b1a2a]' : 'text-[#5a4838]'}`}>
                        {overdue
                          ? `Vencido hace ${Math.abs(days)}d`
                          : days === 0 ? 'Vence hoy' : `${days}d restantes`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="font-cinzel text-[8px] tracking-[0.08em] uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}30` }}
                    >
                      {AREAS[p.area_id]?.label.split(' ')[0] || p.area_id}
                    </span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-[#3a2e22] hover:text-[#8b1a2a] text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {p.type === 'percent' ? (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-widest">Progreso</span>
                      <span className="font-mono text-[#c9a254] font-bold">{prog}%</span>
                    </div>
                    <input
                      type="range" min={0} max={100} value={prog}
                      onChange={(e) => handleProgressChange(p.id, Number(e.target.value))}
                      onMouseUp={() => handleProgressSave(p.id)}
                      onTouchEnd={() => handleProgressSave(p.id)}
                      className="w-full"
                    />
                    <div className="h-1 bg-[#1a1410] rounded-full mt-1 overflow-hidden">
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
                    className={`w-full font-cinzel text-[9px] tracking-[0.1em] uppercase py-2 rounded transition-colors ${
                      prog === 100
                        ? 'bg-[#c9a254] text-[#0a0806]'
                        : 'bg-[#1a1410] text-[#9a8470] border border-[#3a2e22]'
                    }`}
                  >
                    {prog === 100 ? '✓ Completada' : 'Marcar completa'}
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
