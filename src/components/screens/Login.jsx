import { useState } from 'react';
import { useStore } from '../../store/useStore';
import api from '../../api/index.js';

export default function Login() {
  const setAuth = useStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('login');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const { data } = await api.post(endpoint, { username, password });

      if (mode === 'register') {
        const { data: loginData } = await api.post('/api/auth/login', { username, password });
        setAuth(loginData.data.token, loginData.data.user);
      } else {
        setAuth(data.data.token, data.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center px-4">
      {/* Subtle vignette overlay */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Crest */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#3a2e22] bg-[#110d0a] mb-4">
            <span className="text-[#c9a254] text-3xl">⚔</span>
          </div>
          <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.4em] uppercase mb-2">
            Codex Productivitatis
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-[#f0e6d0] tracking-[0.08em]">
            {mode === 'login' ? 'ACCEDER' : 'REGISTRARSE'}
          </h1>
          {/* Ornament line */}
          <div className="flex items-center gap-3 mt-3 px-8">
            <div className="flex-1 h-px bg-[#3a2e22]" />
            <span className="text-[#5a4838] text-xs">◆</span>
            <div className="flex-1 h-px bg-[#3a2e22]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-cinzel text-[9px] text-[#5a4838] block mb-2 tracking-[0.2em] uppercase">
              Nombre del Caballero
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full bg-[#110d0a] border border-[#3a2e22] rounded-lg px-4 py-3 text-[#f0e6d0] text-base focus:outline-none focus:border-[#c9a254] transition-colors placeholder-[#3a2e22]"
              placeholder="username"
            />
          </div>
          <div>
            <label className="font-cinzel text-[9px] text-[#5a4838] block mb-2 tracking-[0.2em] uppercase">
              Contraseña Secreta
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              className="w-full bg-[#110d0a] border border-[#3a2e22] rounded-lg px-4 py-3 text-[#f0e6d0] text-base focus:outline-none focus:border-[#c9a254] transition-colors placeholder-[#3a2e22]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[#8b1a2a] text-sm bg-[#8b1a2a]/10 border border-[#8b1a2a]/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-[#f0e6d0] text-[#0a0806] font-cinzel font-bold py-4 rounded-lg text-base tracking-[0.1em] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform mt-2"
          >
            {loading ? 'CARGANDO...' : mode === 'login' ? 'ENTRAR AL CASTILLO' : 'CREAR CUENTA'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#3a2e22]" />
          <span className="text-[#5a4838] text-xs">◆</span>
          <div className="flex-1 h-px bg-[#3a2e22]" />
        </div>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          className="w-full text-center text-[#9a8470] text-sm hover:text-[#f0e6d0] transition-colors"
        >
          {mode === 'login' ? '¿Primera vez? Crear cuenta' : '¿Ya tenés cuenta? Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
