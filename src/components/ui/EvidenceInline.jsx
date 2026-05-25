import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AREAS } from '../../data/areas';
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

export function EvidenceForm({ block, onSubmit, onCancel }) {
  const [q1,         setQ1]         = useState('');
  const [focusLevel, setFocusLevel] = useState(7);
  const [photo,      setPhoto]      = useState(null);
  const [noLohice,   setNoLohice]   = useState(false);
  const [reason,     setReason]     = useState('');
  const [saving,     setSaving]     = useState(false);

  const areaColor = {
    NEGOCIO: 'border-blue-500', SEGUNDA: 'border-purple-500',
    ESTUDIO: 'border-yellow-500', EJERCICIO: 'border-green-500',
  }[block.area_id] || 'border-gray-500';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!noLohice && !q1.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        block_id:   block.id,
        q1:         noLohice ? null : q1,
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
    <form onSubmit={handleSubmit} className={`bg-[#101010] rounded-2xl p-4 border-l-4 ${areaColor} border border-[#2C2C2C]`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-sm">{block.project_name || AREAS[block.area_id]?.label}</p>
          <p className="text-[#6B7280] text-xs">
            {Math.floor(block.start_minutes/60)}:{String(block.start_minutes%60).padStart(2,'0')} –{' '}
            {Math.floor(block.end_minutes/60)}:{String(block.end_minutes%60).padStart(2,'0')}
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[#374151] hover:text-[#6B7280] text-xs">✕</button>
        )}
      </div>

      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input type="checkbox" checked={noLohice} onChange={(e) => setNoLohice(e.target.checked)} className="w-4 h-4 rounded" />
        <span className="text-sm text-[#F0F0F0]">No lo hice</span>
      </label>

      {noLohice ? (
        <input
          placeholder="¿Por qué? (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2C2C2C] mb-3"
        />
      ) : (
        <>
          <textarea
            required
            placeholder="¿Qué hiciste en este bloque?"
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            rows={2}
            className="w-full bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-[#2C2C2C] mb-3 resize-none"
          />
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#6B7280]">Nivel de foco</span>
              <span className="text-white font-mono font-bold">{focusLevel}/10</span>
            </div>
            <input type="range" min={1} max={10} value={focusLevel}
              onChange={(e) => setFocusLevel(Number(e.target.value))} className="w-full" />
          </div>
          <div className="mb-3 flex justify-center">
            <PhotoUpload value={photo} onChange={setPhoto} label="Foto evidencia (opcional)" />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={saving || (!noLohice && !q1.trim())}
        className="w-full bg-white text-black font-black py-2.5 rounded-xl text-sm active:scale-95 disabled:opacity-30 transition-transform"
      >
        {saving ? 'Enviando...' : 'ENVIAR EVIDENCIA'}
      </button>
    </form>
  );
}

// Shows reminders for ended blocks that still have no evidence
export default function EvidenceInline() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const nowMins       = useNowMinutes();
  const [openBlockId, setOpenBlockId] = useState(null);

  const blocks    = (currentDay?.blocks || []).filter(b => b.area_id !== 'OTROS');
  const evidences = currentDay?.evidences || [];

  const pending = blocks.filter(b =>
    b.end_minutes <= nowMins && !evidences.some(e => e.block_id === b.id)
  );

  async function handleSubmit(payload) {
    await api.post('/api/evidences', payload);
    const r = await api.get(`/api/days/${currentDay.date_key}`);
    setCurrentDay(r.data.data);
    setOpenBlockId(null);
  }

  if (pending.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-xs text-yellow-500 uppercase tracking-wider mb-3">
        ⚠ Sin evidencia — no suman puntos ({pending.length})
      </p>
      <div className="flex flex-col gap-3">
        {pending.map(b => {
          if (openBlockId === b.id) {
            return (
              <EvidenceForm
                key={b.id}
                block={b}
                onSubmit={handleSubmit}
                onCancel={() => setOpenBlockId(null)}
              />
            );
          }
          return (
            <div key={b.id} className="bg-[#101010] rounded-xl p-3 border border-yellow-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {b.project_name || AREAS[b.area_id]?.label}
                </p>
                <p className="text-[#6B7280] text-xs">
                  Terminó {Math.floor(b.end_minutes/60)}:{String(b.end_minutes%60).padStart(2,'0')} · 0 pts
                </p>
              </div>
              <button
                onClick={() => setOpenBlockId(b.id)}
                className="bg-yellow-500 text-black text-xs font-black px-3 py-1.5 rounded-lg active:scale-95 transition-transform shrink-0"
              >
                Adjuntar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
