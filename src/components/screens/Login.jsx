import { useState } from 'react';
import { useStore } from '../../store/useStore';
import api from '../../api/index.js';
import { HelmetFilled, DiamondOrnament } from '../ui/Ornaments';

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 40%, #09080e 100%)',
      }}>

      {/* Atmospheric radial glow — top */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(90,70,150,0.12) 0%, transparent 70%)',
      }} />

      {/* Vignette edges */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Large faint helm watermark — centered behind form */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none">
        <div style={{ opacity: 0.035 }}>
          <HelmetFilled size={480} color="#d4a956" />
        </div>
      </div>

      {/* Decorative corner lines */}
      <div className="fixed top-6 left-6 w-16 h-16 pointer-events-none" style={{
        borderLeft: '1px solid rgba(212,169,86,0.15)',
        borderTop: '1px solid rgba(212,169,86,0.15)',
      }} />
      <div className="fixed top-6 right-6 w-16 h-16 pointer-events-none" style={{
        borderRight: '1px solid rgba(212,169,86,0.15)',
        borderTop: '1px solid rgba(212,169,86,0.15)',
      }} />
      <div className="fixed bottom-6 left-6 w-16 h-16 pointer-events-none" style={{
        borderLeft: '1px solid rgba(212,169,86,0.15)',
        borderBottom: '1px solid rgba(212,169,86,0.15)',
      }} />
      <div className="fixed bottom-6 right-6 w-16 h-16 pointer-events-none" style={{
        borderRight: '1px solid rgba(212,169,86,0.15)',
        borderBottom: '1px solid rgba(212,169,86,0.15)',
      }} />

      <div className="relative w-full max-w-sm z-10">

        {/* Crest section */}
        <div className="text-center mb-10">
          {/* Helm icon */}
          <div className="relative inline-flex items-center justify-center mb-5">
            {/* Outer glow ring */}
            <div className="absolute w-24 h-24 rounded-full" style={{
              background: 'radial-gradient(circle, rgba(212,169,86,0.12) 0%, transparent 70%)',
            }} />
            {/* Inner circle with helm */}
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1e1b2e 0%, #110e1c 100%)',
                border: '1px solid rgba(212,169,86,0.25)',
                boxShadow: '0 0 20px rgba(212,169,86,0.12), inset 0 1px 0 rgba(212,169,86,0.1)',
              }}>
              <HelmetFilled size={44} color="#d4a956" />
            </div>
          </div>

          <p className="font-cinzel text-[#4d4568] text-[8px] tracking-[0.5em] uppercase mb-2">
            Codex Productivitatis
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-[#f0e6d0] tracking-[0.08em]"
            style={{ textShadow: '0 0 40px rgba(212,169,86,0.15)' }}>
            {mode === 'login' ? 'ACCEDER' : 'REGISTRARSE'}
          </h1>

          {/* Ornamental divider */}
          <div className="flex items-center gap-3 mt-4 px-6">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #2c2740)' }} />
            <DiamondOrnament color="#4d4568" size={8} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #2c2740, transparent)' }} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-cinzel text-[8px] text-[#4d4568] block mb-2 tracking-[0.25em] uppercase">
              Nombre del Caballero
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              placeholder="username"
              style={{
                width: '100%',
                background: '#110e1c',
                border: '1px solid #2c2740',
                borderRadius: '8px',
                padding: '13px 16px',
                color: '#f0e6d0',
                fontFamily: "'Crimson Text', serif",
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#d4a956';
                e.target.style.boxShadow = '0 0 0 3px rgba(212,169,86,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#2c2740';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label className="font-cinzel text-[8px] text-[#4d4568] block mb-2 tracking-[0.25em] uppercase">
              Contraseña Secreta
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#110e1c',
                border: '1px solid #2c2740',
                borderRadius: '8px',
                padding: '13px 16px',
                color: '#f0e6d0',
                fontFamily: "'Crimson Text', serif",
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#d4a956';
                e.target.style.boxShadow = '0 0 0 3px rgba(212,169,86,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#2c2740';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2.5 rounded-lg"
              style={{
                color: '#c43040',
                background: 'rgba(155,31,48,0.08)',
                border: '1px solid rgba(155,31,48,0.25)',
              }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn-primary mt-2"
            style={{ marginTop: '8px' }}
          >
            {loading ? 'CARGANDO...' : mode === 'login' ? 'ENTRAR AL CASTILLO' : 'CREAR CUENTA'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #2c2740)' }} />
          <DiamondOrnament color="#4d4568" size={7} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #2c2740, transparent)' }} />
        </div>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          className="w-full text-center text-[#9490aa] text-sm hover:text-[#f0e6d0] transition-colors"
        >
          {mode === 'login' ? '¿Primera vez? Crear cuenta' : '¿Ya tenés cuenta? Iniciar sesión'}
        </button>

        {/* Bottom label */}
        <p className="text-center font-cinzel text-[#4d4568] text-[7px] tracking-[0.4em] uppercase mt-8">
          Sistema de Disciplina · Vigilia
        </p>
      </div>
    </div>
  );
}
