import { useState, useEffect } from 'react';
import api from '../../api/index.js';

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-[#3a2e22]" />
      <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.25em] shrink-0">{children}</p>
      <div className="flex-1 h-px bg-[#3a2e22]" />
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Notes() {
  const [notes,      setNotes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [adding,     setAdding]     = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [newDate,    setNewDate]    = useState(() => new Date().toISOString().slice(0, 10));
  const [newContent, setNewContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate,    setEditDate]    = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

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
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0806]">
      <p className="font-cinzel text-[#5a4838] text-xs tracking-widest uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-1">Registro</p>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em]">Notas</h1>
        <button
          onClick={() => { setAdding(a => !a); setError(''); }}
          className="font-cinzel text-[9px] tracking-widest uppercase px-3 py-1.5 border border-[#3a2e22] text-[#5a4838] hover:text-[#c9a254] hover:border-[#c9a254]/40 rounded transition-colors"
        >
          {adding ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {adding && (
        <div className="bg-[#110d0a] border border-[#3a2e22] rounded-lg p-4 mb-6">
          <div className="mb-3">
            <label className="font-cinzel text-[8px] text-[#5a4838] block mb-1 tracking-widest uppercase">Fecha</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="bg-[#0a0806] border border-[#3a2e22] text-[#f0e6d0] text-sm rounded px-2 py-1.5 focus:outline-none focus:border-[#c9a254] transition-colors" />
          </div>
          <div className="mb-3">
            <label className="font-cinzel text-[8px] text-[#5a4838] block mb-1 tracking-widest uppercase">Apunte</label>
            <textarea
              value={newContent} onChange={e => setNewContent(e.target.value)}
              rows={4} placeholder="Escribe tu nota..."
              className="w-full bg-[#0a0806] border border-[#3a2e22] text-[#f0e6d0] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#c9a254] resize-none placeholder-[#3a2e22] transition-colors"
            />
          </div>
          {error && <p className="text-[#8b1a2a] text-xs mb-2">{error}</p>}
          <button onClick={handleAdd} disabled={saving}
            className="font-cinzel text-[9px] tracking-widest uppercase bg-[#c9a254] text-[#0a0806] px-4 py-1.5 rounded disabled:opacity-50">
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-cinzel text-[#3a2e22] text-sm tracking-widest uppercase">Sin notas</p>
          <p className="text-[#3a2e22] text-xs mt-2">Registra tus apuntes importantes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-[#110d0a] border border-[#3a2e22] rounded-lg p-4 group">
              {editingId === note.id ? (
                <div>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    className="bg-[#0a0806] border border-[#3a2e22] text-[#f0e6d0] text-sm rounded px-2 py-1 mb-2 focus:outline-none focus:border-[#c9a254] transition-colors" />
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0a0806] border border-[#3a2e22] text-[#f0e6d0] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#c9a254] resize-none transition-colors mb-2" />
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(note.id)} disabled={saving}
                      className="font-cinzel text-[9px] tracking-widest uppercase bg-[#c9a254] text-[#0a0806] px-3 py-1 rounded disabled:opacity-50">
                      {saving ? '...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="font-cinzel text-[9px] tracking-widest uppercase text-[#5a4838] border border-[#3a2e22] px-3 py-1 rounded">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-cinzel text-[9px] text-[#c9a254] tracking-widest uppercase">
                      {formatDate(note.date_key)}
                    </p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(note)}
                        className="text-[#5a4838] hover:text-[#c9a254] text-xs transition-colors">✎</button>
                      <button onClick={() => handleDelete(note.id)}
                        className="text-[#3a2e22] hover:text-[#8b1a2a] text-xs transition-colors">✕</button>
                    </div>
                  </div>
                  <p className="text-[#9a8470] text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
