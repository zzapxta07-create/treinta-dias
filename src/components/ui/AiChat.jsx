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
      <div className={`max-w-[88%] px-3 py-2.5 rounded text-sm leading-relaxed ${
        role === 'user'
          ? 'bg-[#f0e6d0] text-[#0a0806] rounded-br-sm font-cinzel text-xs tracking-[0.03em]'
          : 'bg-[#1a1410] text-[#f0e6d0] border border-[#3a2e22] rounded-bl-sm'
      }`}>
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
      <div className="bg-[#1a1410] border border-[#3a2e22] px-4 py-3 rounded rounded-bl-sm flex gap-1.5 items-center">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-[#c9a254] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
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
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[52px] h-[52px] bg-[#110d0a] border border-[#c9a254]/40 text-[#c9a254] rounded-full shadow-xl flex items-center justify-center text-lg font-cinzel active:scale-95 transition-transform hover:bg-[#c9a254]/10"
        title="Consejero IA"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-40 right-4 md:bottom-20 md:right-6 z-50 bg-[#0a0806] border border-[#3a2e22] rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: 'min(92vw, 400px)', maxHeight: '65vh' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1a1410] flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#c9a254]" />
            <span className="font-cinzel text-[#f0e6d0] font-bold text-sm tracking-[0.06em]">Consejero IA</span>
            <span className="font-cinzel text-[#3a2e22] text-[8px] ml-auto uppercase tracking-widest">GPT-4o · DB conectada</span>
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
                  className="font-cinzel text-[8px] tracking-[0.08em] uppercase bg-[#110d0a] border border-[#3a2e22] text-[#5a4838] hover:text-[#c9a254] hover:border-[#c9a254]/40 px-2.5 py-1.5 rounded transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#1a1410] flex gap-2 shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Consulta al consejero..."
              rows={1}
              className="flex-1 bg-[#110d0a] text-[#f0e6d0] text-sm rounded px-3 py-2 outline-none border border-[#3a2e22] focus:border-[#c9a254] resize-none placeholder-[#3a2e22] transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="font-cinzel font-bold bg-[#c9a254] text-[#0a0806] px-3 py-2 rounded text-sm active:scale-95 disabled:opacity-30 transition-transform"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
