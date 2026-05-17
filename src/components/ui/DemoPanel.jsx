import { useState } from "react";
import { useStore } from "../../store/useStore";
import { saveToCloud } from "../../lib/cloudSync";

const PHASES = [
  { id: "yesterday", label: "Resumen ayer" },
  { id: "planner", label: "Planificador" },
  { id: "shower", label: "Ducha" },
  { id: "dashboard", label: "Dashboard" },
  { id: "evidence", label: "Evidencia" },
  { id: "close", label: "Cierre" },
  { id: "ups_prompt", label: "UPS prompt" },
  { id: "day_lost", label: "Día perdido" },
  { id: "history", label: "Historial" },
  { id: "final", label: "Resumen final" },
];

const DEMO_BLOCKS = [
  { id: "d1", area: "NEGOCIO", projectId: "clinica", startMinutes: 420, endMinutes: 720, startTime: "07:00", endTime: "12:00" },
  { id: "d2", area: "SEGUNDA", projectId: "web", startMinutes: 720, endMinutes: 780, startTime: "12:00", endTime: "13:00" },
  { id: "d3", area: "EJERCICIO", projectId: "dominadas", startMinutes: 780, endMinutes: 840, startTime: "13:00", endTime: "14:00" },
  { id: "d4", area: "ESTUDIO", projectId: "hessen", startMinutes: 840, endMinutes: 1020, startTime: "14:00", endTime: "17:00" },
  { id: "d5", area: "OTROS", projectId: "", startMinutes: 1020, endMinutes: 1080, startTime: "17:00", endTime: "18:00" },
];

const DEMO_PHOTO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iIzFhMWExYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjNDQ0Ij7wn5KNPC90ZXh0Pjwvc3ZnPg==";

