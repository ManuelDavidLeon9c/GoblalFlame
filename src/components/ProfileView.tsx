import React from 'react';
import { Bell, Check, Heart, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { Game, PriceAlert, User, ViewRoute } from '../types';
import { formatCOP, formatDateCO, formatTimeCO } from '../utils/formatters';
import { GameCard } from './GameCard';

interface ProfileViewProps {
  user: User;
  favoriteGames: Game[];
  alerts: PriceAlert[];
  onSelectGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onSimulatePriceDrop: () => void;
  onMarkAlertRead: (alertId: string) => void;
  onMarkAllAlertsRead: () => void;
  onLogout: () => void;
  onNavigate: (view: ViewRoute) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  favoriteGames,
  alerts,
  onSelectGame,
  onToggleFavorite,
  onSimulatePriceDrop,
  onMarkAlertRead,
  onMarkAllAlertsRead,
  onLogout,
  onNavigate,
}) => {
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-10">
      {/* User Profile Header */}
      <section className="flex flex-col gap-5 rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#00E5FF] text-xl font-extrabold text-[#0B0F19]">
            {user.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#00E5FF]">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Sesión activa verificada</span>
            </div>
            <h1 className="font-display mt-0.5 text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-slate-400">
              {user.email} · Plataformas: {user.preferredPlatforms.join(', ')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1E293B] bg-[#0B0F19] px-4 text-sm font-medium text-slate-200 hover:border-rose-500/60 hover:text-rose-300 transition-colors self-start sm:self-auto"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </section>

      {/* Price Alerts Center (RF06) */}
      <section className="rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 space-y-5">
        <div className="flex flex-col gap-4 border-b border-[#1E293B] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#00E5FF]" />
              <h2 className="font-display text-xl font-bold text-white">
                Centro de Alertas de Precio
              </h2>
              {unreadCount > 0 && (
                <span className="font-mono-num rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Historial aislado para tu cuenta cuando alguno de tus favoritos registra una rebaja en
              COP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAlertsRead}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#1E293B] bg-[#0B0F19] px-3.5 text-xs font-semibold text-slate-200 hover:border-[#00E5FF]"
              >
                <Check className="h-4 w-4 text-[#00E5FF]" />
                Marcar todas como leídas
              </button>
            )}
            <button
              type="button"
              onClick={onSimulatePriceDrop}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-xs font-semibold text-white shadow-lg shadow-[#2563EB]/25 hover:bg-[#1D4ED8] transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Simular baja de precio en favoritos
            </button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-[#1E293B] bg-[#0B0F19]/60 p-8 text-center">
            <p className="text-sm text-slate-300">
              No tienes notificaciones de bajada de precio aún. Usa el botón &ldquo;Simular baja de
              precio en favoritos&rdquo; para probar el flujo en tiempo real.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  alert.isRead
                    ? 'border-[#1E293B] bg-[#0B0F19]/50'
                    : 'border-[#2563EB]/70 bg-[#2563EB]/10'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono-num font-bold text-[#00E5FF]">
                      -{alert.discountPercent}%
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatDateCO(alert.createdAt)} {formatTimeCO(alert.createdAt)}
                    </span>
                    {!alert.isRead && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-rose-400">Sin leer</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white">{alert.message}</p>
                  <p className="font-mono-num text-xs text-slate-400">
                    Precio anterior: {formatCOP(alert.oldPriceCop)} · Nuevo precio:{' '}
                    <span className="font-bold text-[#00E5FF]">{formatCOP(alert.newPriceCop)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alert.isRead && (
                    <button
                      type="button"
                      onClick={() => onMarkAlertRead(alert.id)}
                      className="rounded-lg border border-[#1E293B] bg-[#0B0F19] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                    >
                      Marcar leída
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectGame(alert.gameId)}
                    className="rounded-lg bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    Ver oferta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Favorites List (RF05) */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-400 fill-rose-400" />
              <h2 className="font-display text-xl font-bold text-white">Mi Lista de Favoritos</h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Tus juegos guardados persisten en tu cuenta de forma aislada y alimentan tus alertas y
              noticias.
            </p>
          </div>
          <span className="font-mono-num text-sm font-medium text-slate-300">
            {favoriteGames.length} {favoriteGames.length === 1 ? 'juego guardado' : 'juegos guardados'}
          </span>
        </div>

        {favoriteGames.length === 0 ? (
          <div className="rounded-2xl border border-[#1E293B] bg-[#131B2E] p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-slate-500" />
            <h3 className="font-display mt-3 text-lg font-bold text-white">
              Tu lista de favoritos está vacía
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
              Explora el catálogo de ofertas en COP y presiona el corazón en cualquier título para
              monitorear su precio.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="mt-5 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Ir al catálogo de ofertas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorite={true}
                onSelect={onSelectGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
