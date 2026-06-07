import { useState, useRef, useEffect } from 'react';
import api from '../../api/index.js';

const QUICK_ACTIONS = [
  { label: 'Consejo de Hoy',       msg: 'Analiza mi día de hoy y dame feedback honesto como coach.' },
  { label: 'Crónica Semanal',      msg: 'Genera un resumen de mis últimos 7 días con patrones y recomendaciones.' },
  { label: '¿En qué enfocarme?',   msg: '¿En qué área debo enfocarme el resto del día según mis datos?' },
  { label: 'Mi Progreso General',  msg: 'Muéstrame mi progreso general: proyectos, hábitos y tendencia de scores.' },
];

function Msg({ role, text }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[88%] px-3 py-2.5 rounded text-sm leading-relaxed"
        style={role === 'user'
          ? {
              background: 'linear-gradient(135deg, #d4a956, #c49040)',
              color: '#09080e',
              borderRadius: '8px 8px 2px 8px',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.02em',
            }
          : {
              background: 'linear-gradient(135deg, #1e1b2e 0%, #17142a 100%)',
              color: '#f0e6d0',
              border: '1px solid #2c2740',
              borderRadius: '8px 8px 8px 2px',
            }
        }>
        {text.split('\n').map((line, i) => (
          <span key={i}>{line}{i < text.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="px-4 py-3 rounded flex gap-1.5 items-center"
        style={{ background: '#1e1b2e', border: '1px solid #2c2740', borderRadius: '8px 8px 8px 2px' }}>
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ background: '#d4a956', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function AiChat({ initialMessage = null, forceOpen = false, onOpenChange = null }) {
  const [open,    setOpen]    = useState(!!initialMessage || forceOpen);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    { role: 'assistant', text: 'Saludos, caballero. Soy tu Consejero con acceso a todos tus registros. Consulta sobre tu jornada, semana, empresas o hábitos.' }
  ]);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
    }
  }, [history, open]);

  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      sendMessage(initialMessage);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(msg) {
    const trimmed = msg.trim();
    if (!trimmed || loading) return;

    setOpen(true);
    const userMsg = { role: 'user', text: trimmed };
    setHistory(h => [...h, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiHistory = history
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.text }));

      const { data } = await api.post('/api/ai/chat', {
        message: trimmed,
        history: apiHistory,
      });

      const reply = data?.data?.response || 'Sin respuesta del consejero.';
      setHistory(h => [...h, { role: 'assistant', text: reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Error al conectar. Verificá que n8n esté configurado.';
      setHistory(h => [...h, { role: 'assistant', text: errMsg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <>
      {/* Floating button */}
      <button
        id="ai-chat-trigger"
        onClick={() => { setOpen(v => !v); onOpenChange?.(!open); }}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[52px] h-[52px] rounded-full flex items-center justify-center text-lg font-cinzel active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #1e1b2e 0%, #110e1c 100%)',
          border: '1px solid rgba(212,169,86,0.4)',
          color: '#d4a956',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(212,169,86,0.1)',
        }}
        title="Consejero IA"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-40 right-4 md:bottom-20 md:right-6 z-50 flex flex-col overflow-hidden"
          style={{
            width: 'min(92vw, 400px)',
            maxHeight: '65vh',
            background: '#0c0a14',
            border: '1px solid #2c2740',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 shrink-0"
            style={{ borderBottom: '1px solid #1e1b2e' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#d4a956' }} />
            <span className="font-cinzel text-[#f0e6d0] font-bold text-sm tracking-[0.06em]">Consejero IA</span>
            <span className="font-cinzel text-[#2c2740] text-[8px] ml-auto uppercase tracking-widest">GPT-4o · DB conectada</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
            {history.map((m, i) => <Msg key={i} role={m.role} text={m.text} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          {history.filter(m => m.role === 'user').length === 0 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_ACTIONS.map(({ label, msg }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(msg)}
                  className="font-cinzel text-[8px] tracking-[0.08em] uppercase px-2.5 py-1.5 rounded transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2c2740', color: '#4d4568' }}
                  onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; e.currentTarget.style.borderColor = 'rgba(212,169,86,0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; e.currentTarget.style.borderColor = '#2c2740'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 flex gap-2 shrink-0" style={{ borderTop: '1px solid #1e1b2e' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Consulta al consejero..."
              rows={1}
              style={{
                flex: 1,
                background: '#110e1c',
                color: '#f0e6d0',
                fontSize: '14px',
                borderRadius: '8px',
                padding: '8px 12px',
                border: '1px solid #2c2740',
                outline: 'none',
                resize: 'none',
                fontFamily: "'Crimson Text', serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
              onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="font-cinzel font-bold px-3 py-2 rounded text-sm active:scale-95 disabled:opacity-30 transition-transform"
              style={{ background: '#d4a956', color: '#09080e' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
