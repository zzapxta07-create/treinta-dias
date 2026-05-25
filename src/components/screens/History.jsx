import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';

const RANGE_OPTIONS = [
  { label: '7 días',  value: 7 },
  { label: '30 días', value: 30 },
  { label: 'Todo',    value: 0 },
];

function scoreColor(s) {
  if (s >= 70) return '#22c55e';
  if (s >= 40) return '#eab308';
  return '#ef4444';
}

const AREA_COLORS = {
  NEGOCIO:   '#60a5fa',
  SEGUNDA:   '#a78bfa',
  ESTUDIO:   '#fbbf24',
  EJERCICIO: '#34d399',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#2C2C2C] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#6B7280] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ── Day Detail Modal ──────────────────────────────────────────────────────────

function BlockDetail({ block, evidence }) {
  const [imgOpen, setImgOpen] = useState(false);
  const areaColor = {
    NEGOCIO: 'border-blue-500', SEGUNDA: 'border-purple-500',
    ESTUDIO: 'border-yellow-500', EJERCICIO: 'border-green-500', OTROS: 'border-gray-600',
  }[block.area_id] || 'border-gray-600';

  const dur = block.end_minutes - block.start_minutes;
  const durLabel = dur >= 60
    ? `${Math.floor(dur/60)}h${dur%60 > 0 ? ` ${dur%60}min` : ''}`
    : `${dur}min`;
  const t = (m) => `${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;

  return (
    <div className={`bg-[#0d0d0d] rounded-xl border-l-4 ${areaColor} border border-[#2C2C2C] p-3 mb-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {block.project_name || AREAS[block.area_id]?.label || block.area_id}
          </p>
          <p className="text-[#6B7280] text-xs">{t(block.start_minutes)}–{t(block.end_minutes)} · {durLabel}</p>
        </div>
        <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-md ${
          !evidence              ? 'bg-[#222] text-[#6B7280]'      :
          evidence.no_hice      ? 'bg-red-900 text-red-400'        :
                                  'bg-green-900 text-green-400'
        }`}>
          {!evidence ? 'Sin evidencia' : evidence.no_hice ? 'No hice' : '✓ Hecho'}
        </span>
      </div>

      {evidence && !evidence.no_hice && (
        <div className="mt-2 pt-2 border-t border-[#1a1a1a]">
          {evidence.q1 && (
            <p className="text-[#F0F0F0] text-xs leading-relaxed mb-2">"{evidence.q1}"</p>
          )}
          <div className="flex items-center gap-3">
            {evidence.focus_level && (
              <span className="text-[#6B7280] text-xs">
                Foco: <span className="text-white font-mono font-bold">{evidence.focus_level}/10</span>
              </span>
            )}
            {evidence.photo_data && (
              <button onClick={() => setImgOpen(true)} className="text-xs text-blue-400 underline">
                Ver foto
              </button>
            )}
          </div>
        </div>
      )}

      {evidence?.no_hice && evidence.reason && (
        <p className="text-[#6B7280] text-xs mt-1 italic">"{evidence.reason}"</p>
      )}

      {imgOpen && evidence?.photo_data && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImgOpen(false)}>
          <img src={evidence.photo_data} alt="evidencia"
            className="max-w-full max-h-[80vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

function DayDetail({ dateKey, onClose }) {
  const [day,     setDay]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/days/${dateKey}`)
       .then(r  => setDay(r.data.data))
       .catch(() => setDay(null))
       .finally(() => setLoading(false));
  }, [dateKey]);

  const statusColor = day?.status === 'complete' ? 'bg-green-900 text-green-400'
    : day?.status === 'lost' ? 'bg-red-900 text-red-400' : 'bg-[#222] text-[#6B7280]';
  const statusLabel = day?.status === 'complete' ? 'Completo'
    : day?.status === 'lost' ? 'Perdido' : 'Parcial';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#2C2C2C] rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
          <div>
            <p className="text-white font-black">{dateKey}</p>
            {day && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-white font-mono font-bold text-sm">{day.score ?? '—'} pts</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${statusColor}`}>{statusLabel}</span>
                {day.emotional_state && (
                  <span className="text-[#6B7280] text-xs">Emoc: {day.emotional_state}/10</span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && <p className="text-[#6B7280] text-sm text-center py-8">Cargando...</p>}
          {!loading && !day && <p className="text-[#6B7280] text-sm text-center py-8">Sin datos.</p>}
          {!loading && day && (
            <>
              {day.daily_phrase && (
                <p className="italic text-[#6B7280] text-xs text-center mb-4">"{day.daily_phrase}"</p>
              )}

              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-3">
                Bloques ({(day.blocks || []).length})
              </p>

              {(day.blocks || []).length === 0 && (
                <p className="text-[#6B7280] text-xs text-center py-4">Sin bloques.</p>
              )}

              {[...(day.blocks || [])]
                .sort((a, b) => a.start_minutes - b.start_minutes)
                .map(block => {
                  const evidence = (day.evidences || []).find(e => e.block_id === block.id);
                  return <BlockDetail key={block.id} block={block} evidence={evidence} />;
                })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function History() {
  const [days,      setDays]      = useState([]);
  const [range,     setRange]     = useState(30);
  const [loading,   setLoading]   = useState(true);
  const [detailKey, setDetailKey] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = range > 0 ? `?days=${range}` : '';
    api.get(`/api/stats/history${q}`)
       .then((r) => setDays(r.data.data || []))
       .catch(() => setDays([]))
       .finally(() => setLoading(false));
  }, [range]);

  const scored      = days.filter((d) => d.status === 'complete' || d.status === 'lost');
  const scoreData   = scored.map((d) => ({ date: d.date_key.slice(5), score: d.score || 0 }));
  const emotionData = days.filter((d) => d.emotional_state != null)
    .map((d) => ({ date: d.date_key.slice(5), value: d.emotional_state }));
  const areaData = days.map((d) => {
    const row = { date: d.date_key.slice(5) };
    Object.keys(AREA_COLORS).forEach((a) => {
      row[a] = Math.round((d.area_minutes?.[a] || 0) / 60 * 10) / 10;
    });
    return row;
  });

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24">
      <div className="mb-5">
        <p className="text-xs text-[#374151] text-center">
          ✦ Usá el chat IA para pedir un resumen semanal o análisis de historial
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black">Historial</h1>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                range === opt.value ? 'bg-white text-black' : 'bg-[#181818] text-[#6B7280] hover:text-white'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-[#6B7280] text-sm text-center py-12">Cargando...</div>
      ) : days.length === 0 ? (
        <div className="text-[#6B7280] text-sm text-center py-12">Sin datos aún.</div>
      ) : (
        <>
          <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
            <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wider">Score por día</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={scoreData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[3, 3, 0, 0]} name="Score">
                  {scoreData.map((entry, i) => <Cell key={i} fill={scoreColor(entry.score)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {emotionData.length > 1 && (
            <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
              <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wider">Estado emocional</p>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={emotionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[1, 10]} tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={false} name="Estado" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {areaData.length > 1 && (
            <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
              <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wider">Horas por área</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {Object.entries(AREA_COLORS).map(([a, color]) => (
                    <Area key={a} type="monotone" dataKey={a} stackId="1"
                      stroke={color} fill={color} fillOpacity={0.5} name={AREAS[a]?.label || a} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3">
                {Object.entries(AREA_COLORS).map(([a, color]) => (
                  <div key={a} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-[#6B7280]">{AREAS[a]?.label || a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days table — tap row to open detail */}
          <div className="bg-[#101010] rounded-2xl border border-[#2C2C2C] overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2 text-xs text-[#374151] uppercase tracking-wider border-b border-[#2C2C2C]">
              <span>Fecha</span>
              <span className="text-center">Score</span>
              <span className="text-center">Estado</span>
              <span className="text-right">Emoc.</span>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              {days.map((d) => (
                <button
                  key={d.date_key}
                  onClick={() => setDetailKey(d.date_key)}
                  className="w-full grid grid-cols-4 px-4 py-2.5 text-sm items-center hover:bg-[#181818] transition-colors"
                >
                  <span className="text-[#6B7280] font-mono text-xs text-left">{d.date_key.slice(5)}</span>
                  <span className="text-center font-mono font-bold"
                    style={{ color: d.score ? scoreColor(d.score) : '#374151' }}>
                    {d.score ?? '—'}
                  </span>
                  <span className="text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      d.status === 'complete' ? 'bg-green-900 text-green-400' :
                      d.status === 'lost'     ? 'bg-red-900 text-red-400'    :
                                               'bg-[#222] text-[#6B7280]'
                    }`}>
                      {d.status === 'complete' ? 'OK' : d.status === 'lost' ? 'Perdido' : 'En curso'}
                    </span>
                  </span>
                  <span className="text-right text-[#6B7280] font-mono text-xs">
                    {d.emotional_state ?? '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {detailKey && <DayDetail dateKey={detailKey} onClose={() => setDetailKey(null)} />}
    </div>
  );
}