export default function DemoPanel() {
  const [open, setOpen] = useState(false);
  const setPhase = useStore((s) => s.setPhase);
  const setBlocks = useStore((s) => s.setBlocks);
  const confirmPlanning = useStore((s) => s.confirmPlanning);
  const completeShower = useStore((s) => s.completeShower);
  const startEvidenceTimer = useStore((s) => s.startEvidenceTimer);
  const submitEvidence = useStore((s) => s.submitEvidence);
  const phase = useStore((s) => s.currentDay.phase);
  const blocks = useStore((s) => s.currentDay.blocks);
  const evidenceTimer = useStore((s) => s.currentDay.evidenceTimer);

  function goTo(targetPhase) {
    // Pre-fill data needed for each screen
    if (targetPhase === "shower") {
      if (blocks.length === 0) setBlocks(DEMO_BLOCKS);
      // Short timer: 90 seconds
      useStore.setState((s) => ({
        currentDay: {
          ...s.currentDay,
          blocks: s.currentDay.blocks.length > 0 ? s.currentDay.blocks : DEMO_BLOCKS,
          phase: "shower",
          showerTimer: { deadline: Date.now() + 90_000 },
          enteredOnTime: true,
        },
      }));
      return;
    }
    if (targetPhase === "dashboard") {
      useStore.setState((s) => ({
        currentDay: {
          ...s.currentDay,
          blocks: s.currentDay.blocks.length > 0 ? s.currentDay.blocks : DEMO_BLOCKS,
          showerComplete: true,
          showerPhoto: DEMO_PHOTO,
          dailyPhrase: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
          showerTimer: null,
          enteredOnTime: true,
          phase: "dashboard",
        },
      }));
      return;
    }
    if (targetPhase === "evidence") {
      // Ensure blocks exist + open evidence timer for block d1, slot 1
      const activeBlocks = blocks.length > 0 ? blocks : DEMO_BLOCKS;
      useStore.setState((s) => ({
        currentDay: {
          ...s.currentDay,
          blocks: activeBlocks,
          showerComplete: true,
          showerPhoto: DEMO_PHOTO,
          dailyPhrase: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
          enteredOnTime: true,
          phase: "evidence",
          // Short timer: 60 seconds
          evidenceTimer: { deadline: Date.now() + 60_000, blockId: activeBlocks[0].id, slotIndex: 1 },
        },
      }));
      return;
    }
    if (targetPhase === "close") {
      useStore.setState((s) => ({
        currentDay: {
          ...s.currentDay,
          blocks: s.currentDay.blocks.length > 0 ? s.currentDay.blocks : DEMO_BLOCKS,
          showerComplete: true,
          showerPhoto: DEMO_PHOTO,
          dailyPhrase: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
          enteredOnTime: true,
          phase: "close",
        },
      }));
      return;
    }
    if (targetPhase === "planner") {
      useStore.setState((s) => ({
        currentDay: { ...s.currentDay, enteredOnTime: true, phase: "planner" },
      }));
      return;
    }
    setPhase(targetPhase);
  }

  function prefillBlocks() {
    setBlocks(DEMO_BLOCKS);
  }

  function skipShowerTimer() {
    useStore.setState((s) => ({
      currentDay: {
        ...s.currentDay,
        showerTimer: { deadline: Date.now() + 5_000 },
      },
    }));
  }

  function skipEvidenceTimer() {
    useStore.setState((s) => ({
      currentDay: {
        ...s.currentDay,
        evidenceTimer: s.currentDay.evidenceTimer
          ? { ...s.currentDay.evidenceTimer, deadline: Date.now() + 5_000 }
          : s.currentDay.evidenceTimer,
      },
    }));
  }

  async function resetAll() {
    if (!confirm("¿Resetear todo el estado? Se borrará todo el progreso y empezará desde cero.")) return;

    // Borra localStorage (incluyendo cualquier bloqueo previo)
    localStorage.removeItem("treinta-dias-store");
    localStorage.removeItem("treinta-dias-reset-unlock");

    // Borra Supabase
    await saveToCloud({
      monthStart: null,
      dayNumber: 1,
      ups: { total: 1, used: false },
      specialDays: { total: 4, usedDays: [] },
      replanDays: { total: 5, usedDays: [] },
      projects: [],
      days: {},
      currentDay: {},
    });

    window.location.reload();
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {open && (
        <div className="bg-[#111111] border border-[#333333] rounded-2xl p-4 mb-3 w-64 shadow-2xl">
          <p className="text-yellow-400 text-xs font-black uppercase tracking-wider mb-3">
            🛠 Demo Panel
          </p>

          <p className="text-gray-600 text-xs mb-2 uppercase tracking-wider">Ir a pantalla</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => { goTo(p.id); setOpen(false); }}
                className={`text-xs px-2 py-1.5 rounded-lg text-left transition-colors ${
                  phase === p.id
                    ? "bg-yellow-500 text-black font-bold"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-gray-600 text-xs mb-2 uppercase tracking-wider">Acciones</p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={prefillBlocks}
              className="text-xs bg-[#1a1a1a] hover:bg-[#222222] text-gray-400 px-3 py-1.5 rounded-lg text-left transition-colors"
            >
              Prellenar 5 bloques demo
            </button>
            <button
              onClick={skipShowerTimer}
              className="text-xs bg-[#1a1a1a] hover:bg-[#222222] text-gray-400 px-3 py-1.5 rounded-lg text-left transition-colors"
            >
              Timer ducha → 5 seg
            </button>
            <button
              onClick={skipEvidenceTimer}
              className="text-xs bg-[#1a1a1a] hover:bg-[#222222] text-gray-400 px-3 py-1.5 rounded-lg text-left transition-colors"
            >
              Timer evidencia → 5 seg
            </button>
            <button
              onClick={resetAll}
              className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded-lg text-left transition-colors mt-1"
            >
              Reset completo
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-yellow-500 text-black font-black text-sm px-4 py-2.5 rounded-xl shadow-lg active:scale-95 transition-transform"
      >
        {open ? "✕ Cerrar" : "🛠 Demo"}
      </button>
    </div>
  );
}
