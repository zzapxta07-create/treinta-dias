import { useState, useEffect } from 'react';
import { useAreas, useAreaMap } from '../../hooks/useAreas';
import { minutesToTime, timeToMinutes } from '../../utils/dateUtils';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function dateKeyOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ── Block Modal ───────────────────────────────────────────────────────────────

function BlockModal({ day, editBlock, areas, onClose, onReload }) {
  const defaultArea = areas?.[0]?.id || 'NEGOCIO';
  const [start,  setStart]  = useState(editBlock ? minutesToTime(editBlock.start_minutes) : '07:00');
  const [end,    setEnd]    = useState(editBlock ? minutesToTime(editBlock.end_minutes)   : '08:00');
  const [area,   setArea]   = useState(editBlock?.area_id || defaultArea);
  const [notes,  setNotes]  = useState(editBlock?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handleSave() {
    const startM = timeToMinutes(start);
    const endM   = timeToMinutes(end);
    if (endM <= startM) { setError('El fin debe ser después del inicio.'); return; }
    setSaving(true);
    try {
      const payload = {
        start_time: start, end_time: end,
        start_minutes: startM, end_minutes: endM,
        area_id: area, notes: notes.trim() || null,
        project_id: editBlock?.project_id ?? null,
      };
      if (editBlock) {
        await api.put(`/api/blocks/${editBlock.id}`, payload);
      } else {
        let dayId = day.id;
        if (!dayId) {
          const { data } = await api.post(`/api/days/ensure/${day.dateKey}`);
          dayId = data.data.id;
        }
        await api.post('/api/blocks', { ...payload, day_id: dayId, sort_order: day.blocks?.length || 0 });
      }
      onClose();
      onReload();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const inputBase = {
    background: '#09080e', color: '#f0e6d0', borderRadius: '8px',
    border: '1px solid #2c2740', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: "'Crimson Text', serif",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5"
        style={{
          background: 'linear-gradient(160deg, #1a1727 0%, #110e1c 100%)',
          border: '1px solid #2c2740',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.7)',
        }}
      >
        <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.25em] uppercase mb-4">
          {editBlock ? 'Editar Bloque' : 'Nuevo Bloque'} — {DAY_ABBR[day.dayDate.getDay()]} {day.dayDate.getDate()}
        </p>

        {/* Large time inputs */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[['Inicio', start, setStart], ['Fin', end, setEnd]].map(([label, val, setter]) => (
            <div key={label}>
              <label className="font-cinzel text-[8px] text-[#4d4568] block mb-2 tracking-widest uppercase">{label}</label>
              <input
                type="time" value={val}
                onChange={e => setter(e.target.value)}
                style={{ ...inputBase, width: '100%', padding: '14px 8px', fontSize: '22px', textAlign: 'center', fontFamily: 'monospace', letterSpacing: '0.04em' }}
                onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
                onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
              />
            </div>
          ))}
        </div>

        {/* Area grid buttons */}
        <div className="mb-4">
          <label className="font-cinzel text-[8px] text-[#4d4568] block mb-2 tracking-widest uppercase">Área</label>
          <div className="grid grid-cols-2 gap-2">
            {(areas || []).map(a => (
              <button
                key={a.id}
                onClick={() => setArea(a.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
                style={area === a.id
                  ? { background: a.color + '1a', border: `1px solid ${a.color}60`, color: a.color }
                  : { background: 'rgba(255,255,255,0.02)', border: '1px solid #2c2740', color: '#4d4568' }
                }
              >
                <span className="text-base shrink-0">{a.emoji}</span>
                <span className="font-cinzel text-[9px] uppercase tracking-wide truncate">{a.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="font-cinzel text-[8px] text-[#4d4568] block mb-2 tracking-widest uppercase">Notas</label>
          <input
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="¿Qué harás en este bloque?"
            style={{ ...inputBase, width: '100%', padding: '10px 12px', fontSize: '14px' }}
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

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 font-cinzel text-[10px] tracking-[0.15em] uppercase py-3 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#d4a956', color: '#09080e' }}>
            {saving ? '...' : 'Guardar'}
          </button>
          <button onClick={onClose}
            className="flex-1 font-cinzel text-[10px] tracking-[0.15em] uppercase py-3 rounded-xl"
            style={{ background: 'transparent', border: '1px solid #2c2740', color: '#4d4568' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Day Column ─────────────────────────────────────────────────────────────────

function DayColumn({ dayDate, dayId, dayBlocks, dateKey, isToday, isPast, areaMap, compact, onAdd, onEdit, onDelete }) {
  const sorted = [...(dayBlocks || [])].sort((a, b) => a.start_minutes - b.start_minutes);

  return (
    <div
      className={compact ? 'flex-none w-[140px]' : 'flex-1 min-w-0'}
      style={isToday ? { boxShadow: '0 0 0 1px rgba(212,169,86,0.3)', borderRadius: '8px' } : {}}
    >
      {/* Header */}
      <div
        className="text-center py-2 px-1 rounded-t-lg mb-2"
        style={{ background: isToday ? 'rgba(212,169,86,0.1)' : 'rgba(255,255,255,0.03)' }}
      >
        <p
          className="font-cinzel uppercase tracking-[0.15em]"
          style={{ fontSize: compact ? '8px' : '9px', color: isToday ? '#d4a956' : isPast ? '#2c2740' : '#4d4568' }}
        >
          {DAY_ABBR[dayDate.getDay()]}
        </p>
        <p
          className="font-mono"
          style={{
            fontSize: compact ? '11px' : '16px', fontWeight: isToday ? 'bold' : 'normal',
            color: isToday ? '#d4a956' : isPast ? '#2c2740' : '#9490aa',
          }}
        >
          {dayDate.getDate()}
        </p>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-1.5 px-1 min-h-[40px]">
        {sorted.map(b => {
          const aColor = areaMap[b.area_id]?.color || '#9490aa';
          const aLabel = areaMap[b.area_id]?.label?.split(' ')[0] || b.area_id;
          const aEmoji = areaMap[b.area_id]?.emoji || '';
          return (
            <div
              key={b.id}
              className="rounded group"
              style={{
                background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
                border: '1px solid #2c2740',
                borderLeft: `2px solid ${aColor}`,
                padding: compact ? '4px 5px' : '7px 9px',
              }}
            >
              <p className="font-mono leading-tight" style={{ fontSize: compact ? '9px' : '11px', color: '#f0e6d0' }}>
                {minutesToTime(b.start_minutes)}–{minutesToTime(b.end_minutes)}
              </p>
              <p className="font-cinzel uppercase tracking-wide truncate" style={{ fontSize: compact ? '7px' : '8px', color: aColor }}>
                {compact ? '' : aEmoji + ' '}{aLabel}
              </p>
              {!compact && b.notes && (
                <p className="truncate italic mt-0.5" style={{ fontSize: '9px', color: '#4d4568' }}>{b.notes}</p>
              )}
              {!isPast && (
                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(b)} style={{ fontSize: '10px', color: '#4d4568' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}>✎</button>
                  <button onClick={() => onDelete(b.id)} style={{ fontSize: '10px', color: '#2c2740' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#9b1f30'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#2c2740'; }}>✕</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isPast && (
        <div className="px-1 mt-1.5">
          <button
            onClick={onAdd}
            className="w-full font-cinzel uppercase py-1.5 rounded transition-colors"
            style={{ fontSize: compact ? '8px' : '11px', letterSpacing: '0.1em', color: '#2c2740', border: '1px dashed #2c2740' }}
            onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#2c2740'; e.currentTarget.style.borderColor = '#2c2740'; }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function WeeklyPlanner() {
  const areas   = useAreas();
  const areaMap = useAreaMap();

  const [viewMode,     setViewMode]     = useState('3');
  const [weekOffset,   setWeekOffset]   = useState(0);   // weeks from now (7-day mode)
  const [threeOffset,  setThreeOffset]  = useState(0);   // days from today (3-day mode)
  const [weekDays,     setWeekDays]     = useState([]);
  const [notes,        setNotes]        = useState('');
  const [planId,       setPlanId]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);

  const today    = new Date();
  const todayKey = dateKeyOf(today);

  const visibleDates = viewMode === '7'
    ? Array.from({ length: 7 }, (_, i) => addDays(getMondayOf(addDays(today, weekOffset * 7)), i))
    : Array.from({ length: 3 }, (_, i) => addDays(today, threeOffset + i));

  const mondayFirst = getMondayOf(visibleDates[0]);
  const mondayLast  = getMondayOf(visibleDates[visibleDates.length - 1]);
  const sameWeek    = dateKeyOf(mondayFirst) === dateKeyOf(mondayLast);

  async function loadWeek() {
    setLoading(true);
    try {
      const reqs = [api.get(`/api/days/week/${dateKeyOf(mondayFirst)}`)];
      if (!sameWeek) reqs.push(api.get(`/api/days/week/${dateKeyOf(mondayLast)}`));
      reqs.push(api.get(`/api/weekly-plans/week/${dateKeyOf(mondayFirst)}`));

      const results = await Promise.allSettled(reqs);
      const allDays = [];
      results.slice(0, sameWeek ? 1 : 2).forEach(r => {
        if (r.status === 'fulfilled') allDays.push(...(r.value.data.data || []));
      });
      setWeekDays(allDays);

      const planResult = results[sameWeek ? 1 : 2];
      if (planResult?.status === 'fulfilled') {
        setNotes(planResult.value.data.data?.notes || '');
        setPlanId(planResult.value.data.data?.id || null);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadWeek(); }, [weekOffset, threeOffset, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  function navigate(dir) {
    if (viewMode === '7') setWeekOffset(o => o + dir);
    else setThreeOffset(o => o + dir * 3);
  }

  function resetToToday() {
    if (viewMode === '7') setWeekOffset(0);
    else setThreeOffset(0);
  }

  const weekLabel = (() => {
    const s = visibleDates[0];
    const e = visibleDates[visibleDates.length - 1];
    const fmt = d => `${d.getDate()} ${d.toLocaleString('es', { month: 'short' })}`;
    return `${fmt(s)} — ${fmt(e)}`;
  })();

  async function handleDelete(blockId) {
    if (!confirm('¿Eliminar este bloque?')) return;
    await api.delete(`/api/blocks/${blockId}`).catch(() => {});
    loadWeek();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #09080e 100%)' }}>
      <p className="font-cinzel text-[#4d4568] text-xs tracking-widest uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      {/* Header */}
      <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">Planificación</p>
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em]">Semana</h1>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2c2740' }}>
          {[['3', '3 días'], ['7', 'Semana']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="font-cinzel text-[8px] tracking-widest uppercase px-3 py-1 rounded transition-all"
              style={viewMode === mode
                ? { background: 'rgba(212,169,86,0.15)', color: '#d4a956', border: '1px solid rgba(212,169,86,0.3)' }
                : { color: '#4d4568', border: '1px solid transparent' }
              }
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[#9490aa] text-xs">{weekLabel}</p>
        <div className="flex items-center gap-1">
          {[['‹', -1], ['›', 1]].map(([arrow, dir], idx) => (
            <button
              key={idx}
              onClick={() => navigate(dir)}
              className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors"
              style={{ border: '1px solid #2c2740', color: '#4d4568' }}
              onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; e.currentTarget.style.borderColor = '#2c2740'; }}
            >{arrow}</button>
          ))}
          <button
            onClick={resetToToday}
            className="font-cinzel text-[8px] tracking-widest uppercase px-2 transition-colors ml-1"
            style={{ color: '#4d4568' }}
            onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}
          >Hoy</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        <DiamondOrnament color="#4d4568" size={7} />
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      </div>

      {/* Columns */}
      <div className={`flex pb-2 ${viewMode === '7' ? 'gap-1.5 overflow-x-auto' : 'gap-3'}`}>
        {visibleDates.map((date) => {
          const dateKey = dateKeyOf(date);
          const dayData = weekDays.find(d => d.dateKey === dateKey) || {};
          return (
            <DayColumn
              key={dateKey}
              dayDate={date}
              dayId={dayData.id || null}
              dayBlocks={dayData.blocks || []}
              dateKey={dateKey}
              isToday={dateKey === todayKey}
              isPast={dateKey < todayKey}
              areaMap={areaMap}
              compact={viewMode === '7'}
              onAdd={() => setModal({ id: dayData.id || null, dateKey, dayDate: date, blocks: dayData.blocks || [] })}
              onEdit={(block) => setModal({ id: dayData.id || null, dateKey, dayDate: date, blocks: dayData.blocks || [], editBlock: block })}
              onDelete={handleDelete}
            />
          );
        })}
      </div>

      {/* Weekly notes */}
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
          <DiamondOrnament color="#4d4568" size={6} />
          <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em] shrink-0">Notas de la Semana</p>
          <DiamondOrnament color="#4d4568" size={6} />
          <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={async (e) => {
            e.target.style.borderColor = '#2c2740';
            if (planId) {
              try { await api.put(`/api/weekly-plans/${planId}`, { notes: e.target.value }); } catch {}
            }
          }}
          rows={3}
          placeholder="Objetivos semanales, contexto, notas..."
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
            color: '#f0e6d0', fontSize: '14px', borderRadius: '8px',
            padding: '10px 12px', border: '1px solid #2c2740',
            outline: 'none', resize: 'none',
            fontFamily: "'Crimson Text', serif", transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
        />
      </div>

      {/* Area legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {areas.map(a => (
          <div key={a.id} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
            <span className="font-cinzel text-[8px] uppercase tracking-wide" style={{ color: '#4d4568' }}>
              {a.emoji} {a.label.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <BlockModal
          day={modal}
          editBlock={modal.editBlock}
          areas={areas}
          onClose={() => setModal(null)}
          onReload={loadWeek}
        />
      )}
    </div>
  );
}
