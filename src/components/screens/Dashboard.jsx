import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../../store/useStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { useActiveBlock } from '../../hooks/useActiveBlock';
import { calcDayScore, areaMinutesFromBlocks } from '../../utils/scoring';
import { formatTime, minutesToLabel, minutesToTime, timeToMinutes } from '../../utils/dateUtils';
import { AREAS, MANDATORY_AREAS } from '../../data/areas';
import ScoreRing from '../ui/ScoreRing';
import EvidenceInline from '../ui/EvidenceInline';
import AiChat from '../ui/AiChat';
import { EvidenceForm } from '../ui/EvidenceInline';
import api from '../../api/index.js';

const AREA_MINS = { NEGOCIO: 300, SEGUNDA: 60, ESTUDIO: 180, EJERCICIO: 30 };
const AREA_HEX  = {
  NEGOCIO: '#3B82F6', SEGUNDA: '#A855F7', ESTUDIO: '#F59E0B',
  EJERCICIO: '#10B981', OTROS: '#6B7280',
};

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-1 h-px bg-[#3a2e22]" />
      <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.25em] shrink-0">{children}</p>
      <div className="flex-1 h-px bg-[#3a2e22]" />
    </div>
  );
}

// ── Inline block editor ──────────────────────────────────────────────────────
function BlockEditRow({ block, projects, onSave, onCancel }) {
  const s0 = block.start_minutes ?? block.startMinutes;
  const e0 = block.end_minutes   ?? block.endMinutes;
  const [start,  setStart]  = useState(minutesToTime(s0));
  const [end,    setEnd]    = useState(minutesToTime(e0));
  const [area,   setArea]   = useState(block.area_id || block.area);
  const [err,    setErr]    = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const sm = timeToMinutes(start);
    const em = timeToMinutes(end);
    if (em <= sm) { setErr('El fin debe ser después del inicio.'); return; }
    setSaving(true);
    try {
      await onSave(block.id, { area_id: area, start_time: start, end_time: end, start_minutes: sm, end_minutes: em });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#201a14] rounded-lg p-3 mb-2 border border-[#3a2e22]">
      <div className="flex gap-2 mb-2">
        {[['Inicio', start, setStart], ['Fin', end, setEnd]].map(([lbl, val, setter]) => (
          <div key={lbl} className="flex-1">
            <p className="font-cinzel text-[8px] text-[#5a4838] tracking-[0.15em] mb-1 uppercase">{lbl}</p>
            <input type="time" value={val} onChange={(e) => setter(e.target.value)}
              className="w-full bg-[#110d0a] text-[#f0e6d0] text-sm rounded-lg px-2 py-2 border border-[#3a2e22] focus:border-[#c9a254] outline-none" />
          </div>
        ))}
      </div>
      <select value={area} onChange={(e) => setArea(e.target.value)}
        className="w-full bg-[#110d0a] text-[#f0e6d0] text-sm rounded-lg px-2 py-2 border border-[#3a2e22] mb-2 outline-none">
        {Object.values(AREAS).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
      {err && <p className="text-[#8b1a2a] text-xs mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 bg-[#c9a254] text-[#0a0806] font-cinzel font-bold text-xs py-2 rounded-lg disabled:opacity-50 active:scale-95 transition-transform tracking-[0.08em]">
          {saving ? '...' : 'GUARDAR'}
        </button>
        <button onClick={onCancel} className="px-4 text-[#9a8470] text-sm bg-[#110d0a] border border-[#3a2e22] rounded-lg">
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

  const [recentDays,       setRecentDays]      = useState([]);
  const [showEvForm,       setShowEvForm]       = useState(false);
  const [chatOpen,         setChatOpen]         = useState(false);
  const [showBlockManager, setShowBlockManager] = useState(false);
  const [editingBlockId,   setEditingBlockId]   = useState(null);
  const [projects,         setProjects]         = useState([]);

  useEffect(() => {
    api.get('/api/stats/history?days=7').then((r) => setRecentDays(r.data.data)).catch(() => {});
    api.get('/api/projects').then((r) => setProjects(r.data.data || [])).catch(() => {});
  }, []);

  if (!currentDay) return null;

  const score    = calcDayScore(currentDay);
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
  const activeAreaColor = AREA_HEX[areaId] || '#6B7280';
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

  return (
    <div className="min-h-screen px-4 py-5 max-w-7xl mx-auto">
      <AiChat forceOpen={chatOpen} onOpenChange={setChatOpen} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.3em] uppercase">
            {currentDay.date_key?.toString().slice(0, 10)}
          </p>
          {score > 0 && (
            <p className="font-mono text-[#c9a254] text-xs font-bold mt-0.5">{score} pts</p>
          )}
        </div>
        <button
          onClick={() => setChatOpen(v => !v)}
          className="flex items-center gap-2 bg-[#1a1410] border border-[#3a2e22] hover:border-[#c9a254] px-3 py-1.5 rounded-lg text-sm text-[#9a8470] hover:text-[#c9a254] transition-colors"
        >
          <span className="text-[#c9a254] font-bold text-base">✦</span>
          <span className="font-cinzel text-[11px] tracking-[0.08em]">Coach</span>
        </button>
      </div>

      {/* Daily phrase */}
      {currentDay.daily_phrase && (
        <p className="text-[#c9a254] italic text-center mb-5 px-4 opacity-70 text-base">
          "{currentDay.daily_phrase}"
        </p>
      )}

      <EvidenceInline />

      <div className="flex flex-col md:flex-row gap-4">
        {/* ── Left ─────────────────────────────────────────── */}
        <div className="md:w-[42%] flex flex-col gap-3">

          {/* Active block hero */}
          {activeBlock ? (
            <div className="bg-[#1a1410] rounded-xl p-4 border border-[#3a2e22] border-l-4"
              style={{ borderLeftColor: activeAreaColor }}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-cinzel text-[9px] font-semibold uppercase tracking-[0.2em] mb-1"
                     style={{ color: activeAreaColor }}>En curso</p>
                  <p className="text-[#f0e6d0] font-semibold text-base leading-tight truncate">
                    {activeBlock.project_name || AREAS[areaId]?.label || '—'}
                  </p>
                  <p className="text-[#9a8470] text-xs font-mono mt-0.5">
                    {minutesToTime(activeStart)}–{minutesToTime(activeEnd)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-mono text-4xl font-black text-[#f0e6d0] tabular-nums leading-none">
                    {formatTime(now)}
                  </p>
                  <p className="text-[#9a8470] text-xs mt-1">{minutesToLabel(activeRemain)} restantes</p>
                </div>
              </div>
              <div className="h-1 bg-[#3a2e22] rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${activeProgress}%`, backgroundColor: activeAreaColor }} />
              </div>
              {areaId !== 'OTROS' && (
                activeBlockHasEvidence ? (
                  <p className="font-cinzel text-[10px] tracking-[0.1em] text-center py-2"
                    style={{ color: activeAreaColor }}>✓ EVIDENCIA ENVIADA</p>
                ) : (
                  <button onClick={() => setShowEvForm(v => !v)}
                    className="w-full border text-xs font-cinzel tracking-[0.08em] py-2.5 rounded-lg transition-colors"
                    style={{
                      borderColor: showEvForm ? activeAreaColor : '#3a2e22',
                      color: showEvForm ? activeAreaColor : '#9a8470',
                      backgroundColor: '#201a14',
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
            <div className="bg-[#1a1410] rounded-xl p-4 border border-[#3a2e22]">
              <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.2em] uppercase mb-2">Hora actual</p>
              <p className="font-mono text-5xl font-black text-[#f0e6d0] tabular-nums">{formatTime(now)}</p>
              {upcomingBlocks.length > 0 ? (
                <p className="text-[#9a8470] text-sm mt-2">
                  Próximo: {minutesToTime(upcomingBlocks[0].start_minutes ?? upcomingBlocks[0].startMinutes)}
                </p>
              ) : (
                <p className="text-[#5a4838] text-sm mt-2">Sin bloques próximos</p>
              )}
            </div>
          )}

          {/* Upcoming blocks */}
          {upcomingBlocks.length > 0 && (
            <div className="bg-[#1a1410] rounded-xl p-4 border border-[#3a2e22]">
              <SectionTitle>Próximos bloques</SectionTitle>
              <div className="flex flex-col">
                {upcomingBlocks.map((b) => {
                  const bc = AREA_HEX[b.area_id || b.area] || '#6B7280';
                  return (
                    <div key={b.id} className="flex items-center gap-3 py-2 border-b border-[#201a14] last:border-0">
                      <p className="font-mono text-sm text-[#f0e6d0] w-10 shrink-0">
                        {minutesToTime(b.start_minutes ?? b.startMinutes)}
                      </p>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bc }} />
                      <p className="text-[#9a8470] text-sm truncate flex-1">
                        {b.project_name || AREAS[b.area_id || b.area]?.label || '—'}
                      </p>
                      <p className="text-[#5a4838] text-xs shrink-0">
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
            <div className="bg-[#1a1410] rounded-xl border border-[#3a2e22]">
              <button onClick={() => setShowBlockManager(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3">
                <p className="font-cinzel text-[8px] text-[#9a8470] uppercase tracking-[0.2em]">
                  Reprogramar
                </p>
                <div className="flex items-center gap-2">
                  {editCount > 0 && (
                    <span className="font-mono text-[9px] text-[#c9a254] bg-[#c9a254]/10 px-2 py-0.5 rounded border border-[#c9a254]/20">
                      {editCount} edic.
                    </span>
                  )}
                  <span className="text-[#5a4838] text-xs">{showBlockManager ? '↑' : '↓'}</span>
                </div>
              </button>
              {showBlockManager && (
                <div className="px-4 pb-3 border-t border-[#201a14]">
                  <p className="font-cinzel text-[8px] text-[#5a4838] tracking-[0.15em] uppercase mt-3 mb-2">
                    Cada cambio queda registrado
                  </p>
                  {allBlocks.map((b) => {
                    const s = b.start_minutes ?? b.startMinutes;
                    const e = b.end_minutes   ?? b.endMinutes;
                    const bc = AREA_HEX[b.area_id || b.area] || '#6B7280';
                    const proj = projects.find((p) => p.id === b.project_id);
                    if (editingBlockId === b.id) {
                      return <BlockEditRow key={b.id} block={b} projects={projects}
                        onSave={handleBlockEdit} onCancel={() => setEditingBlockId(null)} />;
                    }
                    return (
                      <div key={b.id} className="flex items-center gap-2 py-2.5 border-b border-[#201a14] last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bc }} />
                        <p className="font-mono text-xs text-[#f0e6d0] shrink-0">{minutesToTime(s)}–{minutesToTime(e)}</p>
                        <p className="text-[#9a8470] text-sm truncate flex-1">
                          {proj?.name || AREAS[b.area_id || b.area]?.label || b.area_id}
                        </p>
                        <button onClick={() => setEditingBlockId(b.id)}
                          className="text-[#5a4838] hover:text-[#c9a254] text-sm transition-colors shrink-0 px-1">✎</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Close day */}
          <button onClick={handleCloseDay}
            className="w-full bg-[#1a1410] border border-[#3a2e22] text-[#9a8470] hover:text-[#f0e6d0] hover:border-[#5a4838] py-3 rounded-xl font-cinzel text-[11px] tracking-[0.1em] transition-colors">
            CERRAR EL DÍA →
          </button>
        </div>

        {/* ── Right ────────────────────────────────────────── */}
        <div className="md:w-[58%] flex flex-col gap-3">

          {/* Score */}
          <div className="bg-[#1a1410] rounded-xl p-4 border border-[#3a2e22] flex items-center gap-5">
            <ScoreRing score={score} max={100} size={100} />
            <div>
              <SectionTitle>Score del día</SectionTitle>
              <p className="font-mono text-[#c9a254] text-4xl font-black">{score}</p>
              <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.15em]">/ 100 PUNTOS</p>
              {config && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ['UPS', config.ups_used ? 0 : config.ups_total],
                    ['Especiales', config.special_days_total - config.special_days_used_count],
                    ['Replanes', config.replan_days_total - config.replan_days_used_count],
                  ].map(([lbl, val]) => (
                    <span key={lbl} className="font-cinzel text-[8px] text-[#9a8470] bg-[#201a14] border border-[#3a2e22] px-2 py-0.5 rounded tracking-[0.05em]">
                      {lbl}: {val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Area minimums */}
          <div className="bg-[#1a1410] rounded-xl p-4 border border-[#3a2e22]">
            <SectionTitle>Mínimos del día</SectionTitle>
            <div className="flex flex-col gap-3">
              {MANDATORY_AREAS.map((id) => {
                const area = AREAS[id];
                const done = areaMins[id] || 0;
                const ok   = done >= AREA_MINS[id];
                const pct  = Math.min(100, (done / AREA_MINS[id]) * 100);
                return (
                  <div key={id}>
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-sm ${ok ? 'text-[#c9a254]' : 'text-[#9a8470]'}`}>
                        {ok ? '✓ ' : ''}{area.label}
                      </span>
                      <span className={`font-mono text-xs ${ok ? 'text-[#c9a254]' : 'text-[#5a4838]'}`}>
                        {minutesToLabel(done)} / {minutesToLabel(AREA_MINS[id])}
                      </span>
                    </div>
                    <div className="h-1 bg-[#3a2e22] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: ok ? '#c9a254' : AREA_HEX[id] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-day chart */}
          {chartData.length > 0 && (
            <div className="bg-[#1a1410] rounded-xl p-4 border border-[#3a2e22]">
              <SectionTitle>Últimos 7 días</SectionTitle>
              <ResponsiveContainer width="100%" height={72}>
                <BarChart data={chartData} barSize={14}>
                  <XAxis dataKey="date" tick={{ fill: '#5a4838', fontSize: 10, fontFamily: 'Cinzel' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={{ background: '#1a1410', border: '1px solid #3a2e22', borderRadius: 8 }}
                    labelStyle={{ color: '#f0e6d0', fontSize: 11 }}
                    itemStyle={{ color: '#c9a254', fontSize: 11 }}
                    formatter={(v) => [`${v} pts`]} />
                  <Bar dataKey="score" radius={3}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.score >= 70 ? '#c9a254' : d.score >= 40 ? '#9a8470' : '#8b1a2a'} />
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
