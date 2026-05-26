import { useState } from 'react';
import { useStore } from '../../store/useStore';
import Timer from '../ui/Timer';
import PhotoUpload from '../ui/PhotoUpload';
import { AREAS } from '../../data/areas';
import { minutesToTime } from '../../utils/dateUtils';
import api from '../../api/index.js';

export default function EvidenceMode() {
  const evidenceTimer      = useStore((s) => s.evidenceTimer);
  const currentDay         = useStore((s) => s.currentDay);
  const clearEvidenceTimer = useStore((s) => s.clearEvidenceTimer);
  const setCurrentDay      = useStore((s) => s.setCurrentDay);

  const [photo,      setPhoto]      = useState(null);
  const [q1,         setQ1]         = useState('');
  const [q2,         setQ2]         = useState('');
  const [q3,         setQ3]         = useState('');
  const [focus,      setFocus]      = useState(5);
  const [showNoHice, setShowNoHice] = useState(false);
  const [reason,     setReason]     = useState('');
  const [expired,    setExpired]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  if (!evidenceTimer) return null;

  const block = (currentDay?.blocks || []).find((b) => b.id === evidenceTimer.blockId);
  const blockLabel = block
    ? `${minutesToTime(block.start_minutes ?? block.startMinutes)}–${minutesToTime(block.end_minutes ?? block.endMinutes)} · ${AREAS[block.area_id || block.area]?.label}`
    : '';

  async function submitEvidence(payload) {
    if (saving) return;
    setSaving(true);
    try {
      await api.post('/api/evidences', {
        block_id:   evidenceTimer.blockId,
        slot_index: evidenceTimer.slotIndex,
        ...payload,
      });
      const { data } = await api.get(`/api/days/${currentDay.date_key}`);
      setCurrentDay(data.data);
      clearEvidenceTimer();
    } catch {
      setSaving(false);
    }
  }

  function handleExpire() {
    if (expired) return;
    setExpired(true);
    submitEvidence({ no_hice: true, reason: 'Tiempo agotado — sin respuesta' });
  }

  function handleSkip() {
    clearEvidenceTimer();
  }

  function handleSubmit() {
    if (!photo || q1.trim().length < 3 || q2.trim().length < 3 || q3.trim().length < 3) return;
    submitEvidence({ q1: q1.trim(), q2: q2.trim(), q3: q3.trim(), focus_level: focus, no_hice: false });
  }

  function handleSubmitNoHice() {
    if (reason.trim().length < 20) return;
    submitEvidence({ no_hice: true, reason: reason.trim() });
  }

  const canSubmit = photo && q1.trim().length >= 3 && q2.trim().length >= 3 && q3.trim().length >= 3;

  if (showNoHice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] px-6 py-10">
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

        <div className="relative w-full max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#8b1a2a]/40 bg-[#110d0a] mb-5">
            <span className="text-[#8b1a2a] text-2xl">✕</span>
          </div>
          <h2 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em] mb-2">
            ¿Por qué no?
          </h2>
          <p className="text-[#9a8470] text-sm mb-5">El caballero debe rendir cuentas. Mínimo 20 caracteres.</p>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explicá qué pasó..."
            className="w-full bg-[#110d0a] rounded px-4 py-3 text-sm text-[#f0e6d0] placeholder-[#3a2e22] border border-[#3a2e22] focus:outline-none focus:border-[#8b1a2a] resize-none mb-2 transition-colors"
          />
          <p className="text-[#3a2e22] text-xs mb-5 text-right font-mono">{reason.length} / 20 mínimo</p>
          <button
            onClick={handleSubmitNoHice}
            disabled={reason.trim().length < 20 || saving}
            className="w-full font-cinzel font-bold bg-[#8b1a2a] text-[#f0e6d0] py-4 rounded text-sm tracking-[0.12em] uppercase disabled:opacity-30 active:scale-95 transition-transform"
          >
            {saving ? 'Guardando...' : 'Confirmar — No Hice Nada'}
          </button>
          <button
            onClick={() => setShowNoHice(false)}
            className="w-full mt-3 font-cinzel text-[9px] text-[#5a4838] tracking-widest uppercase hover:text-[#9a8470] transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-5 max-w-lg mx-auto bg-[#0a0806]">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#c9a254]/30 bg-[#110d0a] mb-3">
          <span className="text-[#c9a254] text-lg">✦</span>
        </div>
        <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.3em] mb-1">
          Registro de Evidencia · Hora {evidenceTimer.slotIndex}
        </p>
        <p className="text-[#9a8470] text-sm mb-3">{blockLabel}</p>
        {!expired && (
          <Timer deadline={evidenceTimer.deadline} onExpire={handleExpire} />
        )}
        <p className="font-cinzel text-[#3a2e22] text-[8px] mt-1 uppercase tracking-widest">
          para registrar
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1 pb-4">
        {/* Photo */}
        <div className="flex justify-center">
          <PhotoUpload value={photo} onChange={setPhoto} label="Foto de lo que hiciste" />
        </div>

        {/* Questions */}
        {[
          { val: q1, set: setQ1, label: '¿Qué hice en la última hora?' },
          { val: q2, set: setQ2, label: '¿Cuánto avancé en la empresa?' },
          { val: q3, set: setQ3, label: '¿Cuál es el próximo paso?' },
        ].map(({ val, set, label }, i) => (
          <div key={i}>
            <label className="font-cinzel text-[9px] text-[#5a4838] block mb-1.5 tracking-[0.15em] uppercase">
              {label}
            </label>
            <textarea
              value={val}
              onChange={(e) => set(e.target.value)}
              rows={2}
              className="w-full bg-[#110d0a] rounded px-3 py-2 text-sm text-[#f0e6d0] placeholder-[#3a2e22] border border-[#3a2e22] focus:outline-none focus:border-[#c9a254] resize-none transition-colors"
            />
          </div>
        ))}

        {/* Focus */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-cinzel text-[9px] text-[#5a4838] uppercase tracking-[0.15em]">
              Nivel de Concentración
            </label>
            <span className="font-mono text-[#c9a254] font-bold">{focus}/10</span>
          </div>
          <input
            type="range" min={1} max={10} value={focus}
            onChange={(e) => setFocus(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="w-full font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 rounded text-sm tracking-[0.12em] uppercase disabled:opacity-30 active:scale-95 transition-transform"
        >
          {saving ? 'Guardando...' : 'Registrar Evidencia →'}
        </button>

        <button
          onClick={() => setShowNoHice(true)}
          className="w-full bg-[#110d0a] text-[#8b1a2a] font-cinzel text-[10px] tracking-[0.15em] uppercase py-3 rounded border border-[#8b1a2a]/30 active:scale-95 transition-transform hover:bg-[#8b1a2a]/10"
        >
          No Hice Nada
        </button>

        <button
          onClick={handleSkip}
          className="font-cinzel text-[#3a2e22] text-[8px] uppercase tracking-widest hover:text-[#5a4838] text-center transition-colors"
        >
          Ya registré desde otro dispositivo — volver al tablero
        </button>
      </div>
    </div>
  );
}
