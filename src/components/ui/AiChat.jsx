import { useState, useRef, useEffect } from 'react';
import api from '../../api/index.js';

function Msg({ role, text }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
        role === 'user'
          ? 'bg-white text-black'
          : 'bg-[#1a1a1a] text-[#F0F0F0] border border-[#2C2C2C]'
      }`}>
        {text}
      </div>
    </div>
  );
}

export default function AiChat() {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    { role: 'assistant', text: '¡Hola! Soy tu asistente de productividad. Puedo ayudarte con tu día, tus metas o darte consejos según tus datos. ¿En qué te puedo ayudar?' }
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, open]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', text: msg };
    setHistory(h => [...h, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiHistory = history
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.text }));

      const { data } = await api.post('/api/ai/chat', {
        message: msg,
        history: apiHistory,
      });

      const reply = data.data?.response || data.data?.text || data.data?.message
        || (typeof data.data === 'string' ? data.data : 'No obtuve respuesta.');
      setHistory(h => [...h, { role: 'assistant', text: reply }]);
    } catch {
      setHistory(h => [...h, { role: 'assistant', text: 'Error al conectar con el asistente. Verificá que n8n esté configurado.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 bg-white text-black rounded-full shadow-lg flex items-center justify-center text-xl active:scale-95 transition-transform hover:scale-105"
        title="Asistente IA"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-40 right-4 md:bottom-20 md:right-6 z-50 w-80 md:w-96 bg-[#0f0f0f] border border-[#2C2C2C] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '60vh' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2C2C2C] flex items-center gap-2">
            <span className="text-white font-bold text-sm">✦ Asistente</span>
            <span className="text-[#374151] text-xs ml-auto">GPT · Productividad</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
            {history.map((m, i) => <Msg key={i} role={m.role} text={m.text} />)}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-[#1a1a1a] border border-[#2C2C2C] px-3 py-2 rounded-xl">
                  <span className="text-[#6B7280] text-sm animate-pulse">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#2C2C2C] flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Preguntame algo..."
              rows={1}
              className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#2C2C2C] focus:border-[#444] resize-none"
            />
            <button
              onClick={send}
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
