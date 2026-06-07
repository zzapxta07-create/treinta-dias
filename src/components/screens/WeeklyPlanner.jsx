import { useState, useEffect } from 'react';
import { AREAS } from '../../data/areas';
import { minutesToTime, timeToMinutes } from '../../utils/dateUtils';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const DAY_ABBR = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const AREA_HEX = {
  NEGOCIO: '#3B82F6', SEGUNDA: '#A855F7', ESTUDIO: '#F59E0B',
  EJERCICIO: '#10B981', OTROS: '#9490aa', PERSONAL: '#EC4899',
};

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

const inputStyle = {
  background: '#09080e',
  color: '#f0e6d0',
  fontSize: '13px',
  borderRadius: '6px',
  border: '1px solid #2c2740',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: "'Crimson Text', serif",
};

function BlockForm({ onSave, onCancel, initialValues = {} }) {
  const [start,  setStart]  = useState(initialValues.start || '07:00');
  const [end,    setEnd]    = useState(initialValues.end   || '08:00');
  const [area,   setArea]   = useState(initialValues.area  || 'NEGOCIO');
  const [notes,  setNotes]  = useState(initialValues.notes || '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handleSave() {
    const startM = timeToMinutes(start);
    const endM   = timeToMinutes(end);
    if (endM <= startM) { setError('El fin debe ser después del inicio.'); return; }
    setSaving(true);
    try {
      await onSave({ start_time: start, end_time: end, start_minutes: startM,
                     end_minutes: endM, area_id: area, notes: notes.trim() || null });
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg p-3 mt-2" style={{ background: '#09080e', border: '1px solid #2c2740' }}>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {[['Inicio', start, setStart], ['Fin', end, setEnd]].map(([label, val, setter]) => (
          <div key={label}>
            <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1 tracking-widest uppercase">{label}</label>
            <input type="time" value={val} onChange={e => setter(e.target.value)}
              style={{ ...inputStyle, width: '100%', padding: '6px 8px' }}
              onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
              onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
            />
          </div>
        ))}
      </div>
      <div className="mb-2">
        <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1 tracking-widest uppercase">Área</label>
        <select value={area} onChange={e => setArea(e.target.value)}
          style={{ ...inputStyle, width: '100%', padding: '6px 8px' }}>
          {Object.values(AREAS).map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </div>
      <div className="mb-2">
        <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1 tracking-widest uppercase">Notas</label>
        <input value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="¿Qué harás?" maxLength={200}
          style={{ ...inputStyle, width: '100%', padding: '6px 8px' }}
          onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
          onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
        />
      </div>
      {error && <p className="text-[#9b1f30] text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 font-cinzel text-[9px] tracking-widest uppercase py-1.5 rounded disabled:opacity-50"
          style={{ background: '#d4a956', color: '#09080e' }}>
          {saving ? '...' : 'Guardar'}
        </button>
        <button onClick={onCancel}
          className="flex-1 font-cinzel text-[9px] tracking-widest uppercase py-1.5 rounded text-[#4d4568]"
          style={{ background: 'transparent', border: '1px solid #2c2740' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function DayColumn({ dayIndex, dayDate, dayId, dayBlocks, dateKey, onReload, isToday, isPast }) {
  const [addingBlock, setAddingBlock] = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const sorted = [...(dayBlocks || [])].sort((a, b) => a.start_minutes - b.start_minutes);

  async function ensureDayId() {
    if (dayId) return dayId;
    const { data } = await api.post(`/api/days/ensure/${dateKey}`);
    return data.data.id;
  }

  async function handleAdd(values) {
    const id = await ensureDayId();
    await api.post('/api/blocks', { ...values, day_id: id, sort_order: sorted.length });
    setAddingBlock(false);
    onReload();
  }

  async function handleEdit(blockId, values) {
    await api.put(`/api/blocks/${blockId}`, values);
    setEditingId(null);
    onReload();
  }

  async function handleDelete(blockId) {
    await api.delete(`/api/blocks/${blockId}`);
    onReload();
  }

  return (
    <div className="flex-none w-[160px]"
      style={isToday ? { boxShadow: '0 0 0 1px rgba(212,169,86,0.3)', borderRadius: '8px' } : {}}>
      <div className="text-center py-2 px-1 rounded-t-lg mb-2"
        style={{ background: isToday ? 'rgba(212,169,86,0.1)' : 'rgba(255,255,255,0.03)' }}>
        <p className="font-cinzel text-[8px] uppercase tracking-[0.15em]"
          style={{ color: isToday ? '#d4a956' : isPast ? '#1e1b2e' : '#4d4568' }}>
          {DAY_ABBR[dayIndex]}
        </p>
        <p className="font-mono text-xs"
          style={{ color: isToday ? '#d4a956' : isPast ? '#1e1b2e' : '#9490aa', fontWeight: isToday ? 'bold' : 'normal' }}>
          {dayDate.getDate()}
        </p>
      </div>

      <div className="flex flex-col gap-1 px-1 min-h-[60px]">
        {sorted.map(b => (
          <div key={b.id}>
            {editingId === b.id ? (
              <BlockForm
                initialValues={{ start: minutesToTime(b.start_minutes), end: minutesToTime(b.end_minutes), area: b.area_id, notes: b.notes || '' }}
                onSave={(v) => handleEdit(b.id, v)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="rounded p-1.5 group"
                style={{
                  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
                  border: '1px solid #2c2740',
                  borderLeft: `2px solid ${AREA_HEX[b.area_id]}`,
                }}>
                <p className="font-mono text-[10px] text-[#f0e6d0] leading-tight">
                  {minutesToTime(b.start_minutes)}–{minutesToTime(b.end_minutes)}
                </p>
                <p className="font-cinzel text-[8px] uppercase tracking-wide truncate"
                  style={{ color: AREA_HEX[b.area_id] }}>{AREAS[b.area_id]?.label?.split(' ')[0]}</p>
                {b.notes && <p className="text-[9px] truncate italic mt-0.5" style={{ color: '#4d4568' }}>{b.notes}</p>}
                {!isPast && (
                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingId(b.id)}
                      className="text-[10px] transition-colors" style={{ color: '#4d4568' }}
                      onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; }}
                      onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}>✎</button>
                    <button onClick={() => handleDelete(b.id)}
                      className="text-[10px] transition-colors" style={{ color: '#2c2740' }}
                      onMouseOver={e => { e.currentTarget.style.color = '#9b1f30'; }}
                      onMouseOut={e => { e.currentTarget.style.color = '#2c2740'; }}>✕</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isPast && (
        <div className="px-1 mt-1">
          {addingBlock ? (
            <BlockForm onSave={handleAdd} onCancel={() => setAddingBlock(false)} />
          ) : (
            <button onClick={() => setAddingBlock(true)}
              className="w-full font-cinzel text-[8px] tracking-widest uppercase py-1 rounded transition-colors"
              style={{ color: '#2c2740', border: '1px dashed #2c2740' }}
              onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#2c2740'; e.currentTarget.style.borderColor = '#2c2740'; }}>
              +
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function WeeklyPlanner() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDays,   setWeekDays]   = useState([]);
  const [notes,      setNotes]      = useState('');
  const [planId,     setPlanId]     = useState(null);
  const [loading,    setLoading]    = useState(true);

  const monday    = getMondayOf(addDays(new Date(), weekOffset * 7));
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const todayKey  = dateKeyOf(new Date());

  async function loadWeek() {
    setLoading(true);
    try {
      const [daysRes, planRes] = await Promise.all([
        api.get(`/api/days/week/${dateKeyOf(monday)}`),
        api.get(`/api/weekly-plans/week/${dateKeyOf(monday)}`),
      ]);
      setWeekDays(daysRes.data.data || []);
      setNotes(planRes.data.data?.notes || '');
      setPlanId(planRes.data.data?.id || null);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadWeek(); }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekLabel = (() => {
    const end = addDays(monday, 6);
    const fmt = d => `${d.getDate()} ${d.toLocaleString('es', { month: 'short' })}`;
    return `${fmt(monday)} — ${fmt(end)}`;
  })();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>
      <p className="font-cinzel text-[#4d4568] text-xs tracking-widest uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">
        Planificación
      </p>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em]">
          Semana
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors"
            style={{ border: '1px solid #2c2740', color: '#4d4568' }}
            onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; e.currentTarget.style.borderColor = '#2c2740'; }}>
            ‹
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="font-cinzel text-[8px] tracking-widest uppercase px-2 transition-colors"
            style={{ color: '#4d4568' }}
            onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}>
            Hoy
          </button>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors"
            style={{ border: '1px solid #2c2740', color: '#4d4568' }}
            onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; e.currentTarget.style.borderColor = '#2c2740'; }}>
            ›
          </button>
        </div>
      </div>
      <p className="font-mono text-[#9490aa] text-xs mb-5">{weekLabel}</p>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        <DiamondOrnament color="#4d4568" size={7} />
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDates.map((date, i) => {
          const dateKey = dateKeyOf(date);
          const dayData = weekDays.find(d => d.dateKey === dateKey) || {};
          return (
            <DayColumn
              key={i}
              dayIndex={i}
              dayDate={date}
              dayId={dayData.id || null}
              dayBlocks={dayData.blocks || []}
              dateKey={dateKey}
              onReload={loadWeek}
              isToday={dateKey === todayKey}
              isPast={dateKey < todayKey}
            />
          );
        })}
      </div>

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
            if (planId) {
              try {
                await api.put(`/api/weekly-plans/${planId}`, { notes: e.target.value });
              } catch {}
            }
          }}
          rows={3}
          placeholder="Objetivos semanales, contexto, notas..."
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
            color: '#f0e6d0',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '10px 12px',
            border: '1px solid #2c2740',
            outline: 'none',
            resize: 'none',
            fontFamily: "'Crimson Text', serif",
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
          onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(AREA_HEX).map(([id, color]) => (
          <div key={id} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-cinzel text-[8px] uppercase tracking-wide" style={{ color: '#4d4568' }}>
              {AREAS[id]?.label?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
