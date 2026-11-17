import React, { useState, useRef, useEffect } from 'react';
import { Bell, Flame, Menu, Search, User as UserIcon, X, Sparkles, Check } from 'lucide-react';
import { PriceAlert, User, ViewRoute } from '../types';
import { formatCOP, formatDateCO } from '../utils/formatters';

interface NavbarProps {
  currentView: ViewRoute;
  onNavigate: (view: ViewRoute) => void;
  searchQuery: string;
  onSearchSubmit: (query: string) => void;
  user: User | null;
  alerts: PriceAlert[];
  onOpenAuth: () => void;
  onMarkAllAlertsRead: () => void;
  onSimulatePriceDrop: () => void;
  onSelectGame: (gameId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchSubmit,
  user,
  alerts,
  onOpenAuth,
  onMarkAllAlertsRead,
  onSimulatePriceDrop,
  onSelectGame,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(localSearch);
    setMobileMenuOpen(false);
  };

  const navItems: Array<{ id: ViewRoute; label: string }> = [
    { id: 'home', label: 'Inicio' },
    { id: 'catalog', label: 'Ofertas' },
    { id: 'news', label: 'Novedades' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#0B0F19]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] rounded-lg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#00E5FF] text-[#0B0F19] shadow-md shadow-[#2563EB]/25">
            <Flame className="h-5 w-5 fill-current" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Global Flame
          </span>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
          {navItems.map((item) => {
            const active = currentView === item.id || (item.id === 'catalog' && currentView === 'detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'text-[#00E5FF]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute right-0 -bottom-[21px] left-0 h-0.5 bg-[#00E5FF]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Quick Search */}
        <form onSubmit={handleSubmit} className="hidden lg:flex flex-1 max-w-xs items-center">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar juegos en COP..."
              aria-label="Buscar videojuegos"
              className="h-9 w-full rounded-lg border border-[#1E293B] bg-[#131B2E] pr-3 pl-9 text-sm text-white placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none"
            />
          </div>
        </form>

        {/* Right Controls: Alerts & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Alerts Bell */}
          <div className="relative" ref={alertsRef}>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                  return;
                }
                setAlertsOpen((prev) => !prev);
              }}
              aria-label={`Alertas de precio${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#1E293B] bg-[#131B2E] text-slate-200 hover:border-[#2563EB] hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4" />
              {user && unreadCount > 0 && (
                <span className="font-mono-num absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {alertsOpen && user && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#1E293B] bg-[#131B2E] p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
                  <span className="text-sm font-semibold text-white">Alertas de Precio</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllAlertsRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#00E5FF] hover:underline"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Marcar leídas
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAlertsOpen(false);
                        onNavigate('profile');
                      }}
                      className="text-xs font-medium text-slate-300 hover:text-white"
                    >
                      Ver todo
                    </button>
                  </div>
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                  {alerts.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      No tienes alertas registradas todavía.
                    </p>
                  ) : (
                    alerts.slice(0, 5).map((al) => (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => {
                          setAlertsOpen(false);
                          onSelectGame(al.gameId);
                        }}
                        className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                          al.isRead
                            ? 'border-[#1E293B] bg-[#0B0F19]/50 text-slate-300'
                            : 'border-[#2563EB]/60 bg-[#2563EB]/10 text-white'
                        } hover:border-[#00E5FF]/60`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span className="font-semibold text-[#00E5FF]">-{al.discountPercent}%</span>
                          <span>{formatDateCO(al.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs font-medium leading-snug">{al.message}</p>
                        <p className="font-mono-num mt-1 text-[11px] text-slate-400">
                          Antes {formatCOP(al.oldPriceCop)} · Ahora {formatCOP(al.newPriceCop)}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-2.5 border-t border-[#1E293B] pt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSimulatePriceDrop();
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Simular baja de precio en favoritos
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile / Login Button */}
          {user ? (
            <button
              type="button"
              onClick={() => {
                onNavigate('profile');
                setMobileMenuOpen(false);
              }}
              className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'profile'
                  ? 'border-[#00E5FF] bg-[#2563EB]/20 text-white'
                  : 'border-[#1E293B] bg-[#131B2E] text-slate-200 hover:border-[#2563EB]'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2563EB] text-xs font-bold text-white">
                {user.avatarInitials}
              </span>
              <span className="hidden sm:inline max-w-[110px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-3.5 text-sm font-semibold text-white hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Iniciar sesión</span>
              <span className="sm:hidden">Entrar</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1E293B] bg-[#131B2E] text-slate-200 md:hidden"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#1E293B] bg-[#0B0F19] px-4 py-4 md:hidden space-y-3">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar título, género o tienda..."
              className="h-10 w-full rounded-lg border border-[#1E293B] bg-[#131B2E] pr-3 pl-9 text-sm text-white placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none"
            />
          </form>
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#2563EB]/20 text-[#00E5FF]'
                      : 'text-slate-300 hover:bg-[#131B2E] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
