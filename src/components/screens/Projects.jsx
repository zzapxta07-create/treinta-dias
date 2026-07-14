import { useEffect, useState } from 'react';
import { useAreas, useAreaMap } from '../../hooks/useAreas';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

function areaStyle(color) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return { bg: `rgba(${r},${g},${b},0.12)`, border: color, text: color };
}

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

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

const EMPTY_FORM = { name: '', area_id: 'NEGOCIO', type: 'percent', deadline: '' };

export default function Projects() {
  const areas   = useAreas();
  const areaMap = useAreaMap();
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filterArea, setFilterArea] = useState('ALL');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
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
    setError('');
    try {
      await api.post('/api/projects', form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la empresa');
    } finally {
      setSaving(false);
    }
  }

  async function handleProgressChange(id, val) {
    setProgress((prev) => ({ ...prev, [id]: val }));
  }

  async function handleProgressSave(id) {
    await api.put(`/api/projects/${id}/progress`, { progress: progress[id] }).catch(() => {});
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
          <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">
            Registro de Empresas
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">Empresas</h1>
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

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        <DiamondOrnament color="#4d4568" size={7} />
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      </div>

      {/* New project form */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-4 mb-5 flex flex-col gap-3" style={panelStyle}>
          <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.25em] uppercase mb-1">Nueva Empresa</p>
          <input
            required
            placeholder="Nombre de la empresa"
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
              {areas.filter(a => a.id !== 'OTROS').map(a => (
                <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="percent">% progreso</option>
              <option value="binary">Sí/No</option>
            </select>
          </div>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            style={{ ...inputStyle, width: '100%' }}
          />
          {error && (
            <p className="text-sm px-3 py-2 rounded"
              style={{ color: '#c43040', background: 'rgba(155,31,48,0.08)', border: '1px solid rgba(155,31,48,0.25)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary disabled:opacity-50"
            >
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

      {/* Area filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ id: 'ALL', label: 'Todas', emoji: '' }, ...areas].map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => setFilterArea(id)}
            className="font-cinzel text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded transition-colors"
            style={filterArea === id
              ? { background: 'rgba(212,169,86,0.12)', color: '#d4a956', border: '1px solid rgba(212,169,86,0.3)' }
              : { background: 'rgba(255,255,255,0.03)', color: '#4d4568', border: '1px solid #2c2740' }
            }
          >
            {emoji ? emoji + ' ' : ''}{label.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="font-cinzel text-[#4d4568] text-xs text-center py-12 tracking-widest uppercase">
          Consultando el registro...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-cinzel text-[#4d4568] text-xs tracking-[0.2em] uppercase">
            Ninguna empresa registrada
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((p) => {
            const days = daysUntil(p.deadline);
            const overdue = days !== null && days < 0;
            const colors = areaStyle(areaMap[p.area_id]?.color || '#6B7280');
            const prog = progress[p.id] ?? p.progress ?? 0;

            return (
              <div
                key={p.id}
                className="p-4 flex flex-col gap-3"
                style={{
                  ...panelStyle,
                  border: overdue ? '1px solid rgba(155,31,48,0.35)' : '1px solid #2c2740',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f0e6d0] font-bold text-sm leading-tight truncate">{p.name}</p>
                    {p.deadline && (
                      <p className="font-cinzel text-[8px] mt-0.5 tracking-widest uppercase"
                        style={{ color: overdue ? '#9b1f30' : '#4d4568' }}>
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
                      {areaMap[p.area_id]?.emoji} {areaMap[p.area_id]?.label.split(' ')[0] || p.area_id}
                    </span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-[#2c2740] hover:text-[#9b1f30] text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {p.type === 'percent' ? (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-widest">Progreso</span>
                      <span className="font-mono text-[#d4a956] font-bold">{prog}%</span>
                    </div>
                    <input
                      type="range" min={0} max={100} value={prog}
                      onChange={(e) => handleProgressChange(p.id, Number(e.target.value))}
                      onMouseUp={() => handleProgressSave(p.id)}
                      onTouchEnd={() => handleProgressSave(p.id)}
                      className="w-full"
                    />
                    <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: '#1e1b2e' }}>
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
                      await api.put(`/api/projects/${p.id}/progress`, { progress: newVal }).catch(() => {});
                    }}
                    className="w-full font-cinzel text-[9px] tracking-[0.1em] uppercase py-2 rounded transition-colors"
                    style={prog === 100
                      ? { background: '#d4a956', color: '#09080e' }
                      : { background: 'rgba(255,255,255,0.03)', color: '#9490aa', border: '1px solid #2c2740' }
                    }
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
