import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAreaMap } from '../../hooks/useAreas';
import PhotoUpload from './PhotoUpload';
import api from '../../api/index.js';

function useNowMinutes() {
  const [mins, setMins] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setMins(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, []);
  return mins;
}

function minutesToTime(m) {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

function minutesToLabel(m) {
  if (m >= 60) return `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}min` : ''}`;
  return `${m}min`;
}

const inputStyle = {
  width: '100%',
  background: '#09080e',
  color: '#f0e6d0',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '10px 12px',
  border: '1px solid #2c2740',
  outline: 'none',
  resize: 'none',
  fontFamily: "'Crimson Text', serif",
  transition: 'border-color 0.2s',
};

// ── Evidence form ─────────────────────────────────────────────────────────────
export function EvidenceForm({ block, onSubmit, onCancel }) {
  const areaMap = useAreaMap();
  const [q1,         setQ1]         = useState('');
  const [focusLevel, setFocusLevel] = useState(7);
  const [photo,      setPhoto]      = useState(null);
  const [noLohice,   setNoLohice]   = useState(false);
  const [reason,     setReason]     = useState('');
  const [saving,     setSaving]     = useState(false);

  const areaColor = areaMap[block.area_id]?.color || '#9490aa';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!noLohice && !q1.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        block_id:    block.id,
        q1:          noLohice ? null : q1,
        focus_level: noLohice ? null : focusLevel,
        photo_data:  noLohice ? null : photo,
        no_hice:     noLohice,
        reason:      noLohice ? reason : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}
      className="rounded-xl p-4 mt-3"
      style={{
        background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
        border: '1px solid #2c2740',
        borderLeftWidth: 4,
        borderLeftColor: areaColor,
      }}>

      {/* Block info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[#f0e6d0] font-bold text-sm">
            {block.notes || block.project_name || areaMap[block.area_id]?.label}
          </p>
          <p className="font-mono text-[#9490aa] text-xs mt-0.5">
            {minutesToTime(block.start_minutes)}–{minutesToTime(block.end_minutes)}
            {' · '}{minutesToLabel(block.end_minutes - block.start_minutes)}
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="text-[#2c2740] hover:text-[#9490aa] text-sm transition-colors ml-2">✕</button>
        )}
      </div>

      {/* No lo hice toggle */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer group">
        <div
          onClick={() => setNoLohice(v => !v)}
          className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
          style={{
            background: noLohice ? '#9b1f30' : 'transparent',
            border: noLohice ? '1px solid #9b1f30' : '1px solid #2c2740',
          }}
        >
          {noLohice && <span className="text-[#f0e6d0] text-[9px] leading-none">✕</span>}
        </div>
        <span className="text-sm text-[#9490aa]">No lo hice</span>
      </label>

      {noLohice ? (
        <input
          placeholder="¿Por qué? (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ ...inputStyle, resize: undefined, marginBottom: '16px' }}
          onFocus={e => { e.target.style.borderColor = '#9b1f30'; }}
          onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
        />
      ) : (
        <>
          <textarea
            required
            placeholder="¿Qué hiciste en este bloque?"
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            rows={2}
            style={{ ...inputStyle, marginBottom: '12px' }}
            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
          <div className="mb-3">
            <div className="flex justify-between mb-1.5">
              <span className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.15em]">Nivel de concentración</span>
              <span className="font-mono text-[#d4a956] text-xs font-bold">{focusLevel}/10</span>
            </div>
            <input type="range" min={1} max={10} value={focusLevel}
              onChange={(e) => setFocusLevel(Number(e.target.value))} className="w-full" />
          </div>
          <div className="mb-4 flex justify-center">
            <PhotoUpload value={photo} onChange={setPhoto} label="Foto evidencia (opcional)" />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={saving || (!noLohice && !q1.trim())}
        className="w-full btn-primary disabled:opacity-30"
      >
        {saving ? 'Enviando...' : 'Enviar Evidencia →'}
      </button>
    </form>
  );
}

// ── Notification badge (exported for Dashboard header) ────────────────────────
export function NotificationBadge() {
  const currentDay = useStore((s) => s.currentDay);
  const nowMins    = useNowMinutes();

  const blocks    = (currentDay?.blocks || []).filter(b => b.area_id !== 'OTROS');
  const evidences = currentDay?.evidences || [];
  const count     = blocks.filter(b =>
    (b.end_minutes ?? b.endMinutes) <= nowMins &&
    !evidences.some(e => e.block_id === b.id)
  ).length;

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full font-mono text-[#f0e6d0] text-[8px] font-black"
      style={{ background: '#9b1f30', boxShadow: '0 0 6px rgba(155,31,48,0.5)' }}>
      {count}
    </span>
  );
}

// ── Main notifications panel ──────────────────────────────────────────────────
export default function EvidenceInline() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const areaMap       = useAreaMap();
  const nowMins       = useNowMinutes();
  const [openBlockId, setOpenBlockId] = useState(null);
  const [collapsed,   setCollapsed]   = useState(false);

  const blocks    = (currentDay?.blocks || []).filter(b => b.area_id !== 'OTROS');
  const evidences = currentDay?.evidences || [];

  const pending = blocks.filter(b =>
    (b.end_minutes ?? b.endMinutes) <= nowMins &&
    !evidences.some(e => e.block_id === b.id)
  );

  async function handleSubmit(payload) {
    await api.post('/api/evidences', payload);
    const r = await api.get(`/api/days/${currentDay.date_key}`);
    setCurrentDay(r.data.data);
    setOpenBlockId(null);
  }

  if (pending.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(135deg, #1a0e14 0%, #110e1c 100%)',
        border: '1px solid rgba(155,31,48,0.35)',
      }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
        style={{ background: 'transparent' }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="relative shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#9b1f30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <div className="flex-1 text-left">
          <p className="font-cinzel text-[9px] text-[#9b1f30] uppercase tracking-[0.25em]">
            Evidencias pendientes
          </p>
          <p className="text-[#9490aa] text-xs mt-0.5">
            {pending.length} {pending.length === 1 ? 'bloque sin' : 'bloques sin'} evidencia — no suman puntos
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full font-mono text-[#f0e6d0] text-[9px] font-black"
            style={{ background: '#9b1f30', boxShadow: '0 0 8px rgba(155,31,48,0.4)' }}>
            {pending.length}
          </span>
          <span className="text-[#4d4568] text-xs">{collapsed ? '↓' : '↑'}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="flex items-center gap-0 px-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(155,31,48,0.2)' }} />
          <span className="text-[9px] px-2" style={{ color: 'rgba(155,31,48,0.3)' }}>◆</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(155,31,48,0.2)' }} />
        </div>
      )}

      {!collapsed && (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
          {pending.map(b => {
            const s       = b.start_minutes ?? b.startMinutes;
            const e       = b.end_minutes   ?? b.endMinutes;
            const color   = areaMap[b.area_id]?.color || '#9490aa';
            const elapsed = nowMins - e;
            const elapsedLabel = elapsed < 60
              ? `hace ${elapsed}min`
              : `hace ${Math.floor(elapsed / 60)}h${elapsed % 60 > 0 ? ` ${elapsed % 60}min` : ''}`;

            return (
              <div key={b.id}>
                {openBlockId !== b.id && (
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{ background: '#09080e', border: '1px solid #2c2740' }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[#f0e6d0] text-sm truncate">
                        {b.notes || b.project_name || areaMap[b.area_id]?.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-[#9490aa] text-xs">
                          {minutesToTime(s)}–{minutesToTime(e)}
                        </span>
                        <span className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-widest">
                          {minutesToLabel(e - s)}
                        </span>
                        <span className="font-cinzel text-[8px] uppercase tracking-widest" style={{ color: '#9b1f30' }}>
                          {elapsedLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setOpenBlockId(b.id)}
                      className="font-cinzel text-[9px] tracking-[0.1em] uppercase shrink-0 px-3 py-1.5 rounded active:scale-95 transition-all"
                      style={{
                        color: '#d4a956',
                        border: '1px solid rgba(212,169,86,0.4)',
                        background: 'rgba(212,169,86,0.08)',
                      }}
                    >
                      Adjuntar
                    </button>
                  </div>
                )}

                {openBlockId === b.id && (
                  <EvidenceForm
                    block={b}
                    onSubmit={handleSubmit}
                    onCancel={() => setOpenBlockId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
