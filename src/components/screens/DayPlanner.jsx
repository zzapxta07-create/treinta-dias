import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AREAS, MANDATORY_AREAS } from '../../data/areas';
import { timeToMinutes, minutesToTime, minutesToLabel } from '../../utils/dateUtils';
import AreaBadge from '../ui/AreaBadge';
import api from '../../api/index.js';

const AREA_MINS = { NEGOCIO: 300, SEGUNDA: 60, ESTUDIO: 180, EJERCICIO: 30 };

export default function DayPlanner() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const config        = useStore((s) => s.config);

  const [projects, setProjects] = useState([]);
  const [blocks,   setBlocks]   = useState(currentDay?.blocks || []);
  const [form,     setForm]     = useState({ start: '07:00', end: '08:00', area: 'NEGOCIO', projectId: '' });
  const [error,    setError]    = useState('');
  const [warnings, setWarnings] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [confirming, setConfirming] = useState(false);

  const areaMins = blocks.reduce((acc, b) => {
    const area = b.area_id || b.area;
    if (area && area !== 'OTROS' && acc[area] !== undefined) {
      acc[area] += (b.end_minutes ?? b.endMinutes) - (b.start_minutes ?? b.startMinutes);
    }
    return acc;
  }, { NEGOCIO: 0, SEGUNDA: 0, ESTUDIO: 0, EJERCICIO: 0 });
  const isSpecial = currentDay?.is_special_day;
  const canActivateSpecial = config && !isSpecial &&
    (config.special_days_total - config.special_days_used_count) > 0;

  useEffect(() => {
    api.get('/api/projects').then((r) => setProjects(r.data.data)).catch(() => {});
  }, []);

  // Keep local blocks synced with store
  useEffect(() => {
    setBlocks(currentDay?.blocks || []);
  }, [currentDay?.id]);

  async function addBlock() {
    setError('');
    const startM = timeToMinutes(form.start);
    const endM   = timeToMinutes(form.end);
    if (endM <= startM) { setError('El fin debe ser después del inicio.'); return; }
    const overlap = blocks.find((b) => {
      const s = b.start_minutes ?? b.startMinutes;
      const e = b.end_minutes   ?? b.endMinutes;
      return !(endM <= s || startM >= e);
    });
    if (overlap) {
      setError(`Solapamiento con ${minutesToTime(overlap.start_minutes ?? overlap.startMinutes)}–${minutesToTime(overlap.end_minutes ?? overlap.endMinutes)}.`);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        day_id:       currentDay.id,
        area_id:      form.area,
        project_id:   form.projectId ? parseInt(form.projectId) : null,
        start_time:   form.start,
        end_time:     form.end,
        start_minutes: startM,
        end_minutes:   endM,
        sort_order:    blocks.length,
      };
      const { data } = await api.post('/api/blocks', payload);
      const newBlock = data.data;
      const updated  = [...blocks, newBlock].sort((a, b) =>
        (a.start_minutes ?? a.startMinutes) - (b.start_minutes ?? b.startMinutes)
      );
      setBlocks(updated);
      setCurrentDay({ ...currentDay, blocks: updated });
      setForm((f) => ({ ...f, start: form.end }));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar bloque');
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(blockId) {
    try {
      await api.delete(`/api/blocks/${blockId}`);
      const updated = blocks.filter((b) => b.id !== blockId);
      setBlocks(updated);
      setCurrentDay({ ...currentDay, blocks: updated });
    } catch {
      setError('Error al eliminar bloque');
    }
  }

  async function activateSpecialDay() {
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/special-day`);
      setCurrentDay(data.data);
      setWarnings([]);
    } catch {}
  }

  async function handleConfirm() {
    if (!isSpecial) {
      const warns = [];
      if (areaMins.NEGOCIO   < 300) warns.push(`Negocio: faltan ${minutesToLabel(300 - areaMins.NEGOCIO)}`);
      if (areaMins.SEGUNDA   <  60) warns.push(`Segunda: faltan ${minutesToLabel(60  - areaMins.SEGUNDA)}`);
      if (areaMins.ESTUDIO   < 180) warns.push(`Estudio: faltan ${minutesToLabel(180 - areaMins.ESTUDIO)}`);
      if (areaMins.EJERCICIO <  30) warns.push(`Ejercicio: faltan ${minutesToLabel(30 - areaMins.EJERCICIO)}`);
      if (warns.length > 0) { setWarnings(warns); return; }
    }
    setConfirming(true);
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/confirm-planning`);
      setCurrentDay(data.data);
    } catch {
      setError('Error al confirmar');
    } finally {
      setConfirming(false);
    }
  }

  const areaProjects = projects.filter((p) => p.area_id === form.area && !p.archived);

  // ── Timeline visual ──────────────────────────────────────────────────────
  const TIMELINE_START = 6 * 60;  // 06:00
  const TIMELINE_END   = 24 * 60; // 24:00
  const TIMELINE_RANGE = TIMELINE_END - TIMELINE_START;

  function toPercent(mins) {
    return Math.max(0, Math.min(100, ((mins - TIMELINE_START) / TIMELINE_RANGE) * 100));
  }
  function toWidth(start, end) {
    return Math.max(0.5, ((end - start) / TIMELINE_RANGE) * 100);
  }

  const AREA_HEX = {
    NEGOCIO: '#3B82F6', SEGUNDA: '#A855F7', ESTUDIO: '#F59E0B',
    EJERCICIO: '#10B981', OTROS: '#6B7280',
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto pb-28">
      <h1 className="text-xl font-black mb-1">Planificar Hoy</h1>
      <p className="text-[#6B7280] text-sm mb-5">
        {currentDay?.date_key?.toString().slice(0, 10)} — Creá los bloques del día.
      </p>

      {/* Minimums tracker */}
      <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
        <p className="text-[10px] text-[#6B7280] mb-3 uppercase tracking-widest">
          {isSpecial ? 'Día Especial — mínimos libres' : 'Mínimos obligatorios'}
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {MANDATORY_AREAS.map((id) => {
            const done = areaMins[id] || 0;
            const ok   = isSpecial || done >= AREA_MINS[id];
            return (
              <div key={id} className="flex justify-between items-center text-xs">
                <span className={ok ? 'text-green-400' : 'text-[#6B7280]'}>
                  {ok ? '✓' : '✗'} {AREAS[id].label.split(' ')[0]}
                </span>
                <span className={`font-mono ${ok ? 'text-green-400' : 'text-red-400'}`}>
                  {minutesToLabel(done)}/{minutesToLabel(AREA_MINS[id])}
                </span>
              </div>
            );
          })}
        </div>
        {canActivateSpecial && (
          <button onClick={activateSpecialDay} className="mt-3 text-xs text-yellow-400 underline">
            Activar Día Especial ({config.special_days_total - config.special_days_used_count} restantes)
          </button>
        )}
      </div>

      {/* Timeline */}
      {blocks.length > 0 && (
        <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
          <p className="text-[10px] text-[#6B7280] mb-3 uppercase tracking-widest">Timeline</p>
          <div className="relative h-8 bg-[#181818] rounded-lg overflow-hidden mb-1">
            {blocks.map((b) => {
              const s = b.start_minutes ?? b.startMinutes;
              const e = b.end_minutes   ?? b.endMinutes;
              const area = b.area_id || b.area;
              return (
                <div
                  key={b.id}
                  className="absolute top-0 h-full rounded flex items-center justify-center"
                  style={{
                    left:    `${toPercent(s)}%`,
                    width:   `${toWidth(s, e)}%`,
                    backgroundColor: AREA_HEX[area] + '33',
                    borderLeft: `2px solid ${AREA_HEX[area]}`,
                  }}
                  title={`${minutesToTime(s)}–${minutesToTime(e)} · ${AREAS[area]?.label}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-[#374151]">
            <span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
          </div>
        </div>
      )}

      {/* Add block form */}
      <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
        <p className="text-[10px] text-[#6B7280] mb-3 uppercase tracking-widest">Nuevo bloque</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[['Inicio', 'start'], ['Fin', 'end']].map(([label, field]) => (
            <div key={field}>
              <label className="text-xs text-[#6B7280] block mb-1">{label}</label>
              <input
                type="time"
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full bg-[#181818] rounded-lg px-3 py-2 text-sm text-white border border-[#2C2C2C] focus:outline-none focus:border-[#6B7280]"
              />
            </div>
          ))}
        </div>
        <div className="mb-3">
          <label className="text-xs text-[#6B7280] block mb-1">Área</label>
          <select
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value, projectId: '' }))}
            className="w-full bg-[#181818] rounded-lg px-3 py-2 text-sm text-white border border-[#2C2C2C] focus:outline-none"
          >
            {Object.values(AREAS).map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
        {form.area !== 'OTROS' && areaProjects.length > 0 && (
          <div className="mb-3">
            <label className="text-xs text-[#6B7280] block mb-1">Proyecto (opcional)</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              className="w-full bg-[#181818] rounded-lg px-3 py-2 text-sm text-white border border-[#2C2C2C] focus:outline-none"
            >
              <option value="">Sin proyecto</option>
              {areaProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <button
          onClick={addBlock}
          disabled={saving}
          className="w-full bg-[#222222] hover:bg-[#2C2C2C] text-[#F0F0F0] py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : '+ Agregar bloque'}
        </button>
      </div>

      {/* Blocks list */}
      {blocks.length > 0 && (
        <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
          <p className="text-[10px] text-[#6B7280] mb-3 uppercase tracking-widest">Bloques ({blocks.length})</p>
          <div className="flex flex-col gap-2">
            {blocks.map((b) => {
              const s = b.start_minutes ?? b.startMinutes;
              const e = b.end_minutes   ?? b.endMinutes;
              const area = b.area_id || b.area;
              const proj = projects.find((p) => p.id === b.project_id);
              return (
                <div key={b.id} className="flex items-center justify-between bg-[#181818] rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono text-white">
                        {minutesToTime(s)}–{minutesToTime(e)}
                      </span>
                      <span className="text-[#6B7280] text-xs">({minutesToLabel(e - s)})</span>
                      <AreaBadge area={area} />
                    </div>
                    {proj && (
                      <p className="text-[#374151] text-xs mt-0.5 truncate">{proj.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlock(b.id)}
                    className="text-[#374151] hover:text-red-400 ml-3 shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-[#181818] border border-red-800 rounded-2xl p-4 mb-4">
          <p className="text-red-400 text-sm font-bold mb-2">Faltan mínimos:</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-[#6B7280] text-sm">• {w}</p>
          ))}
          {canActivateSpecial && (
            <button onClick={activateSpecialDay} className="mt-3 text-xs text-yellow-400 underline">
              Activar Día Especial para saltar mínimos
            </button>
          )}
        </div>
      )}

      {/* Confirm button */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 p-4 bg-[#080808] border-t border-[#2C2C2C]">
        <button
          onClick={handleConfirm}
          disabled={blocks.length === 0 || confirming}
          className="w-full max-w-2xl mx-auto block bg-white text-black font-black py-4 rounded-xl text-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
        >
          {confirming ? 'Confirmando...' : 'CONFIRMAR PLANIFICACIÓN →'}
        </button>
      </div>
    </div>
  );
}
