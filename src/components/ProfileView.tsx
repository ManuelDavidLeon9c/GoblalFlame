import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Camera,
  Check,
  Heart,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
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
  onUpdateAvatar: (avatarUrl: string | null) => Promise<boolean>;
  onDeleteAccount: () => Promise<boolean>;
  onNavigate: (view: ViewRoute) => void;
  onRefreshBootstrap: () => Promise<void>;
  onSyncCheapShark: () => Promise<void>;
  onNotify: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

async function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no corresponde a una imagen válida.'));
      img.onload = () => {
        const size = 220;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Tu navegador no permite procesar imágenes.'));
          return;
        }

        // Center-crop square fit
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        const output = canvas.toDataURL('image/jpeg', 0.85);
        resolve(output);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
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
  onUpdateAvatar,
  onDeleteAccount,
  onNavigate,
  onRefreshBootstrap,
  onSyncCheapShark,
  onNotify,
}) => {
  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const isAdmin = user.role === 'administrador';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify('Archivo no válido', 'Selecciona una imagen PNG, JPG, WEBP o GIF.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onNotify('Imagen muy grande', 'El archivo debe pesar menos de 5 MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await onUpdateAvatar(dataUrl);
    } catch (err) {
      onNotify(
        'Error al subir foto',
        err instanceof Error ? err.message : 'Intenta con otra imagen.',
        'error'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await onUpdateAvatar(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteConfirmed) return;
    setDeletingAccount(true);
    try {
      const ok = await onDeleteAccount();
      if (ok) {
        setDeleteModalOpen(false);
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* User Profile Header with Photo Upload */}
      <section className="flex flex-col gap-5 rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#EA580C]/40 bg-gradient-to-br from-[#EA580C] to-[#F59E0B] shadow-lg shadow-[#EA580C]/20">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`Foto de perfil de ${user.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-[#120D0A]">
                  {user.avatarInitials}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Subir o cambiar foto de perfil"
                title="Cambiar foto de perfil"
                className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-60"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelected}
              className="hidden"
            />
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

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#33251D] bg-[#150F0B] px-3 py-1.5 text-xs font-medium text-[#FAF5F0] hover:border-[#F59E0B] transition-colors disabled:opacity-60"
              >
                <Camera className="h-3.5 w-3.5 text-[#F59E0B]" />
                {user.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
              </button>

              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#33251D] bg-[#150F0B] px-2.5 py-1.5 text-xs font-medium text-[#A89789] hover:text-white transition-colors disabled:opacity-60"
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#33251D] bg-[#150F0B] px-4 text-sm font-medium text-[#D6C7BA] hover:border-[#F59E0B] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
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

      {/* Account Danger Zone (Delete Account with Warning) */}
      <section className="rounded-2xl border border-red-500/35 bg-[#1D1511] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Eliminar cuenta</h2>
              <p className="mt-1 text-sm text-[#A89789]">
                Esta acción eliminará permanentemente tu acceso, tus favoritos, tus alertas y tu
                registro en la base de datos y el archivo Excel de Global Flame.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmed(false);
              setDeleteModalOpen(true);
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-600/15 px-4 text-sm font-semibold text-red-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar mi cuenta
          </button>
        </div>
      </section>

      {/* Warning Confirmation Modal before Deleting Account */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-500/45 bg-[#1D1511] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="delete-account-title" className="font-display text-lg font-bold text-white">
                    ¿Eliminar tu cuenta permanentemente?
                  </h2>
                  <p className="text-xs text-[#A89789]">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg p-1 text-[#A89789] hover:bg-[#261A14] hover:text-white"
                aria-label="Cancelar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs leading-relaxed text-red-200 space-y-1.5">
              <p className="font-semibold text-red-300">
                Advertencia: esta acción no se puede deshacer.
              </p>
              <p>
                Se borrará tu usuario de la base de datos y del registro Excel, junto con tu foto de
                perfil, tu lista de videojuegos favoritos y tus alertas de precio guardadas.
              </p>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#D6C7BA] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#33251D] bg-[#150F0B] accent-red-600"
              />
              <span>
                Entiendo que perderé acceso a esta cuenta y que mis datos serán eliminados de forma
                permanente.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 border-t border-[#33251D] pt-4">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingAccount}
                className="rounded-xl border border-[#33251D] px-4 py-2 text-xs font-semibold text-[#D6C7BA] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={!deleteConfirmed || deletingAccount}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deletingAccount ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
