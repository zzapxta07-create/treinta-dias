import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAreas } from '../../hooks/useAreas';
import api from '../../api/index.js';

const PRESET_COLORS = [
  '#3B82F6', '#A855F7', '#F59E0B', '#10B981', '#6B7280',
  '#EC4899', '#EF4444', '#F97316', '#14B8A6', '#8B5CF6',
  '#06B6D4', '#84CC16', '#D97706', '#6366F1', '#F43F5E',
];

const PRESET_EMOJIS = [
  '🏛','⚔','📖','🛡','◆','💼','🚀','💡','🎯','📊',
  '🧠','💪','🌙','⚡','🔥','✨','🎓','🏆','💰','🛠',
  '📝','🎮','🌱','🏋','🎨','🔬','🎸','🌐','📱','🏠',
];

const inputStyle = {
  background: '#09080e',
  color: '#f0e6d0',
  border: '1px solid #2c2740',
  borderRadius: '8px',
  padding: '10px 12px',
  outline: 'none',
  fontFamily: "'Crimson Text', serif",
  fontSize: '14px',
  transition: 'border-color 0.2s',
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function AreaCard({ area, onUpdate }) {
  const [showEmojis, setShowEmojis] = useState(false);
  const isOtros = area.id === 'OTROS';

  return (
    <div className="p-4 rounded-xl" style={{
      background: `linear-gradient(135deg, ${hexToRgba(area.color, 0.06)} 0%, #110e1c 100%)`,
      border: '1px solid #2c2740',
      borderLeftWidth: 3,
      borderLeftColor: area.color,
      borderRadius: '12px',
    }}>
      <div className="flex gap-2 items-center mb-3">
        <button
          onClick={() => setShowEmojis(v => !v)}
          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl transition-all"
          style={{
            background: hexToRgba(area.color, 0.12),
            border: `1px solid ${hexToRgba(area.color, 0.3)}`,
          }}
        >
          {area.emoji}
        </button>
        <input
          value={area.label}
          onChange={e => onUpdate('label', e.target.value)}
          placeholder="Nombre del área..."
          style={{ ...inputStyle, flex: 1 }}
          onFocus={e => { e.target.style.borderColor = area.color; }}
          onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
        />
        {!isOtros && (
          <div className="flex-shrink-0 text-center" style={{ minWidth: 52 }}>
            <input
              type="number"
              min="0"
              max="1440"
              value={area.min_minutes}
              onChange={e => onUpdate('min_minutes', parseInt(e.target.value) || 0)}
              style={{ ...inputStyle, width: 52, padding: '10px 8px', textAlign: 'center' }}
              onFocus={e => { e.target.style.borderColor = area.color; }}
              onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
            />
            <p className="font-cinzel text-[7px] tracking-widest mt-0.5" style={{ color: '#4d4568' }}>MIN/DÍA</p>
          </div>
        )}
      </div>

      {showEmojis && (
        <div className="mb-3 p-2 rounded-lg" style={{ background: '#09080e', border: '1px solid #2c2740' }}>
          <div className="flex flex-wrap gap-1">
            {PRESET_EMOJIS.map(em => (
              <button
                key={em}
                onClick={() => { onUpdate('emoji', em); setShowEmojis(false); }}
                className="w-8 h-8 rounded text-lg flex items-center justify-center transition-all"
                style={{
                  background: area.emoji === em ? hexToRgba(area.color, 0.2) : 'transparent',
                  border: area.emoji === em ? `1px solid ${hexToRgba(area.color, 0.5)}` : '1px solid transparent',
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onUpdate('color', c)}
            className="rounded-full transition-all"
            style={{
              width: 18, height: 18,
              background: c,
              outline: area.color === c ? `2px solid ${c}` : 'none',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Config() {
  const setAreas  = useStore(s => s.setAreas);
  const rawAreas  = useAreas();
  const [local,   setLocal]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const areas = local ?? rawAreas;

  function updateArea(id, field, value) {
    setSaved(false);
    setLocal(prev => (prev ?? rawAreas).map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  async function handleSave() {
    if (!areas) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/api/areas', { areas });
      setAreas(data.data);
      setLocal(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (!areas) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09080e' }}>
        <p className="font-cinzel text-[#4d4568] text-xs tracking-[0.3em]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ background: '#09080e' }}>
      <div className="mb-8">
        <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
          Vigilia · Configuración
        </p>
        <h1 className="font-cinzel text-2xl font-bold" style={{ color: '#f0e6d0' }}>Áreas de Vida</h1>
        <p className="text-sm mt-2" style={{ color: '#9490aa' }}>
          Personaliza nombre, color, emoji y minutos mínimos diarios de cada área
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {areas.map(area => (
          <AreaCard
            key={area.id}
            area={area}
            onUpdate={(field, value) => updateArea(area.id, field, value)}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm mb-4 text-center" style={{ color: '#9b1f30' }}>{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !local}
        className="w-full py-3 rounded-xl font-cinzel text-[12px] tracking-[0.15em] uppercase font-bold transition-all disabled:opacity-40"
        style={{
          background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, rgba(212,169,86,0.15) 0%, rgba(212,169,86,0.05) 100%)',
          border: saved ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(212,169,86,0.3)',
          color: saved ? '#10B981' : '#d4a956',
        }}
      >
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  );
}
