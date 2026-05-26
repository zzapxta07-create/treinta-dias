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

// ── Inline block editor row ──────────────────────────────────────────────────
function BlockEditRow({ block, projects, onSave, onCancel }) {
  const s0 = block.start_minutes ?? block.startMinutes;
  const e0 = block.end_minutes   ?? block.endMinutes;
  const [start,   setStart]   = useState(minutesToTime(s0));
  const [end,     setEnd]     = useState(minutesToTime(e0));
  const [area,    setArea]    = useState(block.area_id || block.area);
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    const sm = timeToMinutes(start);
    const em = timeToMinutes(end);
    if (em <= sm) { setErr('El fin debe ser después del inicio.'); return; }
    setSaving(true);
    try {
      await onSave(block.id, {
        area_id:       area,
        start_time:    start,
        end_time:      end,
        start_minutes: sm,
        end_minutes:   em,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#1c1915] rounded-xl p-3 mb-2">
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <p className="text-[9px] text-[#4a3f35] uppercase tracking-wider mb-1">Inicio</p>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full bg-[#12100e] text-[#f5f0e8] text-xs rounded-lg px-2 py-2 border border-[#2a2520] focus:border-[#c9a84c] outline-none"
          />
        </div>
        <div className="flex-1">
          <p className="text-[9px] text-[#4a3f35] uppercase tracking-wider mb-1">Fin</p>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full bg-[#12100e] text-[#f5f0e8] text-xs rounded-lg px-2 py-2 border border-[#2a2520] focus:border-[#c9a84c] outline-none"
          />
        </div>
      </div>
      <select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        className="w-full bg-[#12100e] text-[#f5f0e8] text-xs rounded-lg px-2 py-2 border border-[#2a2520] mb-2 outline-none"
      >
        {Object.values(AREAS).map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>
      {err && <p className="text-red-400 text-xs mb-2">{err}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#c9a84c] text-[#0c0a09] text-xs font-black py-2 rounded-lg disabled:opacity-50 active:scale-95 transition-transform"
        >
          {saving ? '...' : 'Guardar'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 text-[#8b7d6b] text-xs bg-[#12100e] border border-[#2a2520] rounded-lg"
        >
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

  const [recentDays,       setRecentDays]       = useState([]);
  const [showEvForm,       setShowEvForm]        = useState(false);
  const [chatOpen,         setChatOpen]          = useState(false);
  const [showBlockManager, setShowBlockManager]  = useState(false);
  const [editingBlockId,   setEditingBlockId]    = useState(null);
  const [projects,         setProjects]          = useState([]);

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
    date:  d.date_key?.slice(5),
    score: d.score || 0,
  }));

  const areaId          = activeBlock?.area_id || activeBlock?.area;
  const activeAreaColor = AREA_HEX[areaId] || '#6B7280';
  const activeStart     = activeBlock ? (activeBlock.start_minutes ?? activeBlock.startMinutes) : 0;
  const activeEnd       = activeBlock ? (activeBlock.end_minutes   ?? activeBlock.endMinutes)   : 0;
  const activeRemain    = activeBlock ? Math.max(0, activeEnd - currentMins) : 0;
  const activeProgress  = activeBlock && activeEnd > activeStart
    ? Math.min(100, ((currentMins - activeStart) / (activeEnd - activeStart)) * 100)
    : 0;

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
          <p className="text-[#8b7d6b] text-xs uppercase tracking-widest">
            {currentDay.date_key?.toString().slice(0, 10)}
          </p>
          {score > 0 && (
            <p className="text-[#c9a84c] text-xs font-mono font-bold mt-0.5">{score} pts</p>
          )}
        </div>
        <button
          onClick={() => setChatOpen(v => !v)}
          className="flex items-center gap-2 bg-[#1c1915] border border-[#2a2520] hover:border-[#c9a84c] px-3 py-1.5 rounded-xl text-sm text-[#8b7d6b] hover:text-[#c9a84c] transition-colors"
        >
          <span className="text-[#c9a84c] font-black text-base">✦</span>
          <span className="font-medium">Coach IA</span>
        </button>
      </div>

      {/* Daily phrase */}
      {currentDay.daily_phrase && (
        <p className="text-[#c9a84c] italic text-sm text-center mb-5 px-4 opacity-75">
          "{currentDay.daily_phrase}"
        </p>
      )}

      {/* Pending evidence reminders */}
      <EvidenceInline />

      <div className="flex flex-col md:flex-row gap-4">
        {/* ── Left column (42%) ─────────────────────────────── */}
        <div className="md:w-[42%] flex flex-col gap-3">

          {/* Active block hero */}
          {activeBlock ? (
            <div
              className="bg-[#12100e] rounded-2xl p-4 border border-[#2a2520] border-l-4"
              style={{ borderLeftColor: activeAreaColor }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                     style={{ color: activeAreaColor }}>
                    En curso
                  </p>
                  <p className="text-[#f5f0e8] font-bold text-base leading-tight truncate">
                    {activeBlock.project_name || AREAS[areaId]?.label || '—'}
                  </p>
                  <p className="text-[#8b7d6b] text-xs font-mono mt-0.5">
                    {minutesToTime(activeStart)}–{minutesToTime(activeEnd)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-mono text-4xl font-black text-[#f5f0e8] tabular-nums leading-none">
                    {formatTime(now)}
                  </p>
                  <p className="text-[#8b7d6b] text-xs mt-1">{minutesToLabel(activeRemain)} restantes</p>
                </div>
              </div>

              <div className="h-1 bg-[#2a2520] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${activeProgress}%`, backgroundColor: activeAreaColor }}
                />
              </div>

              {areaId !== 'OTROS' && (
                activeBlockHasEvidence ? (
                  <p className="text-xs font-medium text-center py-2" style={{ color: activeAreaColor }}>
                    ✓ Evidencia enviada
                  </p>
                ) : (
                  <button
                    onClick={() => setShowEvForm(v => !v)}
                    className="w-full border text-xs font-semibold py-2.5 rounded-xl transition-colors"
                    style={{
                      borderColor: showEvForm ? activeAreaColor : '#2a2520',
                      color: showEvForm ? activeAreaColor : '#8b7d6b',
                      backgroundColor: '#1c1915',
                    }}
                  >
                    {showEvForm ? '↑ Cerrar formulario' : '⊕ Adjuntar evidencia'}
                  </button>
                )
              )}

              {showEvForm && !activeBlockHasEvidence && (
                <div className="mt-3">
                  <EvidenceForm
                    block={activeBlock}
                    onSubmit={handleEvidenceSubmit}
                    onCancel={() => setShowEvForm(false)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#12100e] rounded-2xl p-4 border border-[#2a2520]">
              <p className="text-[#4a3f35] text-xs uppercase tracking-wider mb-2">Hora actual</p>
              <p className="font-mono text-5xl font-black text-[#f5f0e8] tabular-nums">
                {formatTime(now)}
              </p>
              {upcomingBlocks.length > 0 ? (
                <p className="text-[#8b7d6b] text-xs mt-2">
                  Próximo: {minutesToTime(upcomingBlocks[0].start_minutes ?? upcomingBlocks[0].startMinutes)}
                </p>
              ) : (
                <p className="text-[#4a3f35] text-xs mt-2">Sin bloques próximos</p>
              )}
            </div>
          )}

          {/* Upcoming blocks timeline */}
          {upcomingBlocks.length > 0 && (
            <div className="bg-[#12100e] rounded-2xl p-4 border border-[#2a2520]">
              <p className="text-[10px] text-[#8b7d6b] uppercase tracking-widest mb-3">Próximos bloques</p>
              <div className="flex flex-col">
                {upcomingBlocks.map((b) => {
                  const bColor = AREA_HEX[b.area_id || b.area] || '#6B7280';
                  return (
                    <div key={b.id} className="flex items-center gap-3 py-2 border-b border-[#1c1915] last:border-0">
                      <p className="font-mono text-sm text-[#f5f0e8] w-10 shrink-0">
                        {minutesToTime(b.start_minutes ?? b.startMinutes)}
                      </p>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bColor }} />
                      <p className="text-[#a09585] text-sm truncate flex-1">
                        {b.project_name || AREAS[b.area_id || b.area]?.label || '—'}
                      </p>
                      <p className="text-[#4a3f35] text-xs shrink-0">
                        {minutesToLabel((b.end_minutes ?? b.endMinutes) - (b.start_minutes ?? b.startMinutes))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Block manager — collapsible */}
          {allBlocks.length > 0 && (
            <div className="bg-[#12100e] rounded-2xl border border-[#2a2520]">
              <button
                onClick={() => setShowBlockManager(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <p className="text-[10px] text-[#8b7d6b] uppercase tracking-widest">
                  Reprogramar bloques
                </p>
                <div className="flex items-center gap-2">
                  {editCount > 0 && (
                    <span className="text-[10px] text-[#c9a84c] font-mono bg-[#c9a84c]/10 px-2 py-0.5 rounded">
                      {editCount} edic.
                    </span>
                  )}
                  <span className="text-[#4a3f35] text-xs">{showBlockManager ? '↑' : '↓'}</span>
                </div>
              </button>

              {showBlockManager && (
                <div className="px-4 pb-3 border-t border-[#1c1915]">
                  <p className="text-[9px] text-[#4a3f35] uppercase tracking-wider mt-3 mb-2">
                    Cada edición queda registrada
                  </p>
                  {allBlocks.map((b) => {
                    const s     = b.start_minutes ?? b.startMinutes;
                    const e     = b.end_minutes   ?? b.endMinutes;
                    const bArea = b.area_id || b.area;
                    const bColor = AREA_HEX[bArea] || '#6B7280';
                    const proj  = projects.find((p) => p.id === b.project_id);

                    if (editingBlockId === b.id) {
                      return (
                        <BlockEditRow
                          key={b.id}
                          block={b}
                          projects={projects}
                          onSave={handleBlockEdit}
                          onCancel={() => setEditingBlockId(null)}
                        />
                      );
                    }

                    return (
                      <div key={b.id} className="flex items-center gap-2 py-2.5 border-b border-[#1c1915] last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bColor }} />
                        <p className="font-mono text-xs text-[#f5f0e8] shrink-0">
                          {minutesToTime(s)}–{minutesToTime(e)}
                        </p>
                        <p className="text-[#8b7d6b] text-xs truncate flex-1">
                          {proj?.name || AREAS[bArea]?.label || bArea}
                        </p>
                        <button
                          onClick={() => setEditingBlockId(b.id)}
                          className="text-[#4a3f35] hover:text-[#c9a84c] text-sm transition-colors shrink-0 px-1"
                          title="Editar bloque"
                        >
                          ✎
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Close day */}
          <button
            onClick={handleCloseDay}
            className="w-full bg-[#1c1915] border border-[#2a2520] text-[#8b7d6b] hover:text-[#f5f0e8] hover:border-[#4a3f35] py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Cerrar día →
          </button>
        </div>

        {/* ── Right column (58%) ────────────────────────────── */}
        <div className="md:w-[58%] flex flex-col gap-3">

          {/* Score */}
          <div className="bg-[#12100e] rounded-2xl p-4 border border-[#2a2520] flex items-center gap-5">
            <ScoreRing score={score} max={100} size={100} />
            <div>
              <p className="text-[#8b7d6b] text-xs uppercase tracking-widest mb-1">Score del día</p>
              <p className="text-[#c9a84c] text-4xl font-black font-mono">{score}</p>
              <p className="text-[#4a3f35] text-xs">/ 100 puntos</p>
              {config && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] text-[#8b7d6b] bg-[#1c1915] border border-[#2a2520] px-2 py-0.5 rounded">
                    UPS: {config.ups_used ? 0 : config.ups_total}
                  </span>
                  <span className="text-[10px] text-[#8b7d6b] bg-[#1c1915] border border-[#2a2520] px-2 py-0.5 rounded">
                    Esp: {config.special_days_total - config.special_days_used_count}
                  </span>
                  <span className="text-[10px] text-[#8b7d6b] bg-[#1c1915] border border-[#2a2520] px-2 py-0.5 rounded">
                    Rep: {config.replan_days_total - config.replan_days_used_count}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Area minimums */}
          <div className="bg-[#12100e] rounded-2xl p-4 border border-[#2a2520]">
            <p className="text-[10px] text-[#8b7d6b] uppercase tracking-widest mb-3">Mínimos del día</p>
            <div className="flex flex-col gap-3">
              {MANDATORY_AREAS.map((id) => {
                const area = AREAS[id];
                const done = areaMins[id] || 0;
                const ok   = done >= AREA_MINS[id];
                const pct  = Math.min(100, (done / AREA_MINS[id]) * 100);
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={ok ? 'text-[#c9a84c]' : 'text-[#8b7d6b]'}>
                        {ok ? '✓ ' : ''}{area.label}
                      </span>
                      <span className={`font-mono ${ok ? 'text-[#c9a84c]' : 'text-[#4a3f35]'}`}>
                        {minutesToLabel(done)} / {minutesToLabel(AREA_MINS[id])}
                      </span>
                    </div>
                    <div className="h-1 bg-[#2a2520] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: ok ? '#c9a84c' : AREA_HEX[id] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-day chart */}
          {chartData.length > 0 && (
            <div className="bg-[#12100e] rounded-2xl p-4 border border-[#2a2520]">
              <p className="text-[10px] text-[#8b7d6b] uppercase tracking-widest mb-3">Últimos 7 días</p>
              <ResponsiveContainer width="100%" height={72}>
                <BarChart data={chartData} barSize={14}>
                  <XAxis dataKey="date" tick={{ fill: '#4a3f35', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: '#1c1915', border: '1px solid #2a2520', borderRadius: 8 }}
                    labelStyle={{ color: '#f5f0e8', fontSize: 11 }}
                    itemStyle={{ color: '#c9a84c', fontSize: 11 }}
                    formatter={(v) => [`${v} pts`]}
                  />
                  <Bar dataKey="score" radius={3}>
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.score >= 70 ? '#c9a84c' : d.score >= 40 ? '#7a8c4f' : '#8c3040'}
                      />
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
