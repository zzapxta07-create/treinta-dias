import { useStore } from "../../store/useStore";

export default function UpsPrompt() {
  const useUps = useStore((s) => s.useUps);
  const declineUps = useStore((s) => s.declineUps);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <div className="text-6xl mb-6">⚠️</div>
      <h1 className="text-2xl font-bold text-yellow-400 mb-3">Entraste tarde</h1>
      <p className="text-gray-400 mb-2">Son más de las 8:00am.</p>
      <p className="text-gray-300 mb-8 max-w-sm">
        Tenés{" "}
        <span className="text-white font-bold">1 UPS</span> disponible para
        este mes. Si lo usás, el día sigue normal. Si no, el día queda perdido
        y se restan 150 puntos del total.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={useUps}
          className="bg-green-500 text-black font-black py-4 px-6 rounded-xl text-lg active:scale-95 transition-transform"
        >
          USAR UPS
        </button>
        <button
          onClick={declineUps}
          className="bg-[#222222] text-gray-300 font-bold py-4 px-6 rounded-xl text-lg active:scale-95 transition-transform"
        >
          NO USAR UPS
        </button>
      </div>
      <p className="text-gray-700 text-xs mt-8">
        El UPS solo puede usarse una vez en todo el mes.
      </p>
    </div>
  );
}
