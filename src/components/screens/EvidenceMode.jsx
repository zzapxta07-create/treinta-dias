import { useState } from 'react';
import { useStore } from '../../store/useStore';
import Timer from '../ui/Timer';
import PhotoUpload from '../ui/PhotoUpload';
import { AREAS } from '../../data/areas';
import { minutesToTime } from '../../utils/dateUtils';
import api from '../../api/index.js';

export default function EvidenceMode() {
  const evidenceTimer    = useStore((s) => s.evidenceTimer);
  const currentDay       = useStore((s) => s.currentDay);
  const clearEvidenceTimer = useStore((s) => s.clearEvidenceTimer);
  const setCurrentDay    = useStore((s) => s.setCurrentDay);

  const [photo,     setPhoto]     = useState(null);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [focus,     setFocus]     = useState(5);
  const [showNoHice, setShowNoHice] = useState(false);
  const [reason,    setReason]    = useState('');
  const [expired,   setExpired]   = useState(false);
  const [saving,    setSaving]    = useState(false);

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
        block_id:    evidenceTimer.blockId,
        slot_index:  evidenceTimer.slotIndex,
        ...payload,
      });
      // Reload current day to get updated evidences
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 py-10">
        <div className="text-5xl mb-5">😶</div>
        <h2 className="text-xl font-black mb-2 text-center">¿Por qué no hiciste nada?</h2>
        <p className="text-[#6B7280] text-sm mb-5 text-center">Mínimo 20 caracteres.</p>
        <div className="w-full max-w-sm">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explicá qué pasó..."
            className="w-full bg-[#101010] rounded-xl px-4 py-3 text-sm text-white placeholder-[#374151] border border-[#2C2C2C] focus:outline-none focus:border-[#6B7280] resize-none mb-2"
          />
          <p className="text-[#374151] text-xs mb-5 text-right">{reason.length} / 20 mínimo</p>
          <button
            onClick={handleSubmitNoHice}
            disabled={reason.trim().length < 20 || saving}
            className="w-full bg-red-600 text-white font-black py-4 rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
          >
            {saving ? 'Guardando...' : 'CONFIRMAR — NO HICE NADA'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-5">
        <p className="text-[#6B7280] text-xs uppercase tracking-wider mb-1">Registro de evidencia · hora {evidenceTimer.slotIndex}</p>
        <p className="text-[#F0F0F0] text-sm mb-3">{blockLabel}</p>
        {!expired && (
          <Timer deadline={evidenceTimer.deadline} onExpire={handleExpire} />
        )}
        <p className="text-[#374151] text-xs mt-1">para registrar</p>
      </div>

      <div className="flex flex-col gap-4 flex-1 pb-4">
        {/* Photo */}
        <div className="flex justify-center">
          <PhotoUpload value={photo} onChange={setPhoto} label="Foto de lo que hiciste" />
        </div>

        {/* Questions — 60 min */}
        {[
          { val: q1, set: setQ1, label: '¿Qué hice en la última hora?' },
          { val: q2, set: setQ2, label: '¿Cuánto avancé en el proyecto?' },
          { val: q3, set: setQ3, label: '¿Cuál es el próximo paso?' },
        ].map(({ val, set, label }, i) => (
          <div key={i}>
            <label className="text-xs text-[#6B7280] block mb-1">{label}</label>
            <textarea
              value={val}
              onChange={(e) => set(e.target.value)}
              rows={2}
              className="w-full bg-[#101010] rounded-xl px-3 py-2 text-sm text-white placeholder-[#374151] border border-[#2C2C2C] focus:outline-none focus:border-[#6B7280] resize-none"
            />
          </div>
        ))}

        {/* Focus */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-[#6B7280]">Nivel de foco</label>
            <span className="text-white font-mono text-sm font-bold">{focus}/10</span>
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
          className="w-full bg-green-500 text-black font-black py-4 rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
        >
          {saving ? 'Guardando...' : 'REGISTRAR'}
        </button>
        <button
          onClick={() => setShowNoHice(true)}
          className="w-full bg-[#181818] text-red-400 font-medium py-3 rounded-xl text-sm active:scale-95 transition-transform"
        >
          NO HICE NADA
        </button>
        <button
          onClick={handleSkip}
          className="text-[#374151] text-xs underline hover:text-[#6B7280] text-center transition-colors"
        >
          Ya registré desde otro dispositivo — volver al dashboard
        </button>
      </div>
    </div>
  );
}
