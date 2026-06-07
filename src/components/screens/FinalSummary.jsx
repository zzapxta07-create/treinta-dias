import { useStore } from "../../store/useStore";
import { calcTotalScore, calcAreaScore } from "../../utils/scoring";
import { AREAS, MANDATORY_AREAS } from "../../data/areas";
import ProgressBar from "../ui/ProgressBar";

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
};

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
    <div className="min-h-screen px-4 py-10 max-w-lg mx-auto" style={{ background: '#09080e' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(148,144,170,0.05) 0%, transparent 60%)' }} />

      <div className="relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ border: '1px solid #2c2740', background: '#110e1c' }}>
            <span style={{ color: pass ? '#d4a956' : '#9b1f30', fontSize: '24px' }}>
              {pass ? '⚔' : '◦'}
            </span>
          </div>
          <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
            Codex Productivitatis
          </p>
          <h1 className="font-cinzel text-3xl font-bold tracking-[0.08em] mb-1" style={{ color: '#f0e6d0' }}>
            Resumen Final
          </h1>
          <p className="text-sm" style={{ color: '#4d4568' }}>30 días completados</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
          <span style={{ color: '#4d4568', fontSize: '12px' }}>◆</span>
          <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        </div>

        {/* Verdict */}
        <div className="rounded-xl p-6 text-center mb-6"
          style={{
            background: pass
              ? 'linear-gradient(135deg, rgba(212,169,86,0.08) 0%, rgba(17,14,28,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(155,31,48,0.08) 0%, rgba(17,14,28,0.9) 100%)',
            border: `1px solid ${pass ? 'rgba(212,169,86,0.3)' : 'rgba(155,31,48,0.3)'}`,
          }}>
          <p className="font-cinzel text-xl font-bold tracking-[0.08em] mb-2"
            style={{ color: pass ? '#d4a956' : '#9b1f30' }}>
            {pass ? "LISTO PARA BOGOTÁ" : "APLAZAR Y REPLANTEAR"}
          </p>
          <p className="text-sm" style={{ color: '#9490aa' }}>
            {pass
              ? "Cumpliste los dos criterios. ¡Honor al caballero!"
              : `${totalScore < 2100 ? "Score insuficiente" : ""}${totalScore < 2100 && habitCompliance < 80 ? " · " : ""}${habitCompliance < 80 ? "Cumplimiento insuficiente" : ""}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Score total',   val: totalScore,           color: totalScore >= 2100 ? '#d4a956' : '#9b1f30',         sub: 'meta: 2100' },
            { label: 'Cumplimiento',  val: `${habitCompliance}%`, color: habitCompliance >= 80 ? '#d4a956' : '#9b1f30',     sub: 'meta: 80%' },
            { label: 'Días completos', val: completedDays,        color: '#d4a956',                                          sub: '' },
            { label: 'Días perdidos', val: lostDays,              color: lostDays > 0 ? '#9b1f30' : '#9490aa',              sub: '' },
          ].map(({ label, val, color, sub }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={panelStyle}>
              <p className="font-cinzel text-[8px] uppercase tracking-widest mb-1" style={{ color: '#4d4568' }}>{label}</p>
              <p className="font-mono text-3xl font-black" style={{ color }}>{val}</p>
              {sub && <p className="font-cinzel text-[7px] uppercase tracking-widest mt-0.5" style={{ color: '#2c2740' }}>{sub}</p>}
            </div>
          ))}
          <div className="rounded-xl p-4 col-span-2 text-center" style={panelStyle}>
            <p className="font-cinzel text-[8px] uppercase tracking-widest mb-1" style={{ color: '#4d4568' }}>Estado Emocional Promedio</p>
            <p className="font-mono text-3xl font-black" style={{ color: '#9490aa' }}>{avgEmotion}/10</p>
          </div>
        </div>

        {/* Area scores */}
        <div className="rounded-xl p-4 mb-5" style={panelStyle}>
          <p className="font-cinzel text-[8px] mb-4 uppercase tracking-[0.25em]" style={{ color: '#4d4568' }}>
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
        <div className="rounded-xl p-4 mb-6" style={panelStyle}>
          <p className="font-cinzel text-[8px] mb-4 uppercase tracking-[0.25em]" style={{ color: '#4d4568' }}>
            Empresas ({completedProjects.length}/{projects.length})
          </p>
          <div className="flex flex-col gap-1">
            {completedProjects.map((p) => (
              <p key={p.id} className="text-sm" style={{ color: '#d4a956' }}>✓ {p.name}</p>
            ))}
            {pendingProjects.map((p) => (
              <p key={p.id} className="text-sm" style={{ color: '#4d4568' }}>
                ◦ {p.name} {p.type === "percent" ? `(${p.progress || 0}%)` : "(pendiente)"}
              </p>
            ))}
          </div>
        </div>

        <button
          onClick={exportData}
          className="w-full font-cinzel text-[9px] tracking-[0.15em] uppercase font-bold py-3 rounded transition-colors"
          style={{
            background: 'rgba(255,255,255,0.02)',
            color: '#9490aa',
            border: '1px solid #2c2740',
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = 'rgba(212,169,86,0.3)';
            e.currentTarget.style.color = '#d4a956';
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = '#2c2740';
            e.currentTarget.style.color = '#9490aa';
          }}
        >
          Exportar Pergamino (JSON)
        </button>
      </div>
    </div>
  );
}
