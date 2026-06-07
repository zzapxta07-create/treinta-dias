import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import PhotoUpload from '../ui/PhotoUpload';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const EMOTION_LABELS = {
  1:'Muy mal',2:'Mal',3:'Mal',4:'Regular',5:'Regular',
  6:'Bien',7:'Bien',8:'Muy bien',9:'Excelente',10:'Excelente',
};

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,169,86,0.04)',
};

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      <DiamondOrnament color="#4d4568" size={6} />
      <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em] shrink-0">{children}</p>
      <DiamondOrnament color="#4d4568" size={6} />
      <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
    </div>
  );
}

export default function DayClose() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);

  const [projects,        setProjects]        = useState([]);
  const [photo,           setPhoto]           = useState(null);
  const [emotionalState,  setEmotionalState]  = useState(5);
  const [projectProgress, setProjectProgress] = useState({});
  const [binaryDone,      setBinaryDone]      = useState({});
  const [closeSummary,    setCloseSummary]    = useState('');
  const [saving,          setSaving]          = useState(false);

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
        emotional_state:  emotionalState,
        close_photo_path: photo,
        project_progress: merged,
        close_summary:    closeSummary.trim() || null,
      });
      setCurrentDay(data.data);
    } finally {
      setSaving(false);
    }
  }

  const percentProjects = projects.filter((p) => p.type === 'percent');
  const binaryProjects  = projects.filter((p) => p.type === 'binary');

  const emotionColor = emotionalState >= 8 ? '#d4a956' : emotionalState >= 5 ? '#9490aa' : '#9b1f30';

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto pb-28">
      {/* Header */}
      <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">
        Crepúsculo
      </p>
      <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em] mb-1"
        style={{ textShadow: '0 0 30px rgba(212,169,86,0.08)' }}>
        Cierre del Día
      </h1>
      <p className="text-[#4d4568] text-sm mb-6">Registra el cierre antes de que caiga la noche.</p>

      {/* PC photo */}
      <div className="p-4 mb-4" style={panelStyle}>
        <SectionTitle>Prueba del Retiro</SectionTitle>
        <div className="flex justify-center">
          <PhotoUpload value={photo} onChange={setPhoto} label="Foto del PC apagado" />
        </div>
      </div>

      {/* Emotional state */}
      <div className="p-4 mb-4" style={panelStyle}>
        <SectionTitle>Estado del Espíritu</SectionTitle>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-mono text-4xl font-black"
            style={{ color: emotionColor, textShadow: `0 0 20px ${emotionColor}40` }}>
            {emotionalState}
          </span>
          <span className="text-[#9490aa] text-lg">{EMOTION_LABELS[emotionalState]}</span>
        </div>
        <input
          type="range" min={1} max={10} value={emotionalState}
          onChange={(e) => setEmotionalState(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between font-cinzel text-[8px] text-[#2c2740] mt-1 tracking-widest uppercase">
          <span>Muy mal</span><span>Excelente</span>
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="p-4 mb-4" style={panelStyle}>
          <SectionTitle>Progreso de Empresas</SectionTitle>
          <div className="flex flex-col gap-5">
            {percentProjects.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#f0e6d0] truncate mr-2 max-w-[80%]">{p.name}</span>
                  <span className="font-mono text-[#d4a956] font-bold shrink-0">
                    {projectProgress[p.id] || 0}%
                  </span>
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
                <span className="text-[#f0e6d0] text-sm max-w-[70%]">{p.name}</span>
                <button
                  onClick={() => setBinaryDone((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                  className="shrink-0 font-cinzel text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded transition-colors"
                  style={binaryDone[p.id]
                    ? { background: '#d4a956', color: '#09080e' }
                    : { background: 'rgba(255,255,255,0.03)', color: '#9490aa', border: '1px solid #2c2740' }
                  }
                >
                  {binaryDone[p.id] ? '✓ Realizada' : 'Pendiente'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close summary */}
      <div className="p-4 mb-4" style={panelStyle}>
        <SectionTitle>Crónica del Día</SectionTitle>
        <p className="text-[#4d4568] text-xs mb-3">
          Escribe qué lograste hoy, qué aprendiste o qué harías diferente.
        </p>
        <textarea
          value={closeSummary}
          onChange={(e) => setCloseSummary(e.target.value)}
          rows={4}
          placeholder="Hoy logré..."
          style={{
            width: '100%',
            background: '#09080e',
            color: '#f0e6d0',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '10px 12px',
            border: '1px solid #2c2740',
            outline: 'none',
            resize: 'none',
            fontFamily: "'Crimson Text', serif",
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
          onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-60 p-4 border-t border-[#2c2740]"
        style={{ background: 'rgba(9,8,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={handleClose}
          disabled={!photo || saving}
          className="w-full max-w-lg mx-auto block btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {saving ? 'Cerrando...' : 'Cerrar el Día →'}
        </button>
      </div>
    </div>
  );
}
