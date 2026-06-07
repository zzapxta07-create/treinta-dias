import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AREAS, MANDATORY_AREAS } from '../../data/areas';
import { timeToMinutes, minutesToTime, minutesToLabel } from '../../utils/dateUtils';
import AreaBadge from '../ui/AreaBadge';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const AREA_MINS = { NEGOCIO: 300, SEGUNDA: 60, ESTUDIO: 180, EJERCICIO: 30 };

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,169,86,0.04)',
};

const inputStyle = {
  width: '100%',
  background: '#09080e',
  color: '#f0e6d0',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '9px 12px',
  border: '1px solid #2c2740',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: "'Crimson Text', serif",
};

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      <DiamondOrnament color="#4d4568" size={6} />
      <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em] shrink-0">{children}</p>
      <DiamondOrnament color="#4d4568" size={6} />
      <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
    </div>
  );
}

export default function DayPlanner() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const config        = useStore((s) => s.config);

  const [projects, setProjects] = useState([]);
  const [blocks,   setBlocks]   = useState(currentDay?.blocks || []);
  const [form,     setForm]     = useState({ start: '07:00', end: '08:00', area: 'NEGOCIO', projectId: '', notes: '' });
  const [error,    setError]    = useState('');
  const [warnings, setWarnings] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        day_id:        currentDay.id,
        area_id:       form.area,
        project_id:    form.projectId ? parseInt(form.projectId) : null,
        start_time:    form.start,
        end_time:      form.end,
        start_minutes: startM,
        end_minutes:   endM,
        sort_order:    blocks.length,
        notes:         form.notes.trim() || null,
      };
      const { data } = await api.post('/api/blocks', payload);
      const newBlock = data.data;
      const updated  = [...blocks, newBlock].sort((a, b) =>
        (a.start_minutes ?? a.startMinutes) - (b.start_minutes ?? b.startMinutes)
      );
      setBlocks(updated);
      setCurrentDay({ ...currentDay, blocks: updated });
      setForm((f) => ({ ...f, start: form.end, notes: '' }));
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

  function startEdit(b) {
    setEditingId(b.id);
    setEditForm({
      start:     minutesToTime(b.start_minutes ?? b.startMinutes),
      end:       minutesToTime(b.end_minutes   ?? b.endMinutes),
      area:      b.area_id || b.area,
      projectId: b.project_id ? String(b.project_id) : '',
      notes:     b.notes || '',
    });
    setError('');
  }

  async function saveEdit(blockId) {
    const startM = timeToMinutes(editForm.start);
    const endM   = timeToMinutes(editForm.end);
    if (endM <= startM) { setError('El fin debe ser después del inicio.'); return; }
    const overlap = blocks.find((b) => {
      if (b.id === blockId) return false;
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
      const { data } = await api.put(`/api/blocks/${blockId}`, {
        area_id:       editForm.area,
        project_id:    editForm.projectId ? parseInt(editForm.projectId) : null,
        start_time:    editForm.start,
        end_time:      editForm.end,
        start_minutes: startM,
        end_minutes:   endM,
        notes:         editForm.notes?.trim() || null,
      });
      const updated = (data.data?.day?.blocks || blocks.map(b => b.id === blockId ? data.data.block : b))
        .sort((a, b) => (a.start_minutes ?? a.startMinutes) - (b.start_minutes ?? b.startMinutes));
      setBlocks(updated);
      setCurrentDay({ ...currentDay, blocks: updated });
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function activateSpecialDay() {
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/special-day`);
      setCurrentDay(data.data);
      setWarnings([]);
    } catch {}
  }

  async function addSpecialDay() {
    try {
      const newTotal = (config.special_days_total || 0) + 1;
      const { data } = await api.put('/api/config', { special_days_total: newTotal });
      useStore.getState().setConfig(data.data);
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

  const TIMELINE_START = 6 * 60;
  const TIMELINE_END   = 24 * 60;
  const TIMELINE_RANGE = TIMELINE_END - TIMELINE_START;

  function toPercent(mins) {
    return Math.max(0, Math.min(100, ((mins - TIMELINE_START) / TIMELINE_RANGE) * 100));
  }
  function toWidth(start, end) {
    return Math.max(0.5, ((end - start) / TIMELINE_RANGE) * 100);
  }

  const AREA_HEX = {
    NEGOCIO: '#3B82F6', SEGUNDA: '#A855F7', ESTUDIO: '#F59E0B',
    EJERCICIO: '#10B981', OTROS: '#9490aa',
  };

  const fieldStyle = (focused) => ({
    ...inputStyle,
    borderColor: focused ? '#d4a956' : '#2c2740',
    boxShadow: focused ? '0 0 0 3px rgba(212,169,86,0.08)' : 'none',
  });

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">
        {currentDay?.date_key?.toString().slice(0, 10)}
      </p>
      <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em] mb-1"
        style={{ textShadow: '0 0 30px rgba(212,169,86,0.08)' }}>
        Planificar el Día
      </h1>
      <p className="text-[#4d4568] text-sm mb-6">Establece los bloques de trabajo para la jornada.</p>

      {/* Minimums */}
      <div className="p-4 mb-4" style={panelStyle}>
        <SectionTitle>{isSpecial ? 'Día Especial — mínimos libres' : 'Mínimos Obligatorios'}</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {MANDATORY_AREAS.map((id) => {
            const done = areaMins[id] || 0;
            const ok   = isSpecial || done >= AREA_MINS[id];
            return (
              <div key={id} className="flex justify-between items-center">
                <span className={`text-xs ${ok ? 'text-[#d4a956]' : 'text-[#4d4568]'}`}>
                  {ok ? '✓' : '◦'} {AREAS[id].label.split(' ')[0]}
                </span>
                <span className={`font-mono text-xs ${ok ? 'text-[#d4a956]' : 'text-[#9b1f30]'}`}>
                  {minutesToLabel(done)}/{minutesToLabel(AREA_MINS[id])}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3">
          {canActivateSpecial && (
            <button onClick={activateSpecialDay}
              className="font-cinzel text-[9px] tracking-widest uppercase text-[#d4a956]/70 hover:text-[#d4a956] transition-colors">
              Activar Día Especial ({config.special_days_total - config.special_days_used_count} restantes)
            </button>
          )}
          {!canActivateSpecial && <span />}
          {config && (
            <button onClick={addSpecialDay}
              className="font-cinzel text-[9px] tracking-widest uppercase text-[#4d4568] hover:text-[#d4a956] transition-colors">
              + día especial
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {blocks.length > 0 && (
        <div className="p-4 mb-4" style={panelStyle}>
          <SectionTitle>Línea de Tiempo</SectionTitle>
          <div className="relative h-7 rounded overflow-hidden mb-1 border border-[#2c2740]"
            style={{ background: '#09080e' }}>
            {blocks.map((b) => {
              const s = b.start_minutes ?? b.startMinutes;
              const e = b.end_minutes   ?? b.endMinutes;
              const area = b.area_id || b.area;
              return (
                <div
                  key={b.id}
                  className="absolute top-0 h-full"
                  style={{
                    left:    `${toPercent(s)}%`,
                    width:   `${toWidth(s, e)}%`,
                    backgroundColor: AREA_HEX[area] + '40',
                    borderLeft: `2px solid ${AREA_HEX[area]}`,
                  }}
                  title={`${minutesToTime(s)}–${minutesToTime(e)} · ${AREAS[area]?.label}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between font-mono text-[9px] text-[#2c2740]">
            <span>VI</span><span>XII</span><span>XVIII</span><span>XXIV</span>
          </div>
        </div>
      )}

      {/* Add block form */}
      <div className="p-4 mb-4" style={panelStyle}>
        <SectionTitle>Nuevo Bloque</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[['Inicio', 'start'], ['Fin', 'end']].map(([label, field]) => (
            <div key={field}>
              <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">{label}</label>
              <input
                type="time"
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
                onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
              />
            </div>
          ))}
        </div>
        <div className="mb-3">
          <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">Área</label>
          <select
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value, projectId: '' }))}
            style={inputStyle}
          >
            {Object.values(AREAS).map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
        {form.area !== 'OTROS' && areaProjects.length > 0 && (
          <div className="mb-3">
            <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">Empresa (opcional)</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              style={inputStyle}
            >
              <option value="">Sin empresa</option>
              {areaProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="mb-3">
          <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">Notas (opcional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            placeholder="¿Qué planeas hacer en este bloque?"
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
        </div>
        {error && (
          <p className="text-sm px-3 py-2 rounded mb-3"
            style={{ color: '#c43040', background: 'rgba(155,31,48,0.08)', border: '1px solid rgba(155,31,48,0.25)' }}>
            {error}
          </p>
        )}
        <button
          onClick={addBlock}
          disabled={saving}
          className="w-full font-cinzel text-[10px] tracking-[0.15em] uppercase py-2.5 rounded transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(212,169,86,0.08)',
            color: '#d4a956',
            border: '1px solid rgba(212,169,86,0.3)',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(212,169,86,0.15)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(212,169,86,0.08)'}
        >
          {saving ? 'Guardando...' : '+ Agregar Bloque'}
        </button>
      </div>

      {/* Blocks list */}
      {blocks.length > 0 && (
        <div className="p-4 mb-4" style={panelStyle}>
          <SectionTitle>Bloques del Día ({blocks.length})</SectionTitle>
          <div className="flex flex-col gap-2">
            {blocks.map((b) => {
              const s = b.start_minutes ?? b.startMinutes;
              const e = b.end_minutes   ?? b.endMinutes;
              const area = b.area_id || b.area;
              const proj = projects.find((p) => p.id === b.project_id);
              const isEditing = editingId === b.id;
              const editAreaProjects = projects.filter((p) => p.area_id === editForm.area && !p.archived);

              if (isEditing) {
                return (
                  <div key={b.id} className="p-4 rounded-xl border-l-4"
                    style={{
                      background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
                      border: '1px solid #2c2740',
                      borderLeftColor: AREA_HEX[editForm.area] || '#9490aa',
                    }}>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[['Inicio', 'start'], ['Fin', 'end']].map(([label, field]) => (
                        <div key={field}>
                          <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">{label}</label>
                          <input
                            type="time"
                            value={editForm[field]}
                            onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
                            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mb-3">
                      <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">Área</label>
                      <select
                        value={editForm.area}
                        onChange={(e) => setEditForm((f) => ({ ...f, area: e.target.value, projectId: '' }))}
                        style={inputStyle}
                      >
                        {Object.values(AREAS).map((a) => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                    {editForm.area !== 'OTROS' && editAreaProjects.length > 0 && (
                      <div className="mb-3">
                        <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">Empresa (opcional)</label>
                        <select
                          value={editForm.projectId}
                          onChange={(e) => setEditForm((f) => ({ ...f, projectId: e.target.value }))}
                          style={inputStyle}
                        >
                          <option value="">Sin empresa</option>
                          {editAreaProjects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1.5 tracking-[0.2em] uppercase">Notas (opcional)</label>
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={2}
                        placeholder="¿Qué planeas hacer en este bloque?"
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
                        onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(b.id)}
                        disabled={saving}
                        className="flex-1 font-cinzel text-[10px] tracking-[0.15em] uppercase py-2 rounded transition-colors disabled:opacity-50 btn-primary"
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        className="flex-1 font-cinzel text-[10px] tracking-[0.15em] uppercase py-2 rounded transition-colors disabled:opacity-50"
                        style={{ color: '#4d4568', border: '1px solid #2c2740', background: 'transparent' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg p-3 border border-[#2c2740]"
                  style={{ background: '#0c0a14' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-[#f0e6d0]">
                        {minutesToTime(s)}–{minutesToTime(e)}
                      </span>
                      <span className="text-[#9490aa] text-xs">({minutesToLabel(e - s)})</span>
                      <AreaBadge area={area} />
                    </div>
                    {proj && (
                      <p className="text-[#4d4568] text-xs mt-0.5 truncate">{proj.name}</p>
                    )}
                    {b.notes && (
                      <p className="text-[#9490aa] text-xs mt-1 italic leading-snug">{b.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => startEdit(b)}
                      className="text-[#4d4568] hover:text-[#d4a956] transition-colors text-sm"
                      title="Editar bloque"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => removeBlock(b.id)}
                      className="text-[#2c2740] hover:text-[#9b1f30] transition-colors"
                      title="Eliminar bloque"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{
          background: 'rgba(155,31,48,0.06)',
          border: '1px solid rgba(155,31,48,0.3)',
        }}>
          <p className="font-cinzel text-[9px] text-[#9b1f30] tracking-[0.2em] uppercase mb-3">
            Mínimos insuficientes
          </p>
          {warnings.map((w, i) => (
            <p key={i} className="text-[#9490aa] text-sm">• {w}</p>
          ))}
          <div className="flex items-center gap-4 mt-3">
            {canActivateSpecial && (
              <button onClick={activateSpecialDay}
                className="font-cinzel text-[9px] tracking-widest uppercase text-[#d4a956]/70 hover:text-[#d4a956] transition-colors">
                Activar Día Especial para continuar
              </button>
            )}
            <button onClick={addSpecialDay}
              className="font-cinzel text-[9px] tracking-widest uppercase text-[#4d4568] hover:text-[#d4a956] transition-colors">
              + día especial
            </button>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 p-4 border-t border-[#2c2740]"
        style={{ background: 'rgba(9,8,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={handleConfirm}
          disabled={blocks.length === 0 || confirming}
          className="w-full max-w-2xl mx-auto block btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {confirming ? 'Confirmando...' : 'Confirmar Planificación →'}
        </button>
      </div>
    </div>
  );
}
