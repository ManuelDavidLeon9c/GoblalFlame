import { useCallback, useEffect, useMemo, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CatalogView } from './components/CatalogView';
import { ChatbotWidget } from './components/ChatbotWidget';
import { Footer } from './components/Footer';
import { GameDetailView } from './components/GameDetailView';
import { HomeView } from './components/HomeView';
import { Navbar } from './components/Navbar';
import { NewsView } from './components/NewsView';
import { ProfileView } from './components/ProfileView';
import { ToastContainer } from './components/ToastContainer';
import {
  addGameReviewAsync,
  deleteGameReviewAsync,
  getAllGames,
  getCurrentUser,
  getGameById,
  getQAState,
  getReviewsForGame,
  getStoreOffersForGame,
  getUserAlerts,
  getUserFavorites,
  initializeDatabase,
  loginUserAsync,
  logoutUser,
  markAllAlertsAsRead,
  markAlertAsRead,
  queryGames,
  queryNews,
  registerUserAsync,
  simulatePriceDropForUser,
  syncWithServerDatabase,
  toggleUserFavorite,
  triggerCheapSharkLiveSync,
  updateQAState,
} from './services/databaseService';
import {
  CatalogFilters,
  Platform,
  PriceAlert,
  QAState,
  ToastMessage,
  User,
  UserRole,
  ViewRoute,
} from './types';
import { formatCOP } from './utils/formatters';

const DEFAULT_FILTERS: CatalogFilters = {
  search: '',
  platforms: [],
  genres: [],
  offerTypes: [],
  maxPriceCop: 300000,
  freeOnly: false,
  sortBy: 'popular',
};

const VIEW_TO_HTML: Record<ViewRoute, string> = {
  home: '/index.html',
  catalog: '/ofertas.html',
  news: '/novedades.html',
  profile: '/perfil.html',
  detail: '/detalle.html',
};

interface AppProps {
  initialView?: ViewRoute;
}

