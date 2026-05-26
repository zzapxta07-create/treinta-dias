import { useStore } from "../../store/useStore";
import { calcTotalScore, calcAreaScore } from "../../utils/scoring";
import { AREAS, MANDATORY_AREAS } from "../../data/areas";
import ProgressBar from "../ui/ProgressBar";

export default function FinalSummary() {
  const days     = useStore((s) => s.days);
  const projects = useStore((s) => s.projects);

  const totalScore      = Math.max(0, calcTotalScore(days));
  const completedDays   = Object.values(days).filter((d) => d.status === "complete").length;
  const lostDays        = Object.values(days).filter((d) => d.status === "lost").length;
  const habitCompliance = Math.round((completedDays / 30) * 100);

  const pass = totalScore >= 2100 && habitCompliance >= 80;

  const withEmotion = Object.values(days).filter((d) => d.emotionalState);
  const avgEmotion  = withEmotion.length > 0
    ? (withEmotion.reduce((acc, d) => acc + d.emotionalState, 0) / withEmotion.length).toFixed(1)
    : "—";

  const completedProjects = projects.filter((p) => (p.progress || 0) >= 100 || p.done);
  const pendingProjects   = projects.filter((p) => (p.progress || 0) < 100 && !p.done);

  function exportData() {
    const data = {
      totalScore, habitCompliance,
      verdict: pass ? "LISTO PARA BOGOTÁ" : "APLAZAR Y REPLANTEAR",
      completedDays, lostDays, avgEmotion,
      projects: projects.map((p) => ({ name: p.name, area: p.area, progress: p.progress, done: p.done })),
      days: Object.values(days).map((d) => ({
        dateKey: d.dateKey, score: d.score, status: d.status,
        emotionalState: d.emotionalState, penalties: d.penalties,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "codex-resumen.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-lg mx-auto">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />

      <div className="relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#3a2e22] bg-[#110d0a] mb-4">
            <span className={`text-2xl ${pass ? 'text-[#c9a254]' : 'text-[#8b1a2a]'}`}>
              {pass ? '⚔' : '◦'}
            </span>
          </div>
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.4em] uppercase mb-2">
            Codex Productivitatis
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-[#f0e6d0] tracking-[0.08em] mb-1">
            Resumen Final
          </h1>
          <p className="text-[#5a4838] text-sm">30 días completados</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#3a2e22]" />
          <span className="text-[#5a4838] text-xs">◆</span>
          <div className="flex-1 h-px bg-[#3a2e22]" />
        </div>

        {/* Verdict */}
        <div className={`rounded-lg p-6 text-center mb-6 border ${
          pass
            ? 'bg-[#c9a254]/10 border-[#c9a254]/30'
            : 'bg-[#8b1a2a]/10 border-[#8b1a2a]/30'
        }`}>
          <p className={`font-cinzel text-xl font-bold tracking-[0.08em] mb-2 ${pass ? 'text-[#c9a254]' : 'text-[#8b1a2a]'}`}>
            {pass ? "LISTO PARA BOGOTÁ" : "APLAZAR Y REPLANTEAR"}
          </p>
          <p className="text-[#9a8470] text-sm">
            {pass
              ? "Cumpliste los dos criterios. ¡Honor al caballero!"
              : `${totalScore < 2100 ? "Score insuficiente" : ""}${totalScore < 2100 && habitCompliance < 80 ? " · " : ""}${habitCompliance < 80 ? "Cumplimiento insuficiente" : ""}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Score total',           val: totalScore,      suffix: '',   sub: 'meta: 2100',  color: totalScore >= 2100 ? '#c9a254' : '#8b1a2a' },
            { label: 'Cumplimiento',           val: `${habitCompliance}%`, suffix: '', sub: 'meta: 80%', color: habitCompliance >= 80 ? '#c9a254' : '#8b1a2a' },
            { label: 'Días completos',         val: completedDays,   suffix: '',   sub: '',            color: '#c9a254' },
            { label: 'Días perdidos',          val: lostDays,        suffix: '',   sub: '',            color: lostDays > 0 ? '#8b1a2a' : '#9a8470' },
          ].map(({ label, val, sub, color }) => (
            <div key={label} className="bg-[#110d0a] rounded-lg p-4 text-center border border-[#3a2e22]">
              <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-widest mb-1">{label}</p>
              <p className="font-mono text-3xl font-black" style={{ color }}>{val}</p>
              {sub && <p className="font-cinzel text-[7px] text-[#3a2e22] uppercase tracking-widest mt-0.5">{sub}</p>}
            </div>
          ))}
          <div className="bg-[#110d0a] rounded-lg p-4 col-span-2 text-center border border-[#3a2e22]">
            <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-widest mb-1">Estado Emocional Promedio</p>
            <p className="font-mono text-3xl font-black text-[#9a8470]">{avgEmotion}/10</p>
          </div>
        </div>

        {/* Area scores */}
        <div className="bg-[#110d0a] rounded-lg p-4 mb-5 border border-[#3a2e22]">
          <p className="font-cinzel text-[8px] text-[#5a4838] mb-4 uppercase tracking-[0.25em]">
            Score por Área
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
        <div className="bg-[#110d0a] rounded-lg p-4 mb-6 border border-[#3a2e22]">
          <p className="font-cinzel text-[8px] text-[#5a4838] mb-4 uppercase tracking-[0.25em]">
            Empresas ({completedProjects.length}/{projects.length})
          </p>
          <div className="flex flex-col gap-1">
            {completedProjects.map((p) => (
              <p key={p.id} className="text-[#c9a254] text-sm">✓ {p.name}</p>
            ))}
            {pendingProjects.map((p) => (
              <p key={p.id} className="text-[#5a4838] text-sm">
                ◦ {p.name} {p.type === "percent" ? `(${p.progress || 0}%)` : "(pendiente)"}
              </p>
            ))}
          </div>
        </div>

        <button
          onClick={exportData}
          className="w-full font-cinzel text-[9px] tracking-[0.15em] uppercase bg-[#110d0a] text-[#9a8470] border border-[#3a2e22] font-bold py-3 rounded hover:border-[#c9a254]/30 hover:text-[#c9a254] transition-colors"
        >
          Exportar Pergamino (JSON)
        </button>
      </div>
    </div>
  );
}
