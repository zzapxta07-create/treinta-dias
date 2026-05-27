import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AREAS } from '../../data/areas';
import PhotoUpload from './PhotoUpload';
import api from '../../api/index.js';

const AREA_HEX = {
  NEGOCIO: '#3B82F6', SEGUNDA: '#A855F7', ESTUDIO: '#F59E0B',
  EJERCICIO: '#10B981', OTROS: '#9a8470',
};

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

// ── Evidence form ─────────────────────────────────────────────────────────────
export function EvidenceForm({ block, onSubmit, onCancel }) {
  const [q1,         setQ1]         = useState('');
  const [focusLevel, setFocusLevel] = useState(7);
  const [photo,      setPhoto]      = useState(null);
  const [noLohice,   setNoLohice]   = useState(false);
  const [reason,     setReason]     = useState('');
  const [saving,     setSaving]     = useState(false);

  const areaColor = AREA_HEX[block.area_id] || '#9a8470';

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
      className="bg-[#110d0a] rounded-lg p-4 border border-[#3a2e22] border-l-4 mt-3"
      style={{ borderLeftColor: areaColor }}>

      {/* Block info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[#f0e6d0] font-bold text-sm">
            {block.project_name || AREAS[block.area_id]?.label}
          </p>
          <p className="font-mono text-[#9a8470] text-xs mt-0.5">
            {minutesToTime(block.start_minutes)}–{minutesToTime(block.end_minutes)}
            {' · '}{minutesToLabel(block.end_minutes - block.start_minutes)}
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="text-[#3a2e22] hover:text-[#9a8470] text-sm transition-colors ml-2">✕</button>
        )}
      </div>

      {/* No lo hice toggle */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer group">
        <div
          onClick={() => setNoLohice(v => !v)}
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            noLohice
              ? 'bg-[#8b1a2a] border-[#8b1a2a]'
              : 'bg-transparent border-[#3a2e22] group-hover:border-[#9a8470]'
          }`}
        >
          {noLohice && <span className="text-[#f0e6d0] text-[9px] leading-none">✕</span>}
        </div>
        <span className="text-sm text-[#9a8470]">No lo hice</span>
      </label>

      {noLohice ? (
        <input
          placeholder="¿Por qué? (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22] focus:border-[#8b1a2a] mb-4 placeholder-[#3a2e22] transition-colors"
        />
      ) : (
        <>
          <textarea
            required
            placeholder="¿Qué hiciste en este bloque?"
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            rows={2}
            className="w-full bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22] focus:border-[#c9a254] mb-3 resize-none placeholder-[#3a2e22] transition-colors"
          />
          <div className="mb-3">
            <div className="flex justify-between mb-1.5">
              <span className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.15em]">Nivel de concentración</span>
              <span className="font-mono text-[#c9a254] text-xs font-bold">{focusLevel}/10</span>
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
        className="w-full font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-2.5 rounded text-xs tracking-[0.12em] uppercase active:scale-95 disabled:opacity-30 transition-transform"
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
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#8b1a2a] font-mono text-[#f0e6d0] text-[8px] font-black">
      {count}
    </span>
  );
}

// ── Main notifications panel ──────────────────────────────────────────────────
export default function EvidenceInline() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
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
    <div className="mb-4 bg-[#110d0a] rounded-xl border border-[#8b1a2a]/35 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1410] transition-colors"
      >
        {/* Bell icon */}
        <div className="relative shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#8b1a2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <div className="flex-1 text-left">
          <p className="font-cinzel text-[9px] text-[#8b1a2a] uppercase tracking-[0.25em]">
            Evidencias pendientes
          </p>
          <p className="text-[#9a8470] text-xs mt-0.5">
            {pending.length} {pending.length === 1 ? 'bloque sin' : 'bloques sin'} evidencia — no suman puntos
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#8b1a2a] font-mono text-[#f0e6d0] text-[9px] font-black">
            {pending.length}
          </span>
          <span className="text-[#5a4838] text-xs">{collapsed ? '↓' : '↑'}</span>
        </div>
      </button>

      {/* Ornament */}
      {!collapsed && (
        <div className="flex items-center gap-0 px-4">
          <div className="flex-1 h-px bg-[#8b1a2a]/20" />
          <span className="text-[#8b1a2a]/30 text-[8px] px-2">◆</span>
          <div className="flex-1 h-px bg-[#8b1a2a]/20" />
        </div>
      )}

      {/* Items */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
          {pending.map(b => {
            const s       = b.start_minutes ?? b.startMinutes;
            const e       = b.end_minutes   ?? b.endMinutes;
            const color   = AREA_HEX[b.area_id] || '#9a8470';
            const elapsed = nowMins - e;
            const elapsedLabel = elapsed < 60
              ? `hace ${elapsed}min`
              : `hace ${Math.floor(elapsed / 60)}h${elapsed % 60 > 0 ? ` ${elapsed % 60}min` : ''}`;

            return (
              <div key={b.id}>
                {/* Block row */}
                {openBlockId !== b.id && (
                  <div className="flex items-center gap-3 bg-[#0a0806] rounded-lg px-3 py-2.5 border border-[#3a2e22]">
                    {/* Area dot */}
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f0e6d0] text-sm truncate">
                        {b.project_name || AREAS[b.area_id]?.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-[#9a8470] text-xs">
                          {minutesToTime(s)}–{minutesToTime(e)}
                        </span>
                        <span className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-widest">
                          {minutesToLabel(e - s)}
                        </span>
                        <span className="font-cinzel text-[8px] text-[#8b1a2a] uppercase tracking-widest">
                          {elapsedLabel}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => setOpenBlockId(b.id)}
                      className="font-cinzel text-[9px] tracking-[0.1em] uppercase shrink-0 px-3 py-1.5 rounded border border-[#c9a254]/40 text-[#c9a254] bg-[#c9a254]/08 hover:bg-[#c9a254]/15 active:scale-95 transition-all"
                      style={{ backgroundColor: 'rgba(201,162,84,0.08)' }}
                    >
                      Adjuntar
                    </button>
                  </div>
                )}

                {/* Inline form */}
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
