import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../../store/useStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { useActiveBlock } from '../../hooks/useActiveBlock';
import { calcDayScore, areaMinutesFromBlocks } from '../../utils/scoring';
import { formatTime, minutesToLabel, minutesToTime, timeToMinutes } from '../../utils/dateUtils';
import { useAreas, useAreaMap } from '../../hooks/useAreas';
import ScoreRing from '../ui/ScoreRing';
import EvidenceInline, { EvidenceForm, NotificationBadge } from '../ui/EvidenceInline';
import AiChat from '../ui/AiChat';
import { SectionTitle, DiamondOrnament } from '../ui/Ornaments';
import api from '../../api/index.js';


// ── Inline block editor ──────────────────────────────────────────────────────
function BlockEditRow({ block, projects, onSave, onCancel }) {
  const areas = useAreas();
  const s0 = block.start_minutes ?? block.startMinutes;
  const e0 = block.end_minutes   ?? block.endMinutes;
  const [start,  setStart]  = useState(minutesToTime(s0));
  const [end,    setEnd]    = useState(minutesToTime(e0));
  const [area,   setArea]   = useState(block.area_id || block.area);
  const [err,    setErr]    = useState('');
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState(block.notes || '');

  async function handleSave() {
    const sm = timeToMinutes(start);
    const em = timeToMinutes(end);
    if (em <= sm) { setErr('El fin debe ser después del inicio.'); return; }
    setSaving(true);
    try {
      await onSave(block.id, {
        area_id: area,
        project_id: block.project_id ?? null,
        start_time: start,
        end_time: end,
        start_minutes: sm,
        end_minutes: em,
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#0c0a14',
    color: '#f0e6d0',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid #2c2740',
    outline: 'none',
  };

  return (
    <div className="rounded-xl p-3 mb-2" style={{ background: '#1e1b2e', border: '1px solid #2c2740' }}>
      <div className="flex gap-2 mb-2">
        {[['Inicio', start, setStart], ['Fin', end, setEnd]].map(([lbl, val, setter]) => (
          <div key={lbl} className="flex-1">
            <p className="font-cinzel text-[7px] text-[#4d4568] tracking-[0.15em] mb-1 uppercase">{lbl}</p>
            <input type="time" value={val} onChange={(e) => setter(e.target.value)} style={inputStyle} />
          </div>
        ))}
      </div>
      <select value={area} onChange={(e) => setArea(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }}>
        {areas.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>)}
      </select>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="¿Qué tarea harás en este bloque?"
        style={{ ...inputStyle, marginBottom: '8px' }}
      />
      {err && <p className="text-[#9b1f30] text-xs mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 font-cinzel font-bold text-xs py-2 rounded-lg disabled:opacity-50 transition-all btn-primary"
          style={{ fontSize: '10px', letterSpacing: '0.1em', padding: '8px 12px' }}>
          {saving ? '...' : 'GUARDAR'}
        </button>
        <button onClick={onCancel}
          className="px-4 text-[#9490aa] text-sm rounded-lg transition-colors"
          style={{ background: '#171428', border: '1px solid #2c2740' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Inline new-block form ─────────────────────────────────────────────────────
function AddBlockRow({ existingBlocks, projects, onSave, onCancel }) {
  const areas = useAreas();
  const [start,     setStart]     = useState('');
  const [end,       setEnd]       = useState('');
  const [area,      setArea]      = useState(areas[0]?.id || 'NEGOCIO');
  const [projectId, setProjectId] = useState('');
  const [notes,     setNotes]     = useState('');
  const [err,       setErr]       = useState('');
  const [saving,    setSaving]    = useState(false);

  const areaProjects = projects.filter((p) => p.area_id === area && !p.archived);

  async function handleSave() {
    if (!start || !end) { setErr('Completa hora de inicio y fin.'); return; }
    const sm = timeToMinutes(start);
    const em = timeToMinutes(end);
    if (em <= sm) { setErr('El fin debe ser después del inicio.'); return; }
    const overlap = existingBlocks.find((b) => {
      const s = b.start_minutes ?? b.startMinutes;
      const e = b.end_minutes   ?? b.endMinutes;
      return !(em <= s || sm >= e);
    });
    if (overlap) {
      setErr(`Solapamiento con ${minutesToTime(overlap.start_minutes ?? overlap.startMinutes)}–${minutesToTime(overlap.end_minutes ?? overlap.endMinutes)}.`);
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onSave({
        area_id:       area,
        project_id:    projectId ? parseInt(projectId) : null,
        start_time:    start,
        end_time:      end,
        start_minutes: sm,
        end_minutes:   em,
        notes:         notes.trim() || null,
      });
      setStart(''); setEnd(''); setNotes(''); setProjectId('');
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al guardar bloque');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#0c0a14',
    color: '#f0e6d0',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid #2c2740',
    outline: 'none',
  };

  return (
    <div className="rounded-xl p-3 mb-2" style={{ background: '#1e1b2e', border: '1px solid #2c2740' }}>
      <div className="flex gap-2 mb-2">
        {[['Inicio', start, setStart], ['Fin', end, setEnd]].map(([lbl, val, setter]) => (
          <div key={lbl} className="flex-1">
            <p className="font-cinzel text-[7px] text-[#4d4568] tracking-[0.15em] mb-1 uppercase">{lbl}</p>
            <input type="time" value={val} onChange={(e) => setter(e.target.value)} style={inputStyle} />
          </div>
        ))}
      </div>
      <select value={area} onChange={(e) => { setArea(e.target.value); setProjectId(''); }} style={{ ...inputStyle, marginBottom: '8px' }}>
        {areas.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>)}
      </select>
      {area !== 'OTROS' && areaProjects.length > 0 && (
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }}>
          <option value="">Sin empresa</option>
          {areaProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="¿Qué tarea harás en este bloque?"
        style={{ ...inputStyle, marginBottom: '8px' }}
      />
      {err && <p className="text-[#9b1f30] text-xs mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 font-cinzel font-bold text-xs py-2 rounded-lg disabled:opacity-50 transition-all btn-primary"
          style={{ fontSize: '10px', letterSpacing: '0.1em', padding: '8px 12px' }}>
          {saving ? '...' : 'AGREGAR'}
        </button>
        <button onClick={onCancel}
          className="px-4 text-[#9490aa] text-sm rounded-lg transition-colors"
          style={{ background: '#171428', border: '1px solid #2c2740' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard({ setNavScreen }) {
  const now           = useCurrentTime();
  const currentDay    = useStore((s) => s.currentDay);
  const config        = useStore((s) => s.config);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const activeBlock   = useActiveBlock();
  const areaMap       = useAreaMap();

  const [recentDays,       setRecentDays]      = useState([]);
  const [showEvForm,       setShowEvForm]       = useState(false);
  const [chatOpen,         setChatOpen]         = useState(false);
  const [showBlockManager, setShowBlockManager] = useState(false);
  const [editingBlockId,   setEditingBlockId]   = useState(null);
  const [addingBlock,      setAddingBlock]      = useState(false);
  const [projects,         setProjects]         = useState([]);
  const [streak,           setStreak]           = useState(0);

  useEffect(() => {
    api.get('/api/stats/history?days=7').then((r) => setRecentDays(r.data.data)).catch(() => {});
    api.get('/api/projects').then((r) => setProjects(r.data.data || [])).catch(() => {});
    api.get('/api/stats/streak').then((r) => setStreak(r.data.data.streak || 0)).catch(() => {});
  }, []);

  if (!currentDay) return null;

  const score    = calcDayScore(currentDay, areaMap);
  const areaMins = areaMinutesFromBlocks(currentDay.blocks || [], currentDay.evidences || []);

  const activeBlockHasEvidence = activeBlock &&
    (currentDay.evidences || []).some(e => e.block_id === activeBlock.id);

  async function handleEvidenceSubmit(payload) {
    await api.post('/api/evidences', payload);
    const r = await api.get(`/api/days/${currentDay.date_key}`);
    setCurrentDay(r.data.data);
    setShowEvForm(false);
  }

  async function handleBlockEdit(blockId, updatedData) {
    const { data } = await api.put(`/api/blocks/${blockId}`, updatedData);
    setCurrentDay(data.data.day);
    setEditingBlockId(null);
  }

  async function handleBlockAdd(payload) {
    const { data } = await api.post('/api/blocks', {
      ...payload,
      day_id: currentDay.id,
      sort_order: (currentDay.blocks || []).length,
    });
    const updated = [...(currentDay.blocks || []), data.data];
    setCurrentDay({ ...currentDay, blocks: updated });
    setAddingBlock(false);
  }

  const currentMins    = now.getHours() * 60 + now.getMinutes();
  const upcomingBlocks = (currentDay.blocks || [])
    .filter((b) => (b.start_minutes ?? b.startMinutes) > currentMins)
    .slice(0, 4);

  const allBlocks = [...(currentDay.blocks || [])]
    .sort((a, b) => (a.start_minutes ?? a.startMinutes) - (b.start_minutes ?? b.startMinutes));

  const chartData = [...recentDays].reverse().map((d) => ({
    date: d.date_key?.slice(5), score: d.score || 0,
  }));

  const areaId          = activeBlock?.area_id || activeBlock?.area;
  const activeAreaColor = areaMap[areaId]?.color || '#6B7280';
  const activeStart     = activeBlock ? (activeBlock.start_minutes ?? activeBlock.startMinutes) : 0;
  const activeEnd       = activeBlock ? (activeBlock.end_minutes   ?? activeBlock.endMinutes)   : 0;
  const activeRemain    = activeBlock ? Math.max(0, activeEnd - currentMins) : 0;
  const activeProgress  = activeBlock && activeEnd > activeStart
    ? Math.min(100, ((currentMins - activeStart) / (activeEnd - activeStart)) * 100) : 0;

  const editCount = currentDay.block_edits_count || 0;

  async function handleCloseDay() {
    const { data } = await api.put(`/api/days/${currentDay.date_key}/phase`, { phase: 'close' });
    setCurrentDay(data.data);
  }

  const panelStyle = {
    background: 'linear-gradient(135deg, #17142a 0%, #131028 100%)',
    border: '1px solid #2c2740',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.02)',
  };

  return (
    <div className="min-h-screen px-4 py-5 max-w-7xl mx-auto">
      <AiChat forceOpen={chatOpen} onOpenChange={setChatOpen} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-cinzel text-[#4d4568] text-[8px] tracking-[0.35em] uppercase">
            {currentDay.date_key?.toString().slice(0, 10)}
          </p>
          {score > 0 && (
            <p className="font-mono font-bold mt-0.5 text-xs" style={{ color: '#d4a956' }}>{score} pts</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const el = document.getElementById('notifications-panel');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#4d4568] hover:text-[#9490aa] transition-colors"
            style={{ background: '#17142a', border: '1px solid #2c2740' }}
            title="Ver evidencias pendientes"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <NotificationBadge />
          </button>
          <button
            onClick={() => setChatOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#9490aa] hover:text-[#d4a956] transition-all"
            style={{ background: '#17142a', border: '1px solid #2c2740' }}
          >
            <span className="font-bold text-base" style={{ color: '#d4a956' }}>✦</span>
            <span className="font-cinzel text-[10px] tracking-[0.08em]">Coach</span>
          </button>
        </div>
      </div>

      {/* Streak */}
      <div className="rounded-xl p-4 mb-5 flex items-center gap-4" style={panelStyle}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-xl"
          style={{
            background: streak > 0 ? 'rgba(212,169,86,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${streak > 0 ? 'rgba(212,169,86,0.35)' : '#2c2740'}`,
          }}>
          🔥
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em] mb-0.5">Racha</p>
          <p className="font-mono text-2xl font-black leading-none"
            style={{ color: streak > 0 ? '#d4a956' : '#4d4568' }}>
            {streak} <span className="text-sm font-normal">{streak === 1 ? 'día' : 'días'}</span>
          </p>
        </div>
        <p className="text-[#4d4568] text-[11px] text-right leading-snug max-w-[150px] hidden sm:block">
          Ritual del alba + bloques programados
        </p>
      </div>

      {/* Daily phrase */}
      {currentDay.daily_phrase && (
        <p className="text-center mb-5 px-4 italic text-base"
          style={{ color: '#d4a956', opacity: 0.65 }}>
          "{currentDay.daily_phrase}"
        </p>
      )}

      <div id="notifications-panel">
        <EvidenceInline />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* ── Left ─────────────────────────────────────────── */}
        <div className="md:w-[42%] flex flex-col gap-3">

          {/* Active block hero */}
          {activeBlock ? (
            <div className="rounded-xl p-4 border-l-4"
              style={{
                ...panelStyle,
                borderLeftColor: activeAreaColor,
                borderLeft: `4px solid ${activeAreaColor}`,
              }}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-cinzel text-[8px] font-semibold uppercase tracking-[0.2em] mb-1"
                     style={{ color: activeAreaColor }}>En curso</p>
                  <p className="text-[#f0e6d0] font-semibold text-base leading-tight truncate">
                    {activeBlock.notes || activeBlock.project_name || areaMap[areaId]?.label || '—'}
                  </p>
                  <p className="font-mono text-[#9490aa] text-xs mt-0.5">
                    {minutesToTime(activeStart)}–{minutesToTime(activeEnd)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-mono text-4xl font-black text-[#f0e6d0] tabular-nums leading-none">
                    {formatTime(now)}
                  </p>
                  <p className="text-[#9490aa] text-xs mt-1">{minutesToLabel(activeRemain)} restantes</p>
                </div>
              </div>
              <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: '#2c2740' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${activeProgress}%`,
                    backgroundColor: activeAreaColor,
                    boxShadow: `0 0 8px ${activeAreaColor}60`,
                  }} />
              </div>
              {areaId !== 'OTROS' && (
                activeBlockHasEvidence ? (
                  <p className="font-cinzel text-[9px] tracking-[0.1em] text-center py-2"
                    style={{ color: activeAreaColor }}>✓ EVIDENCIA ENVIADA</p>
                ) : (
                  <button onClick={() => setShowEvForm(v => !v)}
                    className="w-full text-xs font-cinzel tracking-[0.08em] py-2.5 rounded-lg transition-all"
                    style={{
                      border: `1px solid ${showEvForm ? activeAreaColor : '#2c2740'}`,
                      color: showEvForm ? activeAreaColor : '#9490aa',
                      background: '#1e1b2e',
                    }}>
                    {showEvForm ? '↑ CERRAR' : '⊕ ADJUNTAR EVIDENCIA'}
                  </button>
                )
              )}
              {showEvForm && !activeBlockHasEvidence && (
                <div className="mt-3">
                  <EvidenceForm block={activeBlock} onSubmit={handleEvidenceSubmit}
                    onCancel={() => setShowEvForm(false)} />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-4" style={panelStyle}>
              <p className="font-cinzel text-[#4d4568] text-[8px] tracking-[0.2em] uppercase mb-2">Hora actual</p>
              <p className="font-mono text-5xl font-black text-[#f0e6d0] tabular-nums"
                style={{ textShadow: '0 0 20px rgba(212,169,86,0.1)' }}>
                {formatTime(now)}
              </p>
              {upcomingBlocks.length > 0 ? (
                <p className="text-[#9490aa] text-sm mt-2">
                  Próximo: <span className="font-mono text-[#d4a956]">{minutesToTime(upcomingBlocks[0].start_minutes ?? upcomingBlocks[0].startMinutes)}</span>
                </p>
              ) : (
                <p className="text-[#4d4568] text-sm mt-2">Sin bloques próximos</p>
              )}
            </div>
          )}

          {/* Upcoming blocks */}
          {upcomingBlocks.length > 0 && (
            <div className="rounded-xl p-4" style={panelStyle}>
              <SectionTitle>Próximos bloques</SectionTitle>
              <div className="flex flex-col">
                {upcomingBlocks.map((b) => {
                  const bc = areaMap[b.area_id || b.area]?.color || '#6B7280';
                  const areaLabel = areaMap[b.area_id || b.area]?.label || '—';
                  return (
                    <div key={b.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #1e1b2e' }}>
                      <p className="font-mono text-sm text-[#f0e6d0] w-10 shrink-0">
                        {minutesToTime(b.start_minutes ?? b.startMinutes)}
                      </p>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bc, boxShadow: `0 0 4px ${bc}80` }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[#f0e6d0] text-sm truncate">
                          {b.notes || b.project_name || areaLabel}
                        </p>
                        {(b.notes || b.project_name) && (
                          <p className="text-[#4d4568] text-[10px] truncate">{areaLabel}</p>
                        )}
                      </div>
                      <p className="text-[#4d4568] text-xs shrink-0">
                        {minutesToLabel((b.end_minutes ?? b.endMinutes) - (b.start_minutes ?? b.startMinutes))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Block manager */}
          {allBlocks.length > 0 && (
            <div className="rounded-xl" style={panelStyle}>
              <button onClick={() => setShowBlockManager(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity">
                <p className="font-cinzel text-[8px] text-[#9490aa] uppercase tracking-[0.2em]">Reprogramar</p>
                <div className="flex items-center gap-2">
                  {editCount > 0 && (
                    <span className="font-mono text-[8px] px-2 py-0.5 rounded" style={{
                      color: '#d4a956',
                      background: 'rgba(212,169,86,0.1)',
                      border: '1px solid rgba(212,169,86,0.2)',
                    }}>
                      {editCount} edic.
                    </span>
                  )}
                  <span className="text-[#4d4568] text-xs">{showBlockManager ? '↑' : '↓'}</span>
                </div>
              </button>
              {showBlockManager && (
                <div className="px-4 pb-3" style={{ borderTop: '1px solid #2c2740' }}>
                  <p className="font-cinzel text-[7px] text-[#4d4568] tracking-[0.15em] uppercase mt-3 mb-2">
                    Cada cambio queda registrado
                  </p>
                  {allBlocks.map((b) => {
                    const s = b.start_minutes ?? b.startMinutes;
                    const e = b.end_minutes   ?? b.endMinutes;
                    const bc = areaMap[b.area_id || b.area]?.color || '#6B7280';
                    const proj = projects.find((p) => p.id === b.project_id);
                    const areaLabel = areaMap[b.area_id || b.area]?.label || b.area_id;
                    if (editingBlockId === b.id) {
                      return <BlockEditRow key={b.id} block={b} projects={projects}
                        onSave={handleBlockEdit} onCancel={() => setEditingBlockId(null)} />;
                    }
                    return (
                      <div key={b.id} className="flex items-center gap-2 py-2.5"
                        style={{ borderBottom: '1px solid #1e1b2e' }}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bc }} />
                        <p className="font-mono text-xs text-[#f0e6d0] shrink-0">{minutesToTime(s)}–{minutesToTime(e)}</p>
                        <div className="min-w-0 flex-1">
                          <p className="text-[#9490aa] text-sm truncate">
                            {b.notes || proj?.name || areaLabel}
                          </p>
                          {(b.notes || proj?.name) && (
                            <p className="text-[#4d4568] text-[10px] truncate">{areaLabel}</p>
                          )}
                        </div>
                        <button onClick={() => setEditingBlockId(b.id)}
                          className="text-[#4d4568] hover:text-[#d4a956] text-sm transition-colors shrink-0 px-1">✎</button>
                      </div>
                    );
                  })}

                  {addingBlock ? (
                    <AddBlockRow
                      existingBlocks={allBlocks}
                      projects={projects}
                      onSave={handleBlockAdd}
                      onCancel={() => setAddingBlock(false)}
                    />
                  ) : (
                    <button onClick={() => setAddingBlock(true)}
                      className="w-full mt-1 py-2.5 rounded-lg font-cinzel text-[9px] tracking-[0.15em] uppercase transition-colors"
                      style={{ border: '1px dashed #2c2740', color: '#4d4568', background: 'transparent' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; e.currentTarget.style.color = '#d4a956'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#2c2740'; e.currentTarget.style.color = '#4d4568'; }}>
                      + Agregar bloque
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Close day */}
          <button onClick={handleCloseDay}
            className="w-full py-3 rounded-xl font-cinzel text-[10px] tracking-[0.12em] transition-all"
            style={{
              background: '#17142a',
              border: '1px solid #2c2740',
              color: '#9490aa',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#f0e6d0';
              e.currentTarget.style.borderColor = '#3e3858';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#9490aa';
              e.currentTarget.style.borderColor = '#2c2740';
            }}>
            CERRAR EL DÍA →
          </button>
        </div>

        {/* ── Right ────────────────────────────────────────── */}
        <div className="md:w-[58%] flex flex-col gap-3">

          {/* Score */}
          <div className="rounded-xl p-4 flex items-center gap-5" style={panelStyle}>
            <ScoreRing score={score} max={100} size={100} />
            <div className="flex-1">
              <SectionTitle>Score del día</SectionTitle>
              <p className="font-mono text-4xl font-black"
                style={{ color: '#d4a956', textShadow: '0 0 20px rgba(212,169,86,0.25)' }}>
                {score}
              </p>
              <p className="font-cinzel text-[#4d4568] text-[8px] tracking-[0.15em]">/ 100 PUNTOS</p>
              {config && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ['UPS', config.ups_used ? 0 : config.ups_total],
                    ['Especiales', config.special_days_total - config.special_days_used_count],
                    ['Replanes', config.replan_days_total - config.replan_days_used_count],
                  ].map(([lbl, val]) => (
                    <span key={lbl} className="font-cinzel text-[7px] text-[#9490aa] px-2 py-0.5 rounded tracking-[0.05em]"
                      style={{ background: '#1e1b2e', border: '1px solid #2c2740' }}>
                      {lbl}: {val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Area minimums */}
          <div className="rounded-xl p-4" style={panelStyle}>
            <SectionTitle>Mínimos del día</SectionTitle>
            <div className="flex flex-col gap-3">
              {Object.values(areaMap).filter(a => a.min_minutes > 0).map((area) => {
                const done = areaMins[area.id] || 0;
                const ok   = done >= area.min_minutes;
                const pct  = Math.min(100, (done / area.min_minutes) * 100);
                return (
                  <div key={area.id}>
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-sm ${ok ? 'text-[#d4a956]' : 'text-[#9490aa]'}`}>
                        {ok ? '✓ ' : ''}{area.emoji} {area.label}
                      </span>
                      <span className={`font-mono text-xs ${ok ? 'text-[#d4a956]' : 'text-[#4d4568]'}`}>
                        {minutesToLabel(done)} / {minutesToLabel(area.min_minutes)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: '#2c2740' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: ok ? '#d4a956' : area.color,
                          boxShadow: ok ? '0 0 6px rgba(212,169,86,0.3)' : 'none',
                        }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-day chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl p-4" style={panelStyle}>
              <SectionTitle>Últimos 7 días</SectionTitle>
              <ResponsiveContainer width="100%" height={72}>
                <BarChart data={chartData} barSize={14}>
                  <XAxis dataKey="date" tick={{ fill: '#4d4568', fontSize: 10, fontFamily: 'Cinzel' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: '#1e1b2e', border: '1px solid #2c2740', borderRadius: 8 }}
                    labelStyle={{ color: '#f0e6d0', fontSize: 11 }}
                    itemStyle={{ color: '#d4a956', fontSize: 11 }}
                    formatter={(v) => [`${v} pts`]}
                  />
                  <Bar dataKey="score" radius={3}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.score >= 70 ? '#d4a956' : d.score >= 40 ? '#9490aa' : '#9b1f30'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
