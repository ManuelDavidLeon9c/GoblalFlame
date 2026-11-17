import React, { useState } from 'react';
import { Flame, Lock, Mail, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { Platform, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  reasonMessage?: string;
  onClose: () => void;
  onLogin: (
    email: string,
    password: string,
    expectedRole: UserRole
  ) => Promise<{ ok: boolean; error?: string }>;
  onRegister: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    platforms: Platform[]
  ) => Promise<{ ok: boolean; error?: string }>;
}

const PLATFORMS: Platform[] = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Android/Móvil'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  reasonMessage,
  onClose,
  onLogin,
  onRegister,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('usuario');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['PC']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await onLogin(email, password, selectedRole);
        if (!res.ok) {
          setError(res.error ?? 'Error al iniciar sesión.');
        }
      } else {
        const res = await onRegister(name, email, password, selectedRole, selectedPlatforms);
        if (!res.ok) {
          setError(res.error ?? 'Error al crear la cuenta.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string, role: UserRole) => {
    setError(null);
    setSelectedRole(role);
    setSubmitting(true);
    try {
      const res = await onLogin(demoEmail, demoPass, role);
      if (!res.ok) {
        setError(res.error ?? 'No fue posible iniciar con la cuenta demo.');
      }
    } finally {
      setSubmitting(false);
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
      <div className="max-h-[92vh] overflow-y-auto w-full max-w-md rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F59E0B] text-[#120D0A]">
              <Flame className="h-5 w-5 fill-current" />
            </span>
            <div>
              <h2 id="auth-modal-title" className="font-display text-xl font-bold text-white">
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className="text-xs text-[#A89789]">Selecciona tu tipo de acceso</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#A89789] hover:bg-[#33251D] hover:text-white"
            aria-label="Cerrar ventana de acceso"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {reasonMessage && (
          <div className="mt-4 rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3.5 py-2.5 text-xs text-[#FBBF24]">
            {reasonMessage}
          </div>
        )}

        {/* Role Selector: Usuario vs Administrador */}
        <div className="mt-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-[#A89789]">
            1. Elige cómo deseas ingresar
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('usuario');
                setError(null);
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                selectedRole === 'usuario'
                  ? 'border-[#F59E0B] bg-[#EA580C]/20 text-white'
                  : 'border-[#33251D] bg-[#150F0B] text-[#A89789] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <UserIcon className="h-4 w-4 text-[#F59E0B]" />
                <span>Usuario</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug opacity-85">
                Guardar juegos y calificar con reseñas.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('administrador');
                setError(null);
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                selectedRole === 'administrador'
                  ? 'border-[#F59E0B] bg-[#EA580C]/20 text-white'
                  : 'border-[#33251D] bg-[#150F0B] text-[#A89789] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <ShieldCheck className="h-4 w-4 text-[#F59E0B]" />
                <span>Administrador</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug opacity-85">
                Editar juegos, novedades y cuentas Excel.
              </p>
            </button>
          </div>
        </div>

        {/* Login vs Register */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-[#33251D] bg-[#150F0B] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'login' ? 'bg-[#EA580C] text-white' : 'text-[#A89789] hover:text-white'
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
              mode === 'register' ? 'bg-[#EA580C] text-white' : 'text-[#A89789] hover:text-white'
            }`}
          >
            Registrarme
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-[#D6C7BA]">
                Nombre completo
              </label>
              <div className="relative mt-1">
                <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#A89789]" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Santiago Restrepo"
                  className="h-10 w-full rounded-xl border border-[#33251D] bg-[#150F0B] pr-3 pl-9 text-sm text-white placeholder-[#8C7A6B] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-[#D6C7BA]">
              Correo electrónico
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#A89789]" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'administrador' ? 'admin@globalflame.co' : 'usuario@globalflame.co'
                }
                className="h-10 w-full rounded-xl border border-[#33251D] bg-[#150F0B] pr-3 pl-9 text-sm text-white placeholder-[#8C7A6B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-[#D6C7BA]">
              Contraseña
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#A89789]" />
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-10 w-full rounded-xl border border-[#33251D] bg-[#150F0B] pr-3 pl-9 text-sm text-white placeholder-[#8C7A6B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <span className="block text-xs font-medium text-[#D6C7BA]">
                Plataformas principales
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#F59E0B] bg-[#EA580C]/25 text-[#F59E0B]'
                          : 'border-[#33251D] bg-[#150F0B] text-[#A89789] hover:text-white'
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
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-[#EA580C] text-sm font-semibold text-white hover:bg-[#C2410C] transition-colors disabled:opacity-60"
          >
            {submitting
              ? 'Verificando...'
              : mode === 'login'
                ? `Ingresar como ${selectedRole === 'administrador' ? 'Administrador' : 'Usuario'}`
                : `Crear cuenta de ${selectedRole === 'administrador' ? 'Administrador' : 'Usuario'}`}
          </button>
        </form>

        {/* Demo Accounts by Role */}
        <div className="mt-5 border-t border-[#33251D] pt-4">
          <p className="text-xs font-medium text-[#A89789]">
            Acceso rápido de prueba por rol:
          </p>
          <div className="mt-2.5 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@globalflame.co', 'admin123', 'administrador')}
              className="flex items-center justify-between rounded-lg border border-[#F59E0B]/40 bg-[#150F0B] px-3 py-2 text-left hover:border-[#F59E0B] transition-colors"
            >
              <div>
                <span className="block text-xs font-semibold text-[#F59E0B]">
                  Administrador · Carlos Mendoza
                </span>
                <span className="block text-[11px] text-[#A89789]">
                  admin@globalflame.co · Clave: admin123
                </span>
              </div>
              <ShieldCheck className="h-4 w-4 text-[#F59E0B]" />
            </button>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('mateo@globalflame.co', 'gamer123', 'usuario')}
                className="rounded-lg border border-[#33251D] bg-[#150F0B] px-3 py-2 text-left hover:border-[#EA580C] transition-colors"
              >
                <span className="block text-xs font-semibold text-white">Usuario · Mateo</span>
                <span className="block truncate text-[11px] text-[#A89789]">
                  mateo@globalflame.co
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('valeria@globalflame.co', 'gamer123', 'usuario')}
                className="rounded-lg border border-[#33251D] bg-[#150F0B] px-3 py-2 text-left hover:border-[#EA580C] transition-colors"
              >
                <span className="block text-xs font-semibold text-white">Usuario · Valeria</span>
                <span className="block truncate text-[11px] text-[#A89789]">
                  valeria@globalflame.co
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
