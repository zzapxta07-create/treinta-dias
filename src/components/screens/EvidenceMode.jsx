import { useState } from 'react';
import { useStore } from '../../store/useStore';
import Timer from '../ui/Timer';
import PhotoUpload from '../ui/PhotoUpload';
import { AREAS } from '../../data/areas';
import { minutesToTime } from '../../utils/dateUtils';
import api from '../../api/index.js';

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
};

const inputStyle = {
  width: '100%',
  background: '#09080e',
  color: '#f0e6d0',
  border: '1px solid #2c2740',
  borderRadius: '8px',
  padding: '10px 12px',
  outline: 'none',
  resize: 'none',
  fontFamily: "'Crimson Text', serif",
  fontSize: '14px',
  transition: 'border-color 0.2s',
};

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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
        style={{ background: '#09080e' }}>
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

        <div className="relative w-full max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{ border: '1px solid rgba(155,31,48,0.4)', background: '#110e1c' }}>
            <span style={{ color: '#9b1f30', fontSize: '22px' }}>✕</span>
          </div>
          <h2 className="font-cinzel text-xl font-bold tracking-[0.06em] mb-2" style={{ color: '#f0e6d0' }}>
            ¿Por qué no?
          </h2>
          <p className="text-sm mb-5" style={{ color: '#9490aa' }}>El caballero debe rendir cuentas. Mínimo 20 caracteres.</p>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explicá qué pasó..."
            style={{ ...inputStyle, marginBottom: '8px' }}
            onFocus={e => { e.target.style.borderColor = '#9b1f30'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
          <p className="text-xs mb-5 text-right font-mono" style={{ color: '#2c2740' }}>{reason.length} / 20 mínimo</p>

          <button
            onClick={handleSubmitNoHice}
            disabled={reason.trim().length < 20 || saving}
            className="w-full font-cinzel font-bold py-4 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-30 transition-transform"
            style={{ background: '#9b1f30', color: '#f0e6d0' }}
          >
            {saving ? 'Guardando...' : 'Confirmar — No Hice Nada'}
          </button>
          <button
            onClick={() => setShowNoHice(false)}
            className="w-full mt-3 font-cinzel text-[9px] tracking-widest uppercase transition-colors"
            style={{ color: '#4d4568' }}
            onMouseOver={e => { e.currentTarget.style.color = '#9490aa'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-5 max-w-lg mx-auto" style={{ background: '#09080e' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(148,144,170,0.04) 0%, transparent 60%)' }} />

      {/* Header */}
      <div className="text-center mb-6 relative">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
          style={{ border: '1px solid rgba(212,169,86,0.3)', background: '#110e1c' }}>
          <span style={{ color: '#d4a956', fontSize: '18px' }}>✦</span>
        </div>
        <p className="font-cinzel text-[8px] uppercase tracking-[0.3em] mb-1" style={{ color: '#4d4568' }}>
          Registro de Evidencia · Hora {evidenceTimer.slotIndex}
        </p>
        <p className="text-sm mb-3" style={{ color: '#9490aa' }}>{blockLabel}</p>
        {!expired && (
          <Timer deadline={evidenceTimer.deadline} onExpire={handleExpire} />
        )}
        <p className="font-cinzel text-[8px] mt-1 uppercase tracking-widest" style={{ color: '#2c2740' }}>
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
            <label className="font-cinzel text-[9px] block mb-1.5 tracking-[0.15em] uppercase" style={{ color: '#4d4568' }}>
              {label}
            </label>
            <textarea
              value={val}
              onChange={(e) => set(e.target.value)}
              rows={2}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
              onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
            />
          </div>
        ))}

        {/* Focus */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-cinzel text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4d4568' }}>
              Nivel de Concentración
            </label>
            <span className="font-mono font-bold" style={{ color: '#d4a956' }}>{focus}/10</span>
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
          className="w-full btn-primary disabled:opacity-30"
        >
          {saving ? 'Guardando...' : 'Registrar Evidencia →'}
        </button>

        <button
          onClick={() => setShowNoHice(true)}
          className="w-full font-cinzel text-[10px] tracking-[0.15em] uppercase py-3 rounded active:scale-95 transition-transform"
          style={{
            background: 'rgba(155,31,48,0.06)',
            color: '#9b1f30',
            border: '1px solid rgba(155,31,48,0.3)',
          }}
        >
          No Hice Nada
        </button>

        <button
          onClick={handleSkip}
          className="font-cinzel text-[8px] uppercase tracking-widest text-center transition-colors"
          style={{ color: '#2c2740' }}
          onMouseOver={e => { e.currentTarget.style.color = '#4d4568'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#2c2740'; }}
        >
          Ya registré desde otro dispositivo — volver al tablero
        </button>
      </div>
    </div>
  );
}
