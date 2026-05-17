import { useState } from "react";
import { useStore } from "../../store/useStore";
import PhotoUpload from "../ui/PhotoUpload";

const EMOTION_LABELS = {
  1: "Muy mal",
  2: "Mal",
  3: "Mal",
  4: "Regular",
  5: "Regular",
  6: "Bien",
  7: "Bien",
  8: "Muy bien",
  9: "Excelente",
  10: "Excelente",
};

export default function DayClose() {
  const projects = useStore((s) => s.projects);
  const closeDay = useStore((s) => s.closeDay);

  const [photo, setPhoto] = useState(null);
  const [emotionalState, setEmotionalState] = useState(5);
  const [projectProgress, setProjectProgress] = useState(
    Object.fromEntries(
      projects
        .filter((p) => p.type === "percent")
        .map((p) => [p.id, p.progress || 0])
    )
  );
  const [binaryDone, setBinaryDone] = useState(
    Object.fromEntries(
      projects
        .filter((p) => p.type === "binary")
        .map((p) => [p.id, p.done || false])
    )
  );

  const percentProjects = projects.filter((p) => p.type === "percent");
  const binaryProjects = projects.filter((p) => p.type === "binary");

  function handleClose() {
    if (!photo) return;
    const merged = { ...projectProgress };
    binaryProjects.forEach((p) => {
      merged[p.id] = binaryDone[p.id] ? 100 : p.progress || 0;
    });
    closeDay({ photo, emotionalState, projectProgress: merged });
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto pb-28">
      <h1 className="text-xl font-black mb-1">Cierre del día</h1>
      <p className="text-gray-600 text-sm mb-6">
        Registrá el cierre antes de dormir.
      </p>

      {/* PC photo */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Foto del PC apagado
        </p>
        <div className="flex justify-center">
          <PhotoUpload value={photo} onChange={setPhoto} label="Foto del PC apagado" />
        </div>
      </div>

      {/* Emotional state */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Estado emocional del día
        </p>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-4xl font-black text-white">{emotionalState}</span>
          <span className="text-gray-400 text-lg">{EMOTION_LABELS[emotionalState]}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={emotionalState}
          onChange={(e) => setEmotionalState(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-700 mt-1">
          <span>Muy mal</span>
          <span>Excelente</span>
        </div>
      </div>

      {/* Project progress */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-4 uppercase tracking-wider">
          Progreso de proyectos
        </p>
        <div className="flex flex-col gap-5">
          {percentProjects.map((p) => (
            <div key={p.id}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 truncate mr-2 max-w-[80%] leading-tight">
                  {p.name}
                </span>
                <span className="text-white font-mono font-bold shrink-0">
                  {projectProgress[p.id] || 0}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={projectProgress[p.id] || 0}
                onChange={(e) =>
                  setProjectProgress((prev) => ({
                    ...prev,
                    [p.id]: Number(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>
          ))}
          {binaryProjects.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm max-w-[70%] leading-tight">
                {p.name}
              </span>
              <button
                onClick={() =>
                  setBinaryDone((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                }
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  binaryDone[p.id]
                    ? "bg-green-600 text-white"
                    : "bg-[#222222] text-gray-500"
                }`}
              >
                {binaryDone[p.id] ? "✓ Realizada" : "Pendiente"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <button
          onClick={handleClose}
          disabled={!photo}
          className="w-full max-w-lg mx-auto block bg-white text-black font-black py-4 rounded-xl text-xl active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
        >
          CERRAR DÍA
        </button>
      </div>
    </div>
  );
}
