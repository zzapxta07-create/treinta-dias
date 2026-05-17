import { useStore } from "../../store/useStore";
import { calcTotalScore, calcAreaScore } from "../../utils/scoring";
import { AREAS, MANDATORY_AREAS } from "../../data/areas";
import ProgressBar from "../ui/ProgressBar";

export default function FinalSummary() {
  const days = useStore((s) => s.days);
  const projects = useStore((s) => s.projects);

  const totalScore = Math.max(0, calcTotalScore(days));
  const completedDays = Object.values(days).filter(
    (d) => d.status === "complete"
  ).length;
  const lostDays = Object.values(days).filter(
    (d) => d.status === "lost"
  ).length;
  const habitCompliance = Math.round((completedDays / 30) * 100);

  const pass = totalScore >= 2100 && habitCompliance >= 80;

  const withEmotion = Object.values(days).filter((d) => d.emotionalState);
  const avgEmotion =
    withEmotion.length > 0
      ? (
          withEmotion.reduce((acc, d) => acc + d.emotionalState, 0) /
          withEmotion.length
        ).toFixed(1)
      : "—";

  const completedProjects = projects.filter(
    (p) => (p.progress || 0) >= 100 || p.done
  );
  const pendingProjects = projects.filter(
    (p) => (p.progress || 0) < 100 && !p.done
  );

  function exportData() {
    const data = {
      totalScore,
      habitCompliance,
      verdict: pass ? "LISTO PARA BOGOTÁ" : "APLAZAR Y REPLANTEAR",
      completedDays,
      lostDays,
      avgEmotion,
      projects: projects.map((p) => ({
        name: p.name,
        area: p.area,
        progress: p.progress,
        done: p.done,
      })),
      days: Object.values(days).map((d) => ({
        dateKey: d.dateKey,
        score: d.score,
        status: d.status,
        emotionalState: d.emotionalState,
        penalties: d.penalties,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "30-dias-resumen.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-lg mx-auto">
      <h1 className="text-3xl font-black text-center mb-1 tracking-tight">
        RESUMEN FINAL
      </h1>
      <p className="text-gray-600 text-center text-sm mb-8">30 días completados</p>

      {/* Verdict */}
      <div
        className={`rounded-2xl p-6 text-center mb-6 ${
          pass ? "bg-green-600" : "bg-red-700"
        }`}
      >
        <p className="text-2xl font-black text-white tracking-wide">
          {pass ? "LISTO PARA BOGOTÁ" : "APLAZAR Y REPLANTEAR"}
        </p>
        <p className="text-sm mt-1 opacity-80 text-white">
          {pass
            ? "Cumpliste los dos criterios. ¡Bien hecho!"
            : `${totalScore < 2100 ? "Score insuficiente" : ""}${
                totalScore < 2100 && habitCompliance < 80 ? " · " : ""
              }${habitCompliance < 80 ? "Cumplimiento insuficiente" : ""}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#111111] rounded-2xl p-4 text-center">
          <p className="text-gray-600 text-xs mb-1">Score total</p>
          <p className="text-3xl font-black text-white">{totalScore}</p>
          <p className="text-gray-700 text-xs">meta: 2100</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 text-center">
          <p className="text-gray-600 text-xs mb-1">Cumplimiento</p>
          <p className="text-3xl font-black text-white">{habitCompliance}%</p>
          <p className="text-gray-700 text-xs">meta: 80%</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 text-center">
          <p className="text-gray-600 text-xs mb-1">Días completos</p>
          <p className="text-3xl font-black text-green-400">{completedDays}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 text-center">
          <p className="text-gray-600 text-xs mb-1">Días perdidos</p>
          <p className="text-3xl font-black text-red-400">{lostDays}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 col-span-2 text-center">
          <p className="text-gray-600 text-xs mb-1">Estado emocional promedio</p>
          <p className="text-3xl font-black text-white">{avgEmotion}/10</p>
        </div>
      </div>

      {/* Area scores */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-5">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Score por área
        </p>
        <div className="flex flex-col gap-2">
          {MANDATORY_AREAS.map((id) => {
            const score = calcAreaScore(days, id);
            return (
              <ProgressBar
                key={id}
                label={AREAS[id].label}
                value={score}
                max={100}
                color={AREAS[id].color}
              />
            );
          })}
        </div>
      </div>

      {/* Projects */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-6">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Proyectos completados ({completedProjects.length}/{projects.length})
        </p>
        <div className="flex flex-col gap-1">
          {completedProjects.map((p) => (
            <p key={p.id} className="text-green-400 text-sm">
              ✓ {p.name}
            </p>
          ))}
          {pendingProjects.map((p) => (
            <p key={p.id} className="text-gray-600 text-sm">
              ✗ {p.name}{" "}
              {p.type === "percent" ? `(${p.progress || 0}%)` : "(pendiente)"}
            </p>
          ))}
        </div>
      </div>

      <button
        onClick={exportData}
        className="w-full bg-[#1a1a1a] text-gray-400 font-bold py-3 rounded-xl hover:bg-[#222222] transition-colors"
      >
        Exportar JSON
      </button>
    </div>
  );
}
