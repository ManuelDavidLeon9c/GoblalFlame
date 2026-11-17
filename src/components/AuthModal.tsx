import React, { useState } from 'react';
import { Flame, Lock, Mail, User as UserIcon, X } from 'lucide-react';
import { Platform } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  reasonMessage?: string;
  onClose: () => void;
  onLogin: (email: string, password: string) => { ok: boolean; error?: string };
  onRegister: (
    name: string,
    email: string,
    password: string,
    platforms: Platform[]
  ) => { ok: boolean; error?: string };
}

const PLATFORMS: Platform[] = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Android/Móvil'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  reasonMessage,
  onClose,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['PC']);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'login') {
      const res = onLogin(email, password);
      if (!res.ok) {
        setError(res.error ?? 'Error al iniciar sesión.');
      }
    } else {
      const res = onRegister(name, email, password, selectedPlatforms);
      if (!res.ok) {
        setError(res.error ?? 'Error al crear la cuenta.');
      }
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setError(null);
    const res = onLogin(demoEmail, 'gamer123');
    if (!res.ok) {
      setError(res.error ?? 'No fue posible iniciar con la cuenta demo.');
    }
  };

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((item) => item !== p) : prev) : [...prev, p]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#00E5FF] text-[#0B0F19]">
              <Flame className="h-5 w-5 fill-current" />
            </span>
            <div>
              <h2 id="auth-modal-title" className="font-display text-xl font-bold text-white">
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className="text-xs text-slate-400">Global Flame Colombia</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar ventana de acceso"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {reasonMessage && (
          <div className="mt-4 rounded-xl border border-[#00E5FF]/35 bg-[#00E5FF]/10 px-3.5 py-2.5 text-xs text-[#00E5FF]">
            {reasonMessage}
          </div>
        )}

        {/* Mode Switch */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-[#1E293B] bg-[#0B0F19] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'login' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ya tengo cuenta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'register' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Registrarme
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-slate-300">
                Nombre completo
              </label>
              <div className="relative mt-1.5">
                <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Santiago Restrepo"
                  className="h-10 w-full rounded-xl border border-[#1E293B] bg-[#0B0F19] pr-3 pl-9 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300">
              Correo electrónico
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@globalflame.co"
                className="h-10 w-full rounded-xl border border-[#1E293B] bg-[#0B0F19] pr-3 pl-9 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300">
              Contraseña
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-10 w-full rounded-xl border border-[#1E293B] bg-[#0B0F19] pr-3 pl-9 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <span className="block text-xs font-medium text-slate-300">
                Plataformas principales
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#00E5FF] bg-[#2563EB]/25 text-[#00E5FF]'
                          : 'border-[#1E293B] bg-[#0B0F19] text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-[#2563EB] text-sm font-semibold text-white hover:bg-[#1D4ED8] transition-colors"
          >
            {mode === 'login' ? 'Ingresar a mi cuenta' : 'Crear cuenta y entrar'}
          </button>
        </form>

        {/* Preconfigured Test Accounts for RNF07 Isolation Verification */}
        <div className="mt-5 border-t border-[#1E293B] pt-4">
          <p className="text-xs font-medium text-slate-400">
            Cuentas de prueba preconfiguradas (aislamiento de datos):
          </p>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('mateo@globalflame.co')}
              className="rounded-lg border border-[#1E293B] bg-[#0B0F19] px-3 py-2 text-left hover:border-[#00E5FF]/60 transition-colors"
            >
              <span className="block text-xs font-semibold text-white">Mateo Ríos</span>
              <span className="block truncate text-[11px] text-slate-400">
                mateo@globalflame.co
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('valeria@globalflame.co')}
              className="rounded-lg border border-[#1E293B] bg-[#0B0F19] px-3 py-2 text-left hover:border-[#00E5FF]/60 transition-colors"
            >
              <span className="block text-xs font-semibold text-white">Valeria Gómez</span>
              <span className="block truncate text-[11px] text-slate-400">
                valeria@globalflame.co
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
