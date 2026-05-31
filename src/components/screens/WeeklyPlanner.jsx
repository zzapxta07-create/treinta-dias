import { useState, useEffect } from 'react';
import { AREAS } from '../../data/areas';
import { minutesToTime, timeToMinutes } from '../../utils/dateUtils';
import api from '../../api/index.js';

const DAY_ABBR = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const AREA_HEX = {
  NEGOCIO: '#3B82F6', SEGUNDA: '#A855F7', ESTUDIO: '#F59E0B',
  EJERCICIO: '#10B981', OTROS: '#9a8470',
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

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-1 h-px bg-[#3a2e22]" />
      <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.25em] shrink-0">{children}</p>
      <div className="flex-1 h-px bg-[#3a2e22]" />
    </div>
  );
}

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
    <div className="bg-[#0a0806] rounded-lg p-3 border border-[#3a2e22] mt-2">
      <div className="grid grid-cols-2 gap-2 mb-2">
        {[['Inicio', start, setStart], ['Fin', end, setEnd]].map(([label, val, setter]) => (
          <div key={label}>
            <label className="font-cinzel text-[8px] text-[#5a4838] block mb-1 tracking-widest uppercase">{label}</label>
            <input type="time" value={val} onChange={e => setter(e.target.value)}
              className="w-full bg-[#110d0a] rounded px-2 py-1.5 text-sm text-[#f0e6d0] border border-[#3a2e22] focus:outline-none focus:border-[#c9a254] transition-colors" />
          </div>
        ))}
      </div>
      <div className="mb-2">
        <label className="font-cinzel text-[8px] text-[#5a4838] block mb-1 tracking-widest uppercase">Área</label>
        <select value={area} onChange={e => setArea(e.target.value)}
          className="w-full bg-[#110d0a] rounded px-2 py-1.5 text-sm text-[#f0e6d0] border border-[#3a2e22] focus:outline-none">
          {Object.values(AREAS).map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </div>
      <div className="mb-2">
        <label className="font-cinzel text-[8px] text-[#5a4838] block mb-1 tracking-widest uppercase">Notas</label>
        <input value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="¿Qué harás?" maxLength={200}
          className="w-full bg-[#110d0a] rounded px-2 py-1.5 text-sm text-[#f0e6d0] border border-[#3a2e22] focus:outline-none focus:border-[#c9a254] placeholder-[#3a2e22] transition-colors" />
      </div>
      {error && <p className="text-[#8b1a2a] text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 font-cinzel text-[9px] tracking-widest uppercase bg-[#c9a254] text-[#0a0806] py-1.5 rounded disabled:opacity-50">
          {saving ? '...' : 'Guardar'}
        </button>
        <button onClick={onCancel}
          className="flex-1 font-cinzel text-[9px] tracking-widest uppercase bg-[#1a1410] text-[#5a4838] border border-[#3a2e22] py-1.5 rounded">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function DayColumn({ dayIndex, dayDate, blocks, planId, onPlanChange, isToday, isPast }) {
  const [addingBlock, setAddingBlock] = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const dayBlocks = (blocks || []).filter(b => b.day_of_week === dayIndex)
    .sort((a, b) => a.start_minutes - b.start_minutes);

  async function handleAdd(values) {
    await api.post(`/api/weekly-plans/${planId}/blocks`, { ...values, day_of_week: dayIndex });
    setAddingBlock(false);
    onPlanChange();
  }

  async function handleEdit(blockId, values) {
    await api.put(`/api/weekly-plans/blocks/${blockId}`, values);
    setEditingId(null);
    onPlanChange();
  }

  async function handleDelete(blockId) {
    await api.delete(`/api/weekly-plans/blocks/${blockId}`);
    onPlanChange();
  }

  return (
    <div className={`flex-1 min-w-0 ${isToday ? 'ring-1 ring-[#c9a254]/30 rounded-lg' : ''}`}>
      <div className={`text-center py-2 px-1 rounded-t-lg mb-2 ${isToday ? 'bg-[#c9a254]/10' : 'bg-[#110d0a]'}`}>
        <p className={`font-cinzel text-[8px] uppercase tracking-[0.15em] ${
          isToday ? 'text-[#c9a254]' : isPast ? 'text-[#3a2e22]' : 'text-[#5a4838]'
        }`}>{DAY_ABBR[dayIndex]}</p>
        <p className={`font-mono text-xs ${
          isToday ? 'text-[#c9a254] font-bold' : isPast ? 'text-[#3a2e22]' : 'text-[#9a8470]'
        }`}>{dayDate.getDate()}</p>
      </div>

      <div className="flex flex-col gap-1 px-1 min-h-[60px]">
        {dayBlocks.map(b => (
          <div key={b.id}>
            {editingId === b.id ? (
              <BlockForm
                initialValues={{ start: minutesToTime(b.start_minutes), end: minutesToTime(b.end_minutes), area: b.area_id, notes: b.notes || '' }}
                onSave={(v) => handleEdit(b.id, v)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="bg-[#110d0a] rounded p-1.5 border border-[#3a2e22] group"
                style={{ borderLeftColor: AREA_HEX[b.area_id], borderLeftWidth: 2 }}>
                <p className="font-mono text-[10px] text-[#f0e6d0] leading-tight">
                  {minutesToTime(b.start_minutes)}–{minutesToTime(b.end_minutes)}
                </p>
                <p className="font-cinzel text-[8px] uppercase tracking-wide truncate"
                  style={{ color: AREA_HEX[b.area_id] }}>{AREAS[b.area_id]?.label?.split(' ')[0]}</p>
                {b.notes && <p className="text-[#5a4838] text-[9px] truncate italic mt-0.5">{b.notes}</p>}
                {!isPast && (
                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingId(b.id)}
                      className="text-[#5a4838] hover:text-[#c9a254] text-[10px] transition-colors">✎</button>
                    <button onClick={() => handleDelete(b.id)}
                      className="text-[#3a2e22] hover:text-[#8b1a2a] text-[10px] transition-colors">✕</button>
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
              className="w-full font-cinzel text-[8px] tracking-widest uppercase text-[#3a2e22] hover:text-[#c9a254] py-1 border border-dashed border-[#3a2e22] hover:border-[#c9a254]/40 rounded transition-colors">
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
  const [plan,       setPlan]       = useState(null);
  const [loading,    setLoading]    = useState(true);

  const monday    = getMondayOf(addDays(new Date(), weekOffset * 7));
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const todayKey  = dateKeyOf(new Date());

  async function loadPlan() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/weekly-plans/week/${dateKeyOf(monday)}`);
      setPlan(data.data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadPlan(); }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekLabel = (() => {
    const end = addDays(monday, 6);
    const fmt = d => `${d.getDate()} ${d.toLocaleString('es', { month: 'short' })}`;
    return `${fmt(monday)} — ${fmt(end)}`;
  })();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0806]">
      <p className="font-cinzel text-[#5a4838] text-xs tracking-widest uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-1">
        Planificación
      </p>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em]">
          Semana
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="w-7 h-7 rounded border border-[#3a2e22] text-[#5a4838] hover:text-[#c9a254] hover:border-[#c9a254]/40 text-sm flex items-center justify-center transition-colors">
            ‹
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="font-cinzel text-[8px] tracking-widest uppercase text-[#5a4838] hover:text-[#c9a254] transition-colors px-2">
            Hoy
          </button>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="w-7 h-7 rounded border border-[#3a2e22] text-[#5a4838] hover:text-[#c9a254] hover:border-[#c9a254]/40 text-sm flex items-center justify-center transition-colors">
            ›
          </button>
        </div>
      </div>
      <p className="font-mono text-[#9a8470] text-xs mb-5">{weekLabel}</p>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#3a2e22]" />
        <span className="text-[#5a4838] text-xs">◆</span>
        <div className="flex-1 h-px bg-[#3a2e22]" />
      </div>

      {plan && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDates.map((date, i) => {
            const dateKey = dateKeyOf(date);
            return (
              <DayColumn
                key={i}
                dayIndex={i}
                dayDate={date}
                blocks={plan.blocks || []}
                planId={plan.id}
                onPlanChange={loadPlan}
                isToday={dateKey === todayKey}
                isPast={dateKey < todayKey}
              />
            );
          })}
        </div>
      )}

      {plan && (
        <div className="mt-6">
          <SectionTitle>Notas de la Semana</SectionTitle>
          <textarea
            defaultValue={plan.notes || ''}
            onBlur={async (e) => {
              if (e.target.value !== (plan.notes || '')) {
                try {
                  const { data } = await api.put(`/api/weekly-plans/${plan.id}`, { notes: e.target.value });
                  setPlan(data.data);
                } catch {}
              }
            }}
            rows={3}
            placeholder="Objetivos semanales, contexto, notas..."
            className="w-full bg-[#110d0a] rounded px-3 py-2.5 text-sm text-[#f0e6d0] border border-[#3a2e22] focus:outline-none focus:border-[#c9a254] resize-none placeholder-[#3a2e22] transition-colors"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(AREA_HEX).map(([id, color]) => (
          <div key={id} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-wide">
              {AREAS[id]?.label?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
