import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const RANGE_OPTIONS = [
  { label: '7 días',  value: 7 },
  { label: '30 días', value: 30 },
  { label: 'Todo',    value: 0 },
];

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

function scoreColor(s) {
  if (s >= 70) return '#d4a956';
  if (s >= 40) return '#9490aa';
  return '#9b1f30';
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
    <div style={{ background: '#1e1b2e', border: '1px solid #2c2740', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p className="font-cinzel text-[#4d4568] mb-1 tracking-widest">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function BlockDetail({ block, evidence }) {
  const [imgOpen, setImgOpen] = useState(false);
  const areaColorClass = {
    NEGOCIO: 'border-blue-500', SEGUNDA: 'border-purple-500',
    ESTUDIO: 'border-yellow-500', EJERCICIO: 'border-green-500', OTROS: 'border-[#2c2740]',
  }[block.area_id] || 'border-[#2c2740]';

  const dur = block.end_minutes - block.start_minutes;
  const durLabel = dur >= 60
    ? `${Math.floor(dur/60)}h${dur%60 > 0 ? ` ${dur%60}min` : ''}`
    : `${dur}min`;
  const t = (m) => `${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;

  return (
    <div className={`rounded border-l-4 ${areaColorClass} p-3 mb-2`}
      style={{ background: '#09080e', border: '1px solid #2c2740', borderLeftWidth: 4 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[#f0e6d0] text-sm truncate">
            {block.project_name || AREAS[block.area_id]?.label || block.area_id}
          </p>
          <p className="font-mono text-[#4d4568] text-xs">{t(block.start_minutes)}–{t(block.end_minutes)} · {durLabel}</p>
        </div>
        <span className="font-cinzel text-[8px] tracking-[0.08em] uppercase shrink-0 px-2 py-0.5 rounded" style={
          !evidence
            ? { background: 'rgba(255,255,255,0.04)', color: '#4d4568', border: '1px solid #2c2740' }
            : evidence.no_hice
            ? { background: 'rgba(155,31,48,0.12)', color: '#9b1f30', border: '1px solid rgba(155,31,48,0.3)' }
            : { background: 'rgba(212,169,86,0.12)', color: '#d4a956', border: '1px solid rgba(212,169,86,0.3)' }
        }>
          {!evidence ? 'Sin evidencia' : evidence.no_hice ? 'No hice' : '✓ Hecho'}
        </span>
      </div>

      {evidence && !evidence.no_hice && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid #1e1b2e' }}>
          {evidence.q1 && (
            <p className="text-[#9490aa] text-xs leading-relaxed mb-2 italic">"{evidence.q1}"</p>
          )}
          <div className="flex items-center gap-3">
            {evidence.focus_level && (
              <span className="text-[#4d4568] text-xs">
                Foco: <span className="font-mono text-[#d4a956] font-bold">{evidence.focus_level}/10</span>
              </span>
            )}
            {evidence.photo_data && (
              <button onClick={() => setImgOpen(true)} className="font-cinzel text-[9px] text-[#d4a956]/70 hover:text-[#d4a956] transition-colors uppercase tracking-widest">
                Ver foto
              </button>
            )}
          </div>
        </div>
      )}

      {evidence?.no_hice && evidence.reason && (
        <p className="text-[#9490aa] text-xs mt-1 italic">"{evidence.reason}"</p>
      )}

      {imgOpen && evidence?.photo_data && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImgOpen(false)}>
          <img src={evidence.photo_data} alt="evidencia"
            className="max-w-full max-h-[80vh] rounded object-contain" />
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

  const statusStyle = day?.status === 'complete'
    ? { background: 'rgba(212,169,86,0.12)', color: '#d4a956', border: '1px solid rgba(212,169,86,0.3)' }
    : day?.status === 'lost'
    ? { background: 'rgba(155,31,48,0.12)', color: '#9b1f30', border: '1px solid rgba(155,31,48,0.3)' }
    : { background: 'rgba(255,255,255,0.04)', color: '#4d4568', border: '1px solid #2c2740' };
  const statusLabel = day?.status === 'complete' ? 'Completo'
    : day?.status === 'lost' ? 'Perdido' : 'Parcial';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}>
      <div className="w-full md:max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        style={{
          background: '#0c0a14',
          border: '1px solid #2c2740',
          borderRadius: '16px 16px 0 0',
        }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1e1b2e' }}>
          <div>
            <p className="font-cinzel text-[#f0e6d0] font-bold tracking-[0.05em]">{dateKey}</p>
            {day && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[#d4a956] font-bold text-sm">{day.score ?? '—'} pts</span>
                <span className="font-cinzel text-[8px] tracking-[0.08em] uppercase px-2 py-0.5 rounded"
                  style={statusStyle}>{statusLabel}</span>
                {day.emotional_state && (
                  <span className="text-[#4d4568] text-xs">Espíritu: {day.emotional_state}/10</span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-[#4d4568] hover:text-[#f0e6d0] text-xl leading-none transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && <p className="font-cinzel text-[#4d4568] text-xs text-center py-8 tracking-widest">Cargando crónica...</p>}
          {!loading && !day && <p className="text-[#4d4568] text-sm text-center py-8">Sin datos.</p>}
          {!loading && day && (
            <>
              {day.daily_phrase && (
                <p className="italic text-[#9490aa] text-xs text-center mb-4">"{day.daily_phrase}"</p>
              )}

              <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em] mb-3">
                Bloques ({(day.blocks || []).length})
              </p>

              {(day.blocks || []).length === 0 && (
                <p className="text-[#4d4568] text-xs text-center py-4">Sin bloques.</p>
              )}

              {[...(day.blocks || [])]
                .sort((a, b) => a.start_minutes - b.start_minutes)
                .map(block => {
                  const evidence = (day.evidences || []).find(e => e.block_id === block.id);
                  return <BlockDetail key={block.id} block={block} evidence={evidence} />;
                })}

              {day.close_summary && (
                <div className="mt-4 rounded-lg p-3" style={panelStyle}>
                  <p className="font-cinzel text-[9px] text-[#4d4568] uppercase tracking-[0.2em] mb-2">
                    Crónica del Día
                  </p>
                  <p className="text-[#9490aa] text-sm leading-relaxed whitespace-pre-wrap">
                    {day.close_summary}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const [days,      setDays]      = useState([]);
  const [range,     setRange]     = useState(30);
  const [loading,   setLoading]   = useState(true);
  const [detailKey, setDetailKey] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = range > 0 ? `?days=${range}` : '?days=0';
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-1">
            Archivo Permanente
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">Crónicas</h1>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRange(opt.value)}
              className="font-cinzel text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded transition-colors"
              style={range === opt.value
                ? { background: 'rgba(212,169,86,0.12)', color: '#d4a956', border: '1px solid rgba(212,169,86,0.3)' }
                : { background: 'rgba(255,255,255,0.03)', color: '#4d4568', border: '1px solid #2c2740' }
              }>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        <DiamondOrnament color="#4d4568" size={7} />
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      </div>

      {loading ? (
        <div className="font-cinzel text-[#4d4568] text-xs text-center py-12 tracking-widest uppercase">
          Consultando el archivo...
        </div>
      ) : days.length === 0 ? (
        <div className="text-[#4d4568] text-sm text-center py-12">Sin datos aún.</div>
      ) : (
        <>
          {/* Score chart */}
          <div className="p-4 mb-4" style={panelStyle}>
            <p className="font-cinzel text-[8px] text-[#4d4568] mb-3 uppercase tracking-[0.25em]">Score por Jornada</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={scoreData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#4d4568', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#4d4568', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[2, 2, 0, 0]} name="Score">
                  {scoreData.map((entry, i) => <Cell key={i} fill={scoreColor(entry.score)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {emotionData.length > 1 && (
            <div className="p-4 mb-4" style={panelStyle}>
              <p className="font-cinzel text-[8px] text-[#4d4568] mb-3 uppercase tracking-[0.25em]">Estado del Espíritu</p>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={emotionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#4d4568', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[1, 10]} tick={{ fill: '#4d4568', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#9490aa" strokeWidth={2} dot={false} name="Estado" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {areaData.length > 1 && (
            <div className="p-4 mb-4" style={panelStyle}>
              <p className="font-cinzel text-[8px] text-[#4d4568] mb-3 uppercase tracking-[0.25em]">Horas por Área</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#4d4568', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#4d4568', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {Object.entries(AREA_COLORS).map(([a, color]) => (
                    <Area key={a} type="monotone" dataKey={a} stackId="1"
                      stroke={color} fill={color} fillOpacity={0.35} name={AREAS[a]?.label || a} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3">
                {Object.entries(AREA_COLORS).map(([a, color]) => (
                  <div key={a} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-widest">{AREAS[a]?.label || a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days table */}
          <div className="overflow-hidden" style={panelStyle}>
            <div className="grid grid-cols-4 px-4 py-2.5 font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.2em]"
              style={{ borderBottom: '1px solid #1e1b2e' }}>
              <span>Fecha</span>
              <span className="text-center">Score</span>
              <span className="text-center">Estado</span>
              <span className="text-right">Espíritu</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#1e1b2e' }}>
              {days.map((d) => (
                <button
                  key={d.date_key}
                  onClick={() => setDetailKey(d.date_key)}
                  className="w-full grid grid-cols-4 px-4 py-2.5 text-sm items-center transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="font-mono text-[#9490aa] text-xs text-left">{d.date_key.slice(5)}</span>
                  <span className="text-center font-mono font-bold"
                    style={{ color: d.score ? scoreColor(d.score) : '#2c2740' }}>
                    {d.score ?? '—'}
                  </span>
                  <span className="text-center">
                    <span className="font-cinzel text-[8px] tracking-[0.08em] uppercase px-2 py-0.5 rounded"
                      style={
                        d.status === 'complete'
                          ? { background: 'rgba(212,169,86,0.12)', color: '#d4a956' }
                          : d.status === 'lost'
                          ? { background: 'rgba(155,31,48,0.12)', color: '#9b1f30' }
                          : { color: '#4d4568' }
                      }>
                      {d.status === 'complete' ? 'OK' : d.status === 'lost' ? 'Perdido' : 'En curso'}
                    </span>
                  </span>
                  <span className="text-right font-mono text-[#4d4568] text-xs">
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
