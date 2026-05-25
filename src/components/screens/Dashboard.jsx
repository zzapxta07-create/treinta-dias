import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../../store/useStore';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { useActiveBlock } from '../../hooks/useActiveBlock';
import { calcDayScore, areaMinutesFromBlocks } from '../../utils/scoring';
import { formatTime, minutesToLabel, minutesToTime } from '../../utils/dateUtils';
import { AREAS, MANDATORY_AREAS } from '../../data/areas';
import ScoreRing from '../ui/ScoreRing';
import ProgressBar from '../ui/ProgressBar';
import AreaBadge from '../ui/AreaBadge';
import api from '../../api/index.js';

const AREA_MINS = { NEGOCIO: 300, SEGUNDA: 60, ESTUDIO: 180, EJERCICIO: 30 };

export default function Dashboard({ setNavScreen }) {
  const now        = useCurrentTime();
  const currentDay = useStore((s) => s.currentDay);
  const config     = useStore((s) => s.config);
  const startEvidenceTimer = useStore((s) => s.startEvidenceTimer);
  const setCurrentDay      = useStore((s) => s.setCurrentDay);
  const activeBlock = useActiveBlock();

  const [recentDays, setRecentDays] = useState([]);

  // Load 7-day chart
  useEffect(() => {
    api.get('/api/stats/history?days=7').then((r) => setRecentDays(r.data.data)).catch(() => {});
  }, []);

  // Evidence trigger: every 60 minutes per active block
  useEffect(() => {
    if (!activeBlock || activeBlock.area_id === 'OTROS') return;
    if (currentDay?.phase !== 'dashboard') return;

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const blockStart  = activeBlock.start_minutes ?? activeBlock.startMinutes;
    const elapsed     = currentMins - blockStart;
    if (elapsed <= 0) return;

    const latestSlot = Math.floor(elapsed / 60);
    if (latestSlot < 1) return;

    const evidences = currentDay.evidences || [];
    for (let slot = 1; slot <= latestSlot; slot++) {
      const done = evidences.some(
        (e) => e.block_id === activeBlock.id && e.slot_index === slot
      );
      if (!done) {
        startEvidenceTimer(activeBlock.id, slot);
        return;
      }
    }
  }, [now.getMinutes(), activeBlock?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentDay) return null;

  const score    = calcDayScore(currentDay);
  const areaMins = areaMinutesFromBlocks(currentDay.blocks || []);

  // Next blocks
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const upcomingBlocks = (currentDay.blocks || [])
    .filter((b) => (b.start_minutes ?? b.startMinutes) > currentMins)
    .slice(0, 3);

  // Pending evidences (missed slots)
  const pendingSlots = [];
  for (const b of currentDay.blocks || []) {
    if (b.area_id === 'OTROS') continue;
    const elapsed    = currentMins - (b.start_minutes ?? b.startMinutes);
    if (elapsed < 60) continue;
    const latestSlot = Math.floor(elapsed / 60);
    for (let slot = 1; slot <= latestSlot; slot++) {
      const done = (currentDay.evidences || []).some(
        (e) => e.block_id === b.id && e.slot_index === slot
      );
      if (!done) pendingSlots.push({ block: b, slot });
    }
  }

  // Chart data
  const chartData = [...recentDays].reverse().map((d) => ({
    date:  d.date_key?.slice(5),
    score: d.score || 0,
  }));

  // Urgent projects (deadline ≤ 5 days)
  const urgentProjects = [];

  async function handleCloseDay() {
    const { data } = await api.put(`/api/days/${currentDay.date_key}/phase`, { phase: 'close' });
    setCurrentDay(data.data);
  }

  return (
    <div className="min-h-screen px-4 py-5 max-w-7xl mx-auto">
      {/* Phrase */}
      {currentDay.daily_phrase && (
        <p className="italic text-[#6B7280] text-sm text-center mb-5 px-4">
          "{currentDay.daily_phrase}"
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        {/* ── Left column (40%) ──────────────────────────────────── */}
        <div className="md:w-[40%] flex flex-col gap-3">
          {/* Clock + active block */}
          <div className="bg-[#101010] rounded-2xl p-4 border border-[#2C2C2C]">
            <div className="flex items-center justify-between">
              <div className="font-mono text-5xl font-black text-white tabular-nums">
                {formatTime(now)}
              </div>
              {activeBlock ? (
                <div className="text-right">
                  <p className="text-green-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                    Activo
                  </p>
                  <p className="text-white text-sm font-mono">
                    {minutesToTime(activeBlock.start_minutes ?? activeBlock.startMinutes)}–
                    {minutesToTime(activeBlock.end_minutes   ?? activeBlock.endMinutes)}
                  </p>
                  <AreaBadge area={activeBlock.area_id || activeBlock.area} />
                </div>
              ) : (
                <p className="text-[#374151] text-sm">Sin bloque activo</p>
              )}
            </div>

            {/* Time remaining in active block */}
            {activeBlock && (() => {
              const end    = activeBlock.end_minutes ?? activeBlock.endMinutes;
              const remain = end - currentMins;
              return remain > 0 ? (
                <div className="mt-3 pt-3 border-t border-[#2C2C2C]">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#6B7280]">Tiempo restante</span>
                    <span className="text-white font-mono">{minutesToLabel(remain)}</span>
                  </div>
                  <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all"
                      style={{
                        width: `${Math.max(0, 100 - (remain / ((activeBlock.end_minutes ?? activeBlock.endMinutes) - (activeBlock.start_minutes ?? activeBlock.startMinutes)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Upcoming blocks */}
          {upcomingBlocks.length > 0 && (
            <div className="bg-[#101010] rounded-2xl p-4 border border-[#2C2C2C]">
              <p className="text-[10px] text-[#6B7280] uppercase tracking-widest mb-3">Próximos</p>
              <div className="flex flex-col gap-2">
                {upcomingBlocks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">
                        {minutesToTime(b.start_minutes ?? b.startMinutes)}
                      </span>
                      <AreaBadge area={b.area_id || b.area} />
                    </div>
                    <span className="text-[#6B7280] text-xs">
                      {minutesToLabel((b.end_minutes ?? b.endMinutes) - (b.start_minutes ?? b.startMinutes))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending evidences */}
          {pendingSlots.length > 0 && (
            <div className="bg-[#101010] rounded-2xl p-4 border border-yellow-500/20">
              <p className="text-[10px] text-yellow-400 uppercase tracking-widest mb-3">
                Evidencias pendientes
              </p>
              <div className="flex flex-col gap-2">
                {pendingSlots.map(({ block, slot }, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">
                        {minutesToTime(block.start_minutes ?? block.startMinutes)} — Slot {slot}
                      </p>
                      <AreaBadge area={block.area_id || block.area} />
                    </div>
                    <button
                      onClick={() => startEvidenceTimer(block.id, slot)}
                      className="text-xs bg-yellow-500 text-black font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                      Registrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close day button */}
          <button
            onClick={handleCloseDay}
            className="w-full bg-[#181818] border border-[#2C2C2C] text-[#6B7280] hover:text-white hover:border-white py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Cerrar día
          </button>
        </div>

        {/* ── Right column (60%) ─────────────────────────────────── */}
        <div className="md:w-[60%] flex flex-col gap-3">
          {/* Score gauge */}
          <div className="bg-[#101010] rounded-2xl p-4 border border-[#2C2C2C] flex items-center gap-6">
            <ScoreRing score={score} max={100} size={110} />
            <div>
              <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-1">Score del día</p>
              <p className="text-white text-4xl font-black font-mono">{score}</p>
              <p className="text-[#6B7280] text-xs">/ 100 puntos</p>
              {config && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] text-[#6B7280] bg-[#181818] px-2 py-0.5 rounded">
                    UPS: {config.ups_used ? 0 : config.ups_total}
                  </span>
                  <span className="text-[10px] text-[#6B7280] bg-[#181818] px-2 py-0.5 rounded">
                    Esp: {config.special_days_total - config.special_days_used_count}
                  </span>
                  <span className="text-[10px] text-[#6B7280] bg-[#181818] px-2 py-0.5 rounded">
                    Rep: {config.replan_days_total - config.replan_days_used_count}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Area minimums */}
          <div className="bg-[#101010] rounded-2xl p-4 border border-[#2C2C2C]">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-widest mb-3">Mínimos del día</p>
            <div className="flex flex-col gap-3">
              {MANDATORY_AREAS.map((id) => {
                const area = AREAS[id];
                const done = areaMins[id] || 0;
                const ok   = done >= AREA_MINS[id];
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={ok ? 'text-green-400' : 'text-[#6B7280]'}>
                        {ok ? '✓ ' : ''}{area.label}
                      </span>
                      <span className={`font-mono ${ok ? 'text-green-400' : 'text-[#6B7280]'}`}>
                        {minutesToLabel(done)} / {minutesToLabel(AREA_MINS[id])}
                      </span>
                    </div>
                    <ProgressBar
                      value={done}
                      max={AREA_MINS[id]}
                      color={area.color}
                      showText={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-day chart */}
          {chartData.length > 0 && (
            <div className="bg-[#101010] rounded-2xl p-4 border border-[#2C2C2C]">
              <p className="text-[10px] text-[#6B7280] uppercase tracking-widest mb-3">Últimos 7 días</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={chartData} barSize={16}>
                  <XAxis dataKey="date" tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: '#181818', border: '1px solid #2C2C2C', borderRadius: 8 }}
                    labelStyle={{ color: '#F0F0F0', fontSize: 11 }}
                    itemStyle={{ color: '#F0F0F0', fontSize: 11 }}
                    formatter={(v) => [`${v} pts`]}
                  />
                  <Bar dataKey="score" radius={4}>
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.score >= 70 ? '#10B981' : d.score >= 40 ? '#F59E0B' : '#EF4444'}
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
