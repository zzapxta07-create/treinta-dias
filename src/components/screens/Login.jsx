import { useState } from 'react';
import { useStore } from '../../store/useStore';
import api from '../../api/index.js';

export default function Login() {
  const setAuth = useStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const { data } = await api.post(endpoint, { username, password });

      if (mode === 'register') {
        // After register, login automatically
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
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-3">Sistema de productividad</p>
          <h1 className="text-3xl font-black text-white leading-tight">
            {mode === 'login' ? 'Acceder' : 'Crear cuenta'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#6B7280] block mb-1.5 uppercase tracking-wider">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full bg-[#101010] border border-[#2C2C2C] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#6B7280] transition-colors"
              placeholder="username"
            />
          </div>
          <div>
            <label className="text-xs text-[#6B7280] block mb-1.5 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              className="w-full bg-[#101010] border border-[#2C2C2C] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#6B7280] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-white text-black font-black py-4 rounded-xl text-base active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
          >
            {loading ? 'Cargando...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          className="mt-6 w-full text-center text-[#6B7280] text-sm hover:text-white transition-colors"
        >
          {mode === 'login' ? '¿Primera vez? Crear cuenta' : '¿Ya tenés cuenta? Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
