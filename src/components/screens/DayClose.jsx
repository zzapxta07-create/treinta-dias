import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import PhotoUpload from '../ui/PhotoUpload';
import api from '../../api/index.js';

const EMOTION_LABELS = {
  1:'Muy mal',2:'Mal',3:'Mal',4:'Regular',5:'Regular',
  6:'Bien',7:'Bien',8:'Muy bien',9:'Excelente',10:'Excelente',
};

export default function DayClose() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);

  const [projects,      setProjects]      = useState([]);
  const [photo,         setPhoto]         = useState(null);
  const [emotionalState, setEmotionalState] = useState(5);
  const [projectProgress, setProjectProgress] = useState({});
  const [binaryDone,    setBinaryDone]    = useState({});
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    api.get('/api/projects').then((r) => {
      const projs = r.data.data;
      setProjects(projs);
      setProjectProgress(Object.fromEntries(
        projs.filter((p) => p.type === 'percent').map((p) => [p.id, p.progress || 0])
      ));
      setBinaryDone(Object.fromEntries(
        projs.filter((p) => p.type === 'binary').map((p) => [p.id, p.done || false])
      ));
    }).catch(() => {});
  }, []);

  // If today is different from stored day → init new day
  useEffect(() => {
    if (!currentDay) return;
    const today = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    if (currentDay.date_key < today) {
      api.get('/api/days/today').then((r) => setCurrentDay(r.data.data)).catch(() => {});
    }
  }, [currentDay?.date_key]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleClose() {
    if (!photo) return;
    setSaving(true);
    const merged = { ...projectProgress };
    projects.filter((p) => p.type === 'binary').forEach((p) => {
      merged[p.id] = binaryDone[p.id] ? 100 : p.progress || 0;
    });
    try {
      const { data } = await api.put(`/api/days/${currentDay.date_key}/close`, {
        emotional_state:   emotionalState,
        close_photo_path:  photo,
        project_progress:  merged,
      });
      setCurrentDay(data.data);
    } finally {
      setSaving(false);
    }
  }

  const percentProjects = projects.filter((p) => p.type === 'percent');
  const binaryProjects  = projects.filter((p) => p.type === 'binary');

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto pb-28">
      <h1 className="text-xl font-black mb-1">Cierre del día</h1>
      <p className="text-[#6B7280] text-sm mb-6">Registrá el cierre antes de dormir.</p>

      {/* PC photo */}
      <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
        <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wider">Foto del PC apagado</p>
        <div className="flex justify-center">
          <PhotoUpload value={photo} onChange={setPhoto} label="Foto del PC apagado" />
        </div>
      </div>

      {/* Emotional state */}
      <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
        <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wider">Estado emocional</p>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-4xl font-black text-white font-mono">{emotionalState}</span>
          <span className="text-[#6B7280] text-lg">{EMOTION_LABELS[emotionalState]}</span>
        </div>
        <input
          type="range" min={1} max={10} value={emotionalState}
          onChange={(e) => setEmotionalState(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-[#374151] mt-1">
          <span>Muy mal</span><span>Excelente</span>
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
          <p className="text-xs text-[#6B7280] mb-4 uppercase tracking-wider">Progreso de proyectos</p>
          <div className="flex flex-col gap-5">
            {percentProjects.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#F0F0F0] truncate mr-2 max-w-[80%]">{p.name}</span>
                  <span className="text-white font-mono font-bold shrink-0">{projectProgress[p.id] || 0}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={projectProgress[p.id] || 0}
                  onChange={(e) => setProjectProgress((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            ))}
            {binaryProjects.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-[#F0F0F0] text-sm max-w-[70%]">{p.name}</span>
                <button
                  onClick={() => setBinaryDone((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    binaryDone[p.id] ? 'bg-green-600 text-white' : 'bg-[#222222] text-[#6B7280]'
                  }`}
                >
                  {binaryDone[p.id] ? '✓ Realizada' : 'Pendiente'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 md:left-60 p-4 bg-[#080808] border-t border-[#2C2C2C]">
        <button
          onClick={handleClose}
          disabled={!photo || saving}
          className="w-full max-w-lg mx-auto block bg-white text-black font-black py-4 rounded-xl text-xl active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
        >
          {saving ? 'Cerrando...' : 'CERRAR DÍA'}
        </button>
      </div>
    </div>
  );
}
