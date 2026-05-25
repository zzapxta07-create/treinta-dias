import { useState, useRef, useEffect } from 'react';
import api from '../../api/index.js';

const QUICK_ACTIONS = [
  { label: 'Coach de hoy',       msg: 'Analiza mi día de hoy y dame feedback honesto como coach.' },
  { label: 'Resumen semanal',    msg: 'Genera un resumen de mis últimos 7 días con patrones y recomendaciones.' },
  { label: '¿En qué enfocarme?', msg: '¿En qué área debo enfocarme el resto del día según mis datos?' },
  { label: 'Mi progreso',        msg: 'Muéstrame mi progreso general: proyectos, hábitos y tendencia de scores.' },
];

function Msg({ role, text }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[88%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
        role === 'user'
          ? 'bg-white text-black rounded-br-sm'
          : 'bg-[#1a1a1a] text-[#F0F0F0] border border-[#2C2C2C] rounded-bl-sm'
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
      <div className="bg-[#1a1a1a] border border-[#2C2C2C] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function AiChat({ initialMessage = null }) {
  const [open,    setOpen]    = useState(!!initialMessage);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    { role: 'assistant', text: '¡Hola! Soy tu coach de productividad con acceso a todos tus datos. Preguntame sobre tu día, semana, proyectos o hábitos.' }
  ]);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
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

      const reply = data?.data?.response || 'Sin respuesta del asistente.';
      setHistory(h => [...h, { role: 'assistant', text: reply }]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al conectar. Verificá que n8n esté configurado.';
      setHistory(h => [...h, { role: 'assistant', text: msg }]);
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
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-13 h-13 w-[52px] h-[52px] bg-white text-black rounded-full shadow-xl flex items-center justify-center text-lg font-black active:scale-95 transition-transform hover:scale-105"
        title="Coach IA"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-40 right-4 md:bottom-20 md:right-6 z-50 bg-[#0a0a0a] border border-[#2C2C2C] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: 'min(92vw, 400px)', maxHeight: '65vh' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-white font-bold text-sm">Coach IA</span>
            <span className="text-[#374151] text-xs ml-auto">GPT-4o · DB conectada</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
            {history.map((m, i) => <Msg key={i} role={m.role} text={m.text} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions (only when no user messages yet) */}
          {history.filter(m => m.role === 'user').length === 0 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_ACTIONS.map(({ label, msg }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(msg)}
                  className="text-xs bg-[#1a1a1a] border border-[#2C2C2C] text-[#6B7280] hover:text-white hover:border-[#444] px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#1a1a1a] flex gap-2 shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Preguntame algo sobre tu productividad..."
              rows={1}
              className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#2C2C2C] focus:border-[#444] resize-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="bg-white text-black font-black px-3 py-2 rounded-xl text-sm active:scale-95 disabled:opacity-30 transition-transform"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
