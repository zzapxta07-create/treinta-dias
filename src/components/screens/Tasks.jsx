import { useState, useEffect } from 'react';
import api from '../../api/index.js';

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
    try {
      await api.delete(`/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {}
  }

  const pending   = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0806]">
      <p className="font-cinzel text-[#5a4838] text-xs tracking-widest uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-1">Planificación</p>
      <h1 className="font-cinzel text-xl font-bold text-[#f0e6d0] tracking-[0.06em] mb-5">Tareas</h1>

      {/* Formulario de nueva tarea */}
      <form onSubmit={handleAdd} className="bg-[#110d0a] border border-[#3a2e22] rounded-lg p-4 mb-6">
        <div className="flex gap-2 mb-2">
          <input
            value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1 bg-[#0a0806] border border-[#3a2e22] text-[#f0e6d0] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#c9a254] placeholder-[#3a2e22] transition-colors"
          />
          <button type="submit" disabled={saving || !newTitle.trim()}
            className="font-cinzel text-[9px] tracking-widest uppercase bg-[#c9a254] text-[#0a0806] px-4 py-2 rounded disabled:opacity-40 transition-opacity shrink-0">
            {saving ? '...' : 'Añadir'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-cinzel text-[8px] text-[#5a4838] tracking-widest uppercase shrink-0">Para el</label>
          <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
            className="bg-[#0a0806] border border-[#3a2e22] text-[#9a8470] text-xs rounded px-2 py-1 focus:outline-none focus:border-[#c9a254] transition-colors" />
        </div>
      </form>

      {/* Pendientes */}
      {pending.length === 0 && completed.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-cinzel text-[#3a2e22] text-sm tracking-widest uppercase">Sin tareas</p>
          <p className="text-[#3a2e22] text-xs mt-2">Añade tu primera tarea arriba</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-[#3a2e22]" />
                <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.25em]">
                  Pendientes · {pending.length}
                </p>
                <div className="flex-1 h-px bg-[#3a2e22]" />
              </div>
              <div className="space-y-2">
                {pending.map(task => <TaskRow key={task.id} task={task} onToggle={toggleComplete} onDelete={handleDelete} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-[#3a2e22]" />
                <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.25em]">
                  Completadas · {completed.length}
                </p>
                <div className="flex-1 h-px bg-[#3a2e22]" />
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
    <div className={`flex items-start gap-3 bg-[#110d0a] border rounded-lg px-4 py-3 group transition-colors ${
      task.completed ? 'border-[#2a2a20] opacity-50' : 'border-[#3a2e22]'
    }`}>
      <button
        onClick={() => onToggle(task)}
        className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-[#c9a254] border-[#c9a254]'
            : 'border-[#5a4838] hover:border-[#c9a254]'
        }`}
      >
        {task.completed && <span className="text-[#0a0806] text-[10px] font-black leading-none">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${task.completed ? 'line-through text-[#5a4838]' : 'text-[#f0e6d0]'}`}>
          {task.title}
        </p>
        {due && (
          <p className={`font-cinzel text-[9px] tracking-wide uppercase mt-0.5 ${
            due.overdue && !task.completed ? 'text-[#8b1a2a]' : 'text-[#5a4838]'
          }`}>
            {due.overdue && !task.completed ? '⚠ ' : ''}{due.label}
          </p>
        )}
      </div>
      <button onClick={() => onDelete(task.id)}
        className="text-[#3a2e22] hover:text-[#8b1a2a] text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
        ✕
      </button>
    </div>
  );
}
