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

function formatDue(dateStr) {
  if (!dateStr) return null;
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(dateStr + 'T12:00:00Z');
  const label = d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const overdue = dateStr < today;
  return { label, overdue };
}

export default function Tasks() {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDue,   setNewDue]   = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/tasks');
      setTasks(data.data || []);
    } catch {}
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/api/tasks', { title: newTitle.trim(), due_date: newDue || null });
      setTasks(prev => [data.data, ...prev]);
      setNewTitle(''); setNewDue('');
    } catch {}
    setSaving(false);
  }

  async function toggleComplete(task) {
    try {
      const { data } = await api.put(`/api/tasks/${task.id}`, { completed: !task.completed });
      setTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? data.data : t);
        return [...updated].sort((a, b) => a.completed - b.completed);
      });
    } catch {}
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {}
  }

  const pending   = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>
      <p className="font-cinzel text-[#4d4568] text-xs tracking-widest uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">Planificación</p>
      <h1 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em] mb-5">Tareas</h1>

      {/* New task form */}
      <form onSubmit={handleAdd} className="p-4 mb-6" style={panelStyle}>
        <div className="flex gap-2 mb-2">
          <input
            value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Nueva tarea..."
            style={{ ...inputStyle, flex: 1, padding: '10px 12px' }}
            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
          <button type="submit" disabled={saving || !newTitle.trim()}
            className="font-cinzel text-[9px] tracking-widest uppercase px-4 py-2 rounded disabled:opacity-40 shrink-0"
            style={{ background: '#d4a956', color: '#09080e' }}>
            {saving ? '...' : 'Añadir'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-cinzel text-[8px] text-[#4d4568] tracking-widest uppercase shrink-0">Para el</label>
          <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
            style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px', color: '#9490aa' }}
            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
        </div>
      </form>

      {pending.length === 0 && completed.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-cinzel text-[#2c2740] text-sm tracking-widest uppercase">Sin tareas</p>
          <p className="text-[#2c2740] text-xs mt-2">Añade tu primera tarea arriba</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
                <DiamondOrnament color="#4d4568" size={6} />
                <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em]">
                  Pendientes · {pending.length}
                </p>
                <DiamondOrnament color="#4d4568" size={6} />
                <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
              </div>
              <div className="space-y-2">
                {pending.map(task => <TaskRow key={task.id} task={task} onToggle={toggleComplete} onDelete={handleDelete} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
                <DiamondOrnament color="#4d4568" size={6} />
                <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em]">
                  Completadas · {completed.length}
                </p>
                <DiamondOrnament color="#4d4568" size={6} />
                <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
              </div>
              <div className="space-y-2">
                {completed.map(task => <TaskRow key={task.id} task={task} onToggle={toggleComplete} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  const due = formatDue(task.due_date);

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl group transition-all"
      style={{
        background: task.completed
          ? 'rgba(255,255,255,0.02)'
          : 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
        border: task.completed ? '1px solid #1e1b2e' : '1px solid #2c2740',
        opacity: task.completed ? 0.55 : 1,
      }}>
      <button
        onClick={() => onToggle(task)}
        className="w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors"
        style={task.completed
          ? { background: '#d4a956', borderColor: '#d4a956' }
          : { background: 'transparent', borderColor: '#4d4568' }
        }
        onMouseOver={e => { if (!task.completed) e.currentTarget.style.borderColor = '#d4a956'; }}
        onMouseOut={e => { if (!task.completed) e.currentTarget.style.borderColor = '#4d4568'; }}
      >
        {task.completed && <span className="text-[#09080e] text-[10px] font-black leading-none">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug"
          style={{ color: task.completed ? '#4d4568' : '#f0e6d0', textDecoration: task.completed ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        {due && (
          <p className="font-cinzel text-[9px] tracking-wide uppercase mt-0.5"
            style={{ color: due.overdue && !task.completed ? '#9b1f30' : '#4d4568' }}>
            {due.overdue && !task.completed ? '⚠ ' : ''}{due.label}
          </p>
        )}
      </div>
      <button onClick={() => onDelete(task.id)}
        className="text-[#2c2740] hover:text-[#9b1f30] text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
        ✕
      </button>
    </div>
  );
}
