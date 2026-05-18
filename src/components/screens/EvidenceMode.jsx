import { useState } from "react";
import { useStore } from "../../store/useStore";
import Timer from "../ui/Timer";
import PhotoUpload from "../ui/PhotoUpload";
import { AREAS } from "../../data/areas";

export default function EvidenceMode() {
  const evidenceTimer = useStore((s) => s.currentDay.evidenceTimer);
  const blocks = useStore((s) => s.currentDay.blocks);
  const submitEvidence = useStore((s) => s.submitEvidence);

  const [photo, setPhoto] = useState(null);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [focus, setFocus] = useState(5);
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [reason, setReason] = useState("");
  const [expired, setExpired] = useState(false);

  if (!evidenceTimer) return null;

  const setPhase = useStore((s) => s.setPhase);

  const block = blocks.find((b) => b.id === evidenceTimer.blockId);
  const blockLabel = block
    ? `${block.startTime}–${block.endTime} · ${AREAS[block.area]?.label}`
    : "";

  function handleSkip() {
    useStore.setState((s) => ({
      currentDay: { ...s.currentDay, phase: "dashboard", evidenceTimer: null },
    }));
  }

  function handleExpire() {
    if (expired) return;
    setExpired(true);
    submitEvidence({
      blockId: evidenceTimer.blockId,
      slotIndex: evidenceTimer.slotIndex,
      photo: null,
      q1: "",
      q2: "",
      q3: "",
      focus: 0,
      noHice: true,
      reason: "Tiempo agotado — sin respuesta",
    });
  }

  function handleNoHice() {
    setShowReasonForm(true);
  }

  function handleSubmitNoHice() {
    if (reason.trim().length < 20) return;
    submitEvidence({
      blockId: evidenceTimer.blockId,
      slotIndex: evidenceTimer.slotIndex,
      photo: null,
      q1: "",
      q2: "",
      q3: "",
      focus: 0,
      noHice: true,
      reason: reason.trim(),
    });
  }

  function handleSubmit() {
    if (!photo || q1.trim().length < 3 || q2.trim().length < 3 || q3.trim().length < 3)
      return;
    submitEvidence({
      blockId: evidenceTimer.blockId,
      slotIndex: evidenceTimer.slotIndex,
      photo,
      q1: q1.trim(),
      q2: q2.trim(),
      q3: q3.trim(),
      focus,
      noHice: false,
      reason: "",
    });
  }

  const canSubmit =
    photo && q1.trim().length >= 3 && q2.trim().length >= 3 && q3.trim().length >= 3;

  if (showReasonForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-6 py-10">
        <div className="text-5xl mb-5">😶</div>
        <h2 className="text-xl font-black mb-2 text-center">¿Por qué no hiciste nada?</h2>
        <p className="text-gray-600 text-sm mb-5 text-center">Mínimo 20 caracteres.</p>
        <div className="w-full max-w-sm">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explicá qué pasó..."
            className="w-full bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 border border-[#333333] focus:outline-none focus:border-gray-500 resize-none mb-2"
          />
          <p className="text-gray-700 text-xs mb-5 text-right">
            {reason.length} / 20 mínimo
          </p>
          <button
            onClick={handleSubmitNoHice}
            disabled={reason.trim().length < 20}
            className="w-full bg-red-600 text-white font-black py-4 rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
          >
            CONFIRMAR — NO HICE NADA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-5">
        <p className="text-gray-600 text-xs uppercase tracking-wider mb-1">
          Registro de evidencia
        </p>
        <p className="text-gray-400 text-sm mb-3">{blockLabel}</p>
        {evidenceTimer && !expired && (
          <Timer deadline={evidenceTimer.deadline} onExpire={handleExpire} />
        )}
        <p className="text-gray-700 text-xs mt-1">para registrar</p>
      </div>

      <div className="flex flex-col gap-4 flex-1 pb-4">
        {/* Photo */}
        <div className="flex justify-center">
          <PhotoUpload
            value={photo}
            onChange={setPhoto}
            label="Foto de lo que hiciste"
          />
        </div>

        {/* Questions */}
        {[
          { val: q1, set: setQ1, label: "¿Qué hice en los últimos 30 minutos?" },
          { val: q2, set: setQ2, label: "¿Cuánto avancé en el proyecto?" },
          { val: q3, set: setQ3, label: "¿Cuál es el próximo paso?" },
        ].map(({ val, set, label }, i) => (
          <div key={i}>
            <label className="text-xs text-gray-500 block mb-1">{label}</label>
            <textarea
              value={val}
              onChange={(e) => set(e.target.value)}
              rows={2}
              className="w-full bg-[#1a1a1a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-700 border border-[#333333] focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>
        ))}

        {/* Focus slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-500">Nivel de foco</label>
            <span className="text-white font-mono text-sm font-bold">
              {focus}/10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={focus}
            onChange={(e) => setFocus(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-700 mt-1">
            <span>Disperso</span>
            <span>Hiperfoco</span>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-green-500 text-black font-black py-4 rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
        >
          REGISTRAR
        </button>
        <button
          onClick={handleNoHice}
          className="w-full bg-[#1a1a1a] text-red-400 font-medium py-3 rounded-xl text-sm active:scale-95 transition-transform"
        >
          NO HICE NADA
        </button>
        <button
          onClick={handleSkip}
          className="text-gray-700 text-xs underline hover:text-gray-500 text-center transition-colors"
        >
          Ya registré desde otro dispositivo — volver al dashboard
        </button>
      </div>
    </div>
  );
}
