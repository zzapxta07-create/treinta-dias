import { useState } from "react";
import { useStore } from "../../store/useStore";
import { AREAS, MANDATORY_AREAS } from "../../data/areas";
import { timeToMinutes, minutesToTime, minutesToLabel } from "../../utils/dateUtils";
import { areaMinutesFromBlocks } from "../../utils/scoring";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function DayPlanner() {
  const projects = useStore((s) => s.projects);
  const currentDay = useStore((s) => s.currentDay);
  const setBlocks = useStore((s) => s.setBlocks);
  const confirmPlanning = useStore((s) => s.confirmPlanning);
  const activateSpecialDay = useStore((s) => s.activateSpecialDay);
  const activateReplanDay = useStore((s) => s.activateReplanDay);
  const specialDays = useStore((s) => s.specialDays);
  const replanDays = useStore((s) => s.replanDays);

  const [blocks, setLocalBlocks] = useState(currentDay.blocks || []);
  const [form, setForm] = useState({
    start: "07:00",
    end: "08:00",
    area: "NEGOCIO",
    projectId: "",
  });
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);

  const areaMins = areaMinutesFromBlocks(blocks);
  const canActivateSpecial =
    specialDays.usedDays.length < specialDays.total && !currentDay.isSpecialDay;
  const canReplan =
    replanDays.usedDays.length < replanDays.total && !currentDay.usedReplan;

  function addBlock() {
    setError("");
    const startM = timeToMinutes(form.start);
    const endM = timeToMinutes(form.end);
    if (endM <= startM) {
      setError("La hora de fin debe ser después del inicio.");
      return;
    }
    const overlap = blocks.find(
      (b) => !(endM <= b.startMinutes || startM >= b.endMinutes)
    );
    if (overlap) {
      setError(
        `Solapamiento con el bloque ${minutesToTime(overlap.startMinutes)}–${minutesToTime(overlap.endMinutes)}.`
      );
      return;
    }
    const newBlock = {
      id: generateId(),
      area: form.area,
      projectId: form.projectId,
      startMinutes: startM,
      endMinutes: endM,
      startTime: form.start,
      endTime: form.end,
    };
    const updated = [...blocks, newBlock].sort(
      (a, b) => a.startMinutes - b.startMinutes
    );
    setLocalBlocks(updated);
    setBlocks(updated);
    setForm((f) => ({ ...f, start: form.end }));
  }

  function removeBlock(id) {
    const updated = blocks.filter((b) => b.id !== id);
    setLocalBlocks(updated);
    setBlocks(updated);
  }

  function handleConfirm() {
    if (currentDay.isSpecialDay) {
      confirmPlanning();
      return;
    }
    const warns = [];
    const m = areaMinutesFromBlocks(blocks);
    if (m.NEGOCIO < 300)
      warns.push(`Negocio Principal: faltan ${minutesToLabel(300 - m.NEGOCIO)}`);
    if (m.SEGUNDA < 60)
      warns.push(`Segunda Empresa: faltan ${minutesToLabel(60 - m.SEGUNDA)}`);
    if (m.ESTUDIO < 180)
      warns.push(`Estudio: faltan ${minutesToLabel(180 - m.ESTUDIO)}`);
    if (m.EJERCICIO < 30)
      warns.push(`Ejercicio: faltan ${minutesToLabel(30 - m.EJERCICIO)}`);
    if (warns.length > 0) {
      setWarnings(warns);
      return;
    }
    confirmPlanning();
  }

  const areaProjects = projects.filter((p) => p.area === form.area);

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto pb-28">
      <h1 className="text-xl font-black mb-1">Planificar Hoy</h1>
      <p className="text-gray-600 text-sm mb-4">
        Creá los bloques del día. Los mínimos deben cumplirse antes de confirmar.
      </p>

      {/* Minimums tracker */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          {currentDay.isSpecialDay ? "Día Especial — mínimos libres" : "Mínimos obligatorios"}
        </p>
        {MANDATORY_AREAS.map((id) => {
          const area = AREAS[id];
          const done = areaMins[id] || 0;
          const ok = currentDay.isSpecialDay || done >= area.minMinutes;
          return (
            <div key={id} className="flex justify-between items-center text-sm mb-1.5">
              <span className={ok ? "text-green-400" : "text-gray-400"}>
                {area.label}
              </span>
              <span
                className={`font-mono text-xs ${
                  ok ? "text-green-400" : "text-red-400"
                }`}
              >
                {minutesToLabel(done)} / {minutesToLabel(area.minMinutes)}
              </span>
            </div>
          );
        })}
        {canActivateSpecial && (
          <button
            onClick={() => {
              activateSpecialDay();
              setWarnings([]);
            }}
            className="mt-3 text-xs text-yellow-400 underline"
          >
            Activar Día Especial (quedan{" "}
            {specialDays.total - specialDays.usedDays.length})
          </button>
        )}
      </div>

      {/* Block form */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Nuevo bloque
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Inicio</label>
            <input
              type="time"
              value={form.start}
              onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
              className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white border border-[#333333] focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Fin</label>
            <input
              type="time"
              value={form.end}
              onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
              className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white border border-[#333333] focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Área</label>
          <select
            value={form.area}
            onChange={(e) =>
              setForm((f) => ({ ...f, area: e.target.value, projectId: "" }))
            }
            className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white border border-[#333333] focus:outline-none"
          >
            {Object.values(AREAS).map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        {form.area !== "OTROS" && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1">Proyecto</label>
            <select
              value={form.projectId}
              onChange={(e) =>
                setForm((f) => ({ ...f, projectId: e.target.value }))
              }
              className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white border border-[#333333] focus:outline-none"
            >
              <option value="">Sin proyecto específico</option>
              {areaProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && (
          <p className="text-red-400 text-xs mb-2">{error}</p>
        )}
        <button
          onClick={addBlock}
          className="w-full bg-[#222222] hover:bg-[#2a2a2a] text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar bloque
        </button>
      </div>

      {/* Blocks list */}
      {blocks.length > 0 && (
        <div className="bg-[#111111] rounded-2xl p-4 mb-4">
          <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
            Bloques del día ({blocks.length})
          </p>
          <div className="flex flex-col gap-2">
            {blocks.map((b) => {
              const project = projects.find((p) => p.id === b.projectId);
              const dur = b.endMinutes - b.startMinutes;
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white">
                        {b.startTime}–{b.endTime}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({minutesToLabel(dur)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-600">
                        {AREAS[b.area]?.label}
                      </span>
                      {project && (
                        <span className="text-xs text-gray-700">· {project.name}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeBlock(b.id)}
                    className="text-gray-700 hover:text-red-400 text-sm ml-3 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-[#1a1a1a] border border-red-800 rounded-2xl p-4 mb-4">
          <p className="text-red-400 text-sm font-bold mb-2">Faltan mínimos:</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-gray-400 text-sm">
              • {w}
            </p>
          ))}
          {canActivateSpecial && (
            <button
              onClick={() => {
                activateSpecialDay();
                setWarnings([]);
              }}
              className="mt-3 text-xs text-yellow-400 underline"
            >
              Activar Día Especial para saltar mínimos
            </button>
          )}
        </div>
      )}

      {/* Replan day notice */}
      {canReplan && blocks.length > 0 && (
        <div className="text-center mb-4">
          <button
            onClick={activateReplanDay}
            className="text-xs text-gray-600 underline"
          >
            Usar día de replanificación ({replanDays.total - replanDays.usedDays.length} restantes)
          </button>
        </div>
      )}

      {/* Confirm button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <button
          onClick={handleConfirm}
          disabled={blocks.length === 0}
          className="w-full max-w-lg mx-auto block bg-white text-black font-black py-4 rounded-xl text-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
        >
          CONFIRMAR PLANIFICACIÓN →
        </button>
      </div>
    </div>
  );
}