export default function App({ initialView = 'home' }: AppProps) {
  const [initialized, setInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<ViewRoute>(initialView);
  const [selectedGameId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  });
  const [filters, setFilters] = useState<CatalogFilters>(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';
    const plat = params.get('platform') as Platform | null;
    return {
      ...DEFAULT_FILTERS,
      search: q,
      platforms: plat ? [plat] : [],
    };
  });

  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [qaState, setQaState] = useState<QAState>({
    simulateApiFailure: false,
    simulateChatbotFailure: false,
  });
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [lastCheapSharkSync, setLastCheapSharkSync] = useState<string | null>(null);
  const [isSyncingCheapShark, setIsSyncingCheapShark] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);
  const [pendingFavGameId, setPendingFavGameId] = useState<string | null>(null);
  const [pendingViewAfterAuth, setPendingViewAfterAuth] = useState<ViewRoute | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (
      title: string,
      description?: string,
      type: ToastMessage['type'] = 'info'
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const syncUserSessionData = useCallback((activeUser: User | null) => {
    if (!activeUser) {
      setFavoriteIds([]);
      setAlerts([]);
      return;
    }
    const favs = getUserFavorites(activeUser.id);
    setFavoriteIds(favs.map((f) => f.gameId));
    setAlerts(getUserAlerts(activeUser.id));
  }, []);

  const refreshFromServer = useCallback(async () => {
    const data = await syncWithServerDatabase();
    setLastCheapSharkSync(data.lastCheapSharkSync);
    setCatalogVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    initializeDatabase();
    const activeUser = getCurrentUser();
    setUser(activeUser);
    syncUserSessionData(activeUser);
    setQaState(getQAState());
    setInitialized(true);

    refreshFromServer();
  }, [syncUserSessionData, refreshFromServer]);

  const navigateTo = useCallback(
    (view: ViewRoute) => {
      if (view === 'profile' && !user) {
        setPendingViewAfterAuth('profile');
        setAuthReason('Inicia sesión como Usuario o Administrador para acceder a tu perfil.');
        setAuthModalOpen(true);
        return;
      }
      const targetHtml = VIEW_TO_HTML[view];
      if (window.location.pathname !== targetHtml) {
        window.location.href = targetHtml;
        return;
      }
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [user]
  );

  const handleSelectGame = useCallback((gameId: string) => {
    window.location.href = `/detalle.html?id=${encodeURIComponent(gameId)}`;
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
    if (window.location.pathname !== '/ofertas.html') {
      window.location.href = `/ofertas.html?q=${encodeURIComponent(query)}`;
      return;
    }
    setFilters((prev) => ({ ...prev, search: query }));
    setCurrentView('catalog');
  }, []);

  const handleNavigateCatalogWithPlatform = useCallback((platform: Platform) => {
    window.location.href = `/ofertas.html?platform=${encodeURIComponent(platform)}`;
  }, []);

  const handleUpdateFilters = useCallback((partial: Partial<CatalogFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleSyncCheapShark = useCallback(async () => {
    setIsSyncingCheapShark(true);
    try {
      const res = await triggerCheapSharkLiveSync();
      if (!res.ok) {
        pushToast('No se pudo sincronizar CheapShark', res.error, 'warning');
        return;
      }
      setCatalogVersion((v) => v + 1);
      pushToast(
        'CheapShark API sincronizada',
        `${res.added ?? 0} ofertas nuevas y ${res.updated ?? 0} actualizadas en COP.`,
        'success'
      );
    } finally {
      setIsSyncingCheapShark(false);
    }
  }, [pushToast]);

  const handleToggleFavorite = useCallback(
    (gameId: string) => {
      if (!user) {
        setPendingFavGameId(gameId);
        setAuthReason('Inicia sesión como Usuario para guardar videojuegos en tu lista de favoritos.');
        setAuthModalOpen(true);
        return;
      }

      const res = toggleUserFavorite(user.id, gameId);
      if (res.ok) {
        setFavoriteIds(res.favorites.map((f) => f.gameId));
        const game = getGameById(gameId);
        if (res.added) {
          pushToast(
            'Agregado a tus favoritos',
            game ? `${game.title} guardado en tu cuenta.` : undefined,
            'success'
          );
        } else {
          pushToast(
            'Eliminado de tus favoritos',
            game ? `${game.title} fue retirado de tu lista.` : undefined,
            'info'
          );
        }
      }
    },
    [user, pushToast]
  );

  const handleLogin = useCallback(
    async (email: string, password: string, expectedRole: UserRole) => {
      const res = await loginUserAsync(email, password, expectedRole);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      setUser(res.user);
      syncUserSessionData(res.user);
      setAuthModalOpen(false);
      setAuthReason(undefined);
      pushToast(
        `Bienvenido, ${res.user.name.split(' ')[0]}`,
        res.user.role === 'administrador'
          ? 'Sesión de Administrador activa.'
          : 'Sesión de Usuario activa.',
        'success'
      );

      if (pendingFavGameId) {
        const favRes = toggleUserFavorite(res.user.id, pendingFavGameId);
        if (favRes.ok) {
          setFavoriteIds(favRes.favorites.map((f) => f.gameId));
        }
        setPendingFavGameId(null);
      }

      if (pendingViewAfterAuth === 'profile') {
        setPendingViewAfterAuth(null);
        window.location.href = '/perfil.html';
      }

      return { ok: true };
    },
    [pendingFavGameId, pendingViewAfterAuth, pushToast, syncUserSessionData]
  );

  const handleRegister = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole,
      platforms: Platform[]
    ) => {
      const res = await registerUserAsync(name, email, password, role, platforms);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      setUser(res.user);
      syncUserSessionData(res.user);
      setAuthModalOpen(false);
      setAuthReason(undefined);
      pushToast('Cuenta creada y guardada en Excel DB', `Bienvenido, ${res.user.name}.`, 'success');

      if (pendingFavGameId) {
        const favRes = toggleUserFavorite(res.user.id, pendingFavGameId);
        if (favRes.ok) {
          setFavoriteIds(favRes.favorites.map((f) => f.gameId));
        }
        setPendingFavGameId(null);
      }

      if (pendingViewAfterAuth === 'profile') {
        setPendingViewAfterAuth(null);
        window.location.href = '/perfil.html';
      }

      return { ok: true };
    },
    [pendingFavGameId, pendingViewAfterAuth, pushToast, syncUserSessionData]
  );

  const handleLogout = useCallback(() => {
    logoutUser();
    setUser(null);
    setFavoriteIds([]);
    setAlerts([]);
    pushToast('Sesión cerrada', 'Tus datos permanecen protegidos.', 'info');
    if (window.location.pathname === '/perfil.html') {
      window.location.href = '/index.html';
    }
  }, [pushToast]);

  const handleSubmitReview = useCallback(
    async (gameId: string, rating: number, comment: string) => {
      if (!user) return false;
      const res = await addGameReviewAsync(gameId, user.id, rating, comment);
      if (!res.ok) {
        pushToast('Error en reseña', res.error, 'error');
        return false;
      }
      setCatalogVersion((v) => v + 1);
      pushToast('Reseña publicada', 'Tu calificación se guardó en la base de datos.', 'success');
      return true;
    },
    [user, pushToast]
  );

  const handleDeleteReview = useCallback(
    async (reviewId: string) => {
      if (!user) return;
      const res = await deleteGameReviewAsync(reviewId, user.id);
      if (!res.ok) {
        pushToast('No se pudo eliminar', res.error, 'error');
        return;
      }
      setCatalogVersion((v) => v + 1);
      pushToast('Reseña eliminada', undefined, 'info');
    },
    [user, pushToast]
  );

  const handleSimulatePriceDrop = useCallback(() => {
    if (!user) {
      setAuthReason('Inicia sesión para simular alertas de bajada de precio en tus favoritos.');
      setAuthModalOpen(true);
      return;
    }
    const res = simulatePriceDropForUser(user.id);
    if (!res.ok) {
      pushToast('No se pudo simular la bajada', res.error, 'warning');
      return;
    }
    setAlerts(getUserAlerts(user.id));
    setCatalogVersion((v) => v + 1);
    pushToast(
      `¡Alerta de precio: -${res.alert.discountPercent}%!`,
      `${res.updatedGame.title} bajó a ${formatCOP(res.updatedGame.finalPriceCop)}.`,
      'success'
    );
  }, [user, pushToast]);

  const handleMarkAlertRead = useCallback(
    (alertId: string) => {
      if (!user) return;
      setAlerts(markAlertAsRead(user.id, alertId));
    },
    [user]
  );

  const handleMarkAllAlertsRead = useCallback(() => {
    if (!user) return;
    setAlerts(markAllAlertsAsRead(user.id));
    pushToast('Alertas actualizadas', 'Todas las notificaciones fueron marcadas como leídas.', 'info');
  }, [user, pushToast]);

  const handleToggleApiFailure = useCallback(() => {
    if (user?.role !== 'administrador') return;
    const next = updateQAState({ simulateApiFailure: !qaState.simulateApiFailure });
    setQaState(next);
    pushToast(
      next.simulateApiFailure ? 'Modo Caché activado (QA)' : 'Conexión API restablecida',
      next.simulateApiFailure
        ? 'Mostrando últimos precios válidos en caché sin interrumpir el catálogo.'
        : 'Sincronización de precios en vivo restaurada.',
      next.simulateApiFailure ? 'warning' : 'success'
    );
  }, [user, qaState.simulateApiFailure, pushToast]);

  const handleToggleChatbotFailure = useCallback(() => {
    if (user?.role !== 'administrador') return;
    const next = updateQAState({ simulateChatbotFailure: !qaState.simulateChatbotFailure });
    setQaState(next);
    pushToast(
      next.simulateChatbotFailure ? 'Chatbot IA deshabilitado (QA)' : 'Chatbot IA operativo',
      next.simulateChatbotFailure
        ? 'El asistente muestra un estado controlado mientras el catálogo sigue operando.'
        : 'El asistente inteligente volvió a estar disponible.',
      next.simulateChatbotFailure ? 'warning' : 'success'
    );
  }, [user, qaState.simulateChatbotFailure, pushToast]);

  const allGames = useMemo(() => {
    void catalogVersion;
    return getAllGames();
  }, [catalogVersion]);

  const featuredGames = useMemo(
    () => allGames.filter((g) => g.isFeatured).slice(0, 6),
    [allGames]
  );

  const filteredGames = useMemo(() => {
    void catalogVersion;
    return queryGames(filters);
  }, [filters, catalogVersion]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const favoriteGames = useMemo(
    () => allGames.filter((g) => favoriteIdSet.has(g.id)),
    [allGames, favoriteIdSet]
  );

  const selectedGame = useMemo(() => {
    void catalogVersion;
    if (selectedGameId) {
      return getGameById(selectedGameId) ?? allGames[0];
    }
    return allGames[0];
  }, [selectedGameId, catalogVersion, allGames]);

  const selectedGameOffers = useMemo(() => {
    void catalogVersion;
    return selectedGame ? getStoreOffersForGame(selectedGame.id) : [];
  }, [selectedGame, catalogVersion]);

  const selectedGameReviews = useMemo(() => {
    void catalogVersion;
    return selectedGame ? getReviewsForGame(selectedGame.id) : [];
  }, [selectedGame, catalogVersion]);

  const allNews = useMemo(() => {
    void catalogVersion;
    return queryNews('Todas', false, null);
  }, [catalogVersion]);

  if (!initialized) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#120D0A] text-[#FAF5F0]">
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        searchQuery={filters.search}
        onSearchSubmit={handleSearchSubmit}
        user={user}
        alerts={alerts}
        onOpenAuth={() => {
          setAuthReason(undefined);
          setAuthModalOpen(true);
        }}
        onMarkAllAlertsRead={handleMarkAllAlertsRead}
        onSimulatePriceDrop={handleSimulatePriceDrop}
        onSelectGame={handleSelectGame}
      />

      {qaState.simulateApiFailure && (
        <div
          role="status"
          className="border-b border-amber-500/35 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-200"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            Mostrando últimos precios válidos en caché — La API externa de CheapShark está en modo
            de fallo simulado sin interrumpir tu navegación.
          </span>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {currentView === 'home' && (
          <HomeView
            featuredGames={featuredGames}
            totalCatalogCount={allGames.length}
            favoriteGameIds={favoriteIdSet}
            lastCheapSharkSync={lastCheapSharkSync}
            isSyncingCheapShark={isSyncingCheapShark}
            onSyncCheapShark={handleSyncCheapShark}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onSearchSubmit={handleSearchSubmit}
            onNavigateCatalogWithPlatform={handleNavigateCatalogWithPlatform}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            games={filteredGames}
            filters={filters}
            favoriteGameIds={favoriteIdSet}
            user={user}
            isSyncingCheapShark={isSyncingCheapShark}
            onSyncCheapShark={handleSyncCheapShark}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {currentView === 'detail' && selectedGame && (
          <GameDetailView
            game={selectedGame}
            storeOffers={selectedGameOffers}
            reviews={selectedGameReviews}
            user={user}
            isFavorite={favoriteIdSet.has(selectedGame.id)}
            onBack={() => navigateTo('catalog')}
            onToggleFavorite={handleToggleFavorite}
            onNotifyStoreRedirect={(storeName, priceCop) =>
              pushToast(
                `Redirección lista hacia ${storeName}`,
                `Precio verificado: ${formatCOP(priceCop)}`,
                'success'
              )
            }
            onSubmitReview={handleSubmitReview}
            onDeleteReview={handleDeleteReview}
            onOpenAuthForReview={() => {
              setAuthReason('Inicia sesión como Usuario para calificar este título y publicar tu reseña.');
              setAuthModalOpen(true);
            }}
          />
        )}

        {currentView === 'news' && <NewsView />}

        {currentView === 'profile' && (
          user ? (
            <ProfileView
              user={user}
              allGames={allGames}
              allNews={allNews}
              favoriteGames={favoriteGames}
              alerts={alerts}
              onSelectGame={handleSelectGame}
              onToggleFavorite={handleToggleFavorite}
              onSimulatePriceDrop={handleSimulatePriceDrop}
              onMarkAlertRead={handleMarkAlertRead}
              onMarkAllAlertsRead={handleMarkAllAlertsRead}
              onLogout={handleLogout}
              onNavigate={navigateTo}
              onRefreshBootstrap={refreshFromServer}
              onSyncCheapShark={handleSyncCheapShark}
              onNotify={pushToast}
            />
          ) : (
            <div className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-10 text-center space-y-4">
              <h1 className="font-display text-2xl font-bold text-white">
                Inicia sesión para acceder a tu perfil o panel administrador
              </h1>
              <p className="mx-auto max-w-md text-sm text-[#A89789]">
                Elige ingresar como Usuario (para guardar favoritos y calificar juegos) o como
                Administrador (para editar ofertas, novedades y cuentas en Excel).
              </p>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="rounded-xl bg-[#EA580C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C2410C]"
              >
                Abrir inicio de sesión
              </button>
            </div>
          )
        )}
      </main>

      <Footer
        onNavigate={navigateTo}
        isAdmin={user?.role === 'administrador'}
        qaState={qaState}
        onToggleApiFailure={handleToggleApiFailure}
        onToggleChatbotFailure={handleToggleChatbotFailure}
      />

      <ChatbotWidget
        isChatbotDisabled={qaState.simulateChatbotFailure}
        onSelectGame={handleSelectGame}
      />

      <AuthModal
        isOpen={authModalOpen}
        reasonMessage={authReason}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthReason(undefined);
          setPendingFavGameId(null);
          setPendingViewAfterAuth(null);
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
