import React from 'react';
import { Bell, Check, Heart, LogOut, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { Game, NewsItem, PriceAlert, User, ViewRoute } from '../types';
import { formatCOP, formatDateCO, formatTimeCO } from '../utils/formatters';
import { AdminDashboard } from './AdminDashboard';
import { GameCard } from './GameCard';

interface ProfileViewProps {
  user: User;
  allGames: Game[];
  allNews: NewsItem[];
  favoriteGames: Game[];
  alerts: PriceAlert[];
  onSelectGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onSimulatePriceDrop: () => void;
  onMarkAlertRead: (alertId: string) => void;
  onMarkAllAlertsRead: () => void;
  onLogout: () => void;
  onNavigate: (view: ViewRoute) => void;
  onRefreshBootstrap: () => Promise<void>;
  onSyncCheapShark: () => Promise<void>;
  onNotify: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  allGames,
  allNews,
  favoriteGames,
  alerts,
  onSelectGame,
  onToggleFavorite,
  onSimulatePriceDrop,
  onMarkAlertRead,
  onMarkAllAlertsRead,
  onLogout,
  onNavigate,
  onRefreshBootstrap,
  onSyncCheapShark,
  onNotify,
}) => {
  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const isAdmin = user.role === 'administrador';

  return (
    <div className="space-y-10">
      {/* User Profile Header */}
      <section className="flex flex-col gap-5 rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F59E0B] text-xl font-extrabold text-[#120D0A]">
            {user.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#F59E0B]">
              {isAdmin ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Cuenta Administrador · Control total de catálogo y Excel</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Cuenta Usuario · Guardar favoritos y calificar juegos</span>
                </>
              )}
            </div>
            <h1 className="font-display mt-0.5 text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-[#A89789]">
              {user.email} · Plataformas: {user.preferredPlatforms.join(', ')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#33251D] bg-[#150F0B] px-4 text-sm font-medium text-[#D6C7BA] hover:border-red-500/60 hover:text-red-300 transition-colors self-start sm:self-auto"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </section>

      {/* Admin Dashboard (Excel / AppSheet + Games/News CRUD) */}
      {isAdmin && (
        <AdminDashboard
          adminUser={user}
          games={allGames}
          news={allNews}
          onRefreshBootstrap={onRefreshBootstrap}
          onSyncCheapShark={onSyncCheapShark}
          onNotify={onNotify}
        />
      )}

      {/* Price Alerts Center */}
      <section className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 space-y-5">
        <div className="flex flex-col gap-4 border-b border-[#33251D] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#F59E0B]" />
              <h2 className="font-display text-xl font-bold text-white">
                Centro de Alertas de Precio
              </h2>
              {unreadCount > 0 && (
                <span className="font-mono-num rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#A89789]">
              Historial aislado para tu cuenta cuando alguno de tus favoritos registra una rebaja en
              COP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAlertsRead}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#33251D] bg-[#150F0B] px-3.5 text-xs font-semibold text-[#D6C7BA] hover:border-[#F59E0B]"
              >
                <Check className="h-4 w-4 text-[#F59E0B]" />
                Marcar todas como leídas
              </button>
            )}
            <button
              type="button"
              onClick={onSimulatePriceDrop}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#EA580C] px-4 text-xs font-semibold text-white shadow-lg shadow-[#EA580C]/25 hover:bg-[#C2410C] transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Simular baja de precio en favoritos
            </button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-[#33251D] bg-[#150F0B] p-8 text-center">
            <p className="text-sm text-[#D6C7BA]">
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
                    ? 'border-[#33251D] bg-[#150F0B]'
                    : 'border-[#EA580C]/70 bg-[#EA580C]/12'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#A89789]">
                    <span className="font-mono-num font-bold text-[#F59E0B]">
                      -{alert.discountPercent}%
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatDateCO(alert.createdAt)} {formatTimeCO(alert.createdAt)}
                    </span>
                    {!alert.isRead && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-red-400">Sin leer</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white">{alert.message}</p>
                  <p className="font-mono-num text-xs text-[#A89789]">
                    Precio anterior: {formatCOP(alert.oldPriceCop)} · Nuevo precio:{' '}
                    <span className="font-bold text-[#F59E0B]">{formatCOP(alert.newPriceCop)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alert.isRead && (
                    <button
                      type="button"
                      onClick={() => onMarkAlertRead(alert.id)}
                      className="rounded-lg border border-[#33251D] bg-[#150F0B] px-3 py-1.5 text-xs font-medium text-[#D6C7BA] hover:text-white"
                    >
                      Marcar leída
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectGame(alert.gameId)}
                    className="rounded-lg bg-[#EA580C] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#C2410C]"
                  >
                    Ver oferta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Favorites List */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400 fill-red-400" />
              <h2 className="font-display text-xl font-bold text-white">Mi Lista de Favoritos</h2>
            </div>
            <p className="mt-1 text-sm text-[#A89789]">
              Tus juegos guardados persisten en tu cuenta de forma aislada y alimentan tus alertas y
              noticias.
            </p>
          </div>
          <span className="font-mono-num text-sm font-medium text-[#D6C7BA]">
            {favoriteGames.length} {favoriteGames.length === 1 ? 'juego guardado' : 'juegos guardados'}
          </span>
        </div>

        {favoriteGames.length === 0 ? (
          <div className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-[#8C7A6B]" />
            <h3 className="font-display mt-3 text-lg font-bold text-white">
              Tu lista de favoritos está vacía
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-[#A89789]">
              Explora el catálogo de ofertas en COP y presiona el corazón en cualquier título para
              monitorear su precio.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="mt-5 rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C2410C]"
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
