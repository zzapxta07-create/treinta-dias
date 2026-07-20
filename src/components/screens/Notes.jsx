import { useState, useEffect } from 'react';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
};

const inputStyle = {
  background: '#09080e',
  color: '#f0e6d0',
  fontSize: '14px',
  borderRadius: '8px',
  border: '1px solid #2c2740',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: "'Crimson Text', serif",
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Notes() {
  const [notes,       setNotes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [adding,      setAdding]      = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [newDate,     setNewDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [newContent,  setNewContent]  = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate,    setEditDate]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/notes');
      setNotes(data.data || []);
    } catch {}
    setLoading(false);
  }

  async function handleAdd() {
    if (!newContent.trim()) { setError('Escribe algo antes de guardar.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/api/notes', { date_key: newDate, content: newContent.trim() });
      setNotes(prev => [data.data, ...prev]);
      setNewContent(''); setAdding(false);
    } catch { setError('Error al guardar.'); }
    setSaving(false);
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditDate(note.date_key.slice(0, 10));
  }

  async function handleEdit(id) {
    if (!editContent.trim()) return;
    setSaving(true); setError('');
    try {
      const { data } = await api.put(`/api/notes/${id}`, { content: editContent.trim(), date_key: editDate });
      setNotes(prev => prev.map(n => n.id === id ? data.data : n));
      setEditingId(null);
    } catch { setError('Error al guardar.'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>
      <p className="font-cinzel text-[#4d4568] text-xs tracking-widest uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">Registro</p>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em]">Notas</h1>
        <button
          onClick={() => { setAdding(a => !a); setError(''); }}
          className="font-cinzel text-[9px] tracking-widest uppercase px-3 py-1.5 rounded transition-colors"
          style={{ border: '1px solid #2c2740', color: '#4d4568' }}
          onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; e.currentTarget.style.borderColor = '#2c2740'; }}
        >
          {adding ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {adding && (
        <div className="p-4 mb-6" style={panelStyle}>
          <div className="mb-3">
            <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1 tracking-widest uppercase">Fecha</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              style={{ ...inputStyle, padding: '6px 10px' }}
              onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
              onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
            />
          </div>
          <div className="mb-3">
            <label className="font-cinzel text-[8px] text-[#4d4568] block mb-1 tracking-widest uppercase">Apunte</label>
            <textarea
              value={newContent} onChange={e => setNewContent(e.target.value)}
              rows={4} placeholder="Escribe tu nota..."
              style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
              onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
            />
          </div>
          {error && <p className="text-[#9b1f30] text-xs mb-2">{error}</p>}
          <button onClick={handleAdd} disabled={saving}
            className="font-cinzel text-[9px] tracking-widest uppercase px-4 py-1.5 rounded disabled:opacity-50 btn-primary">
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-cinzel text-[#2c2740] text-sm tracking-widest uppercase">Sin notas</p>
          <p className="text-[#2c2740] text-xs mt-2">Registra tus apuntes importantes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="p-4 group transition-all" style={panelStyle}>
              {editingId === note.id ? (
                <div>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    style={{ ...inputStyle, padding: '6px 10px', marginBottom: '8px' }}
                    onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
                    onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
                  />
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, width: '100%', padding: '10px 12px', resize: 'none', marginBottom: '8px' }}
                    onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
                    onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(note.id)} disabled={saving}
                      className="font-cinzel text-[9px] tracking-widest uppercase px-3 py-1 rounded disabled:opacity-50 btn-primary">
                      {saving ? '...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="font-cinzel text-[9px] tracking-widest uppercase text-[#4d4568] px-3 py-1 rounded"
                      style={{ border: '1px solid #2c2740' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-cinzel text-[9px] text-[#d4a956] tracking-widest uppercase">
                      {formatDate(note.date_key)}
                    </p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(note)}
                        className="text-[#4d4568] hover:text-[#d4a956] text-xs transition-colors">✎</button>
                      <button onClick={() => handleDelete(note.id)}
                        className="text-[#2c2740] hover:text-[#9b1f30] text-xs transition-colors">✕</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
                    <DiamondOrnament color="#2c2740" size={5} />
                    <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
                  </div>

                  <p className="text-[#9490aa] text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
