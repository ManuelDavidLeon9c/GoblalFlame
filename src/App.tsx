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
  getAllGames,
  getCurrentUser,
  getGameById,
  getQAState,
  getStoreOffersForGame,
  getUserAlerts,
  getUserFavorites,
  initializeDatabase,
  loginUser,
  logoutUser,
  markAllAlertsAsRead,
  markAlertAsRead,
  queryGames,
  queryNews,
  registerUser,
  simulatePriceDropForUser,
  toggleUserFavorite,
  updateQAState,
} from './services/databaseService';
import {
  CatalogFilters,
  NewsCategory,
  Platform,
  PriceAlert,
  QAState,
  ToastMessage,
  User,
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

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<ViewRoute>('home');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [newsCategory, setNewsCategory] = useState<'Todas' | NewsCategory>('Todas');
  const [newsForYouOnly, setNewsForYouOnly] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [qaState, setQaState] = useState<QAState>({
    simulateApiFailure: false,
    simulateChatbotFailure: false,
  });
  const [catalogVersion, setCatalogVersion] = useState(0);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);
  const [pendingFavGameId, setPendingFavGameId] = useState<string | null>(null);
  const [pendingViewAfterAuth, setPendingViewAfterAuth] = useState<ViewRoute | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'info') => {
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

  useEffect(() => {
    initializeDatabase();
    const activeUser = getCurrentUser();
    setUser(activeUser);
    syncUserSessionData(activeUser);
    setQaState(getQAState());
    setInitialized(true);
  }, [syncUserSessionData]);

  const navigateTo = useCallback(
    (view: ViewRoute) => {
      if (view === 'profile' && !user) {
        setPendingViewAfterAuth('profile');
        setAuthReason('Inicia sesión para acceder a tu perfil privado, favoritos y alertas.');
        setAuthModalOpen(true);
        return;
      }
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [user]
  );

  const handleSelectGame = useCallback((gameId: string) => {
    setSelectedGameId(gameId);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateCatalogWithPlatform = useCallback((platform: Platform) => {
    setFilters({ ...DEFAULT_FILTERS, platforms: [platform] });
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpdateFilters = useCallback((partial: Partial<CatalogFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleToggleFavorite = useCallback(
    (gameId: string) => {
      if (!user) {
        setPendingFavGameId(gameId);
        setAuthReason('Inicia sesión para guardar videojuegos en tu lista personal de favoritos.');
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
    (email: string, password: string) => {
      const res = loginUser(email, password);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      setUser(res.user);
      syncUserSessionData(res.user);
      setAuthModalOpen(false);
      setAuthReason(undefined);
      pushToast(`Bienvenido, ${res.user.name.split(' ')[0]}`, 'Sesión iniciada correctamente.', 'success');

      if (pendingFavGameId) {
        const favRes = toggleUserFavorite(res.user.id, pendingFavGameId);
        if (favRes.ok) {
          setFavoriteIds(favRes.favorites.map((f) => f.gameId));
          const game = getGameById(pendingFavGameId);
          if (favRes.added && game) {
            pushToast('Agregado a tus favoritos', `${game.title} guardado en tu cuenta.`, 'success');
          }
        }
        setPendingFavGameId(null);
      }

      if (pendingViewAfterAuth) {
        setCurrentView(pendingViewAfterAuth);
        setPendingViewAfterAuth(null);
      }

      return { ok: true };
    },
    [pendingFavGameId, pendingViewAfterAuth, pushToast, syncUserSessionData]
  );

  const handleRegister = useCallback(
    (name: string, email: string, password: string, platforms: Platform[]) => {
      const res = registerUser(name, email, password, platforms);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      setUser(res.user);
      syncUserSessionData(res.user);
      setAuthModalOpen(false);
      setAuthReason(undefined);
      pushToast('Cuenta creada con éxito', `Bienvenido a Global Flame, ${res.user.name}.`, 'success');

      if (pendingFavGameId) {
        const favRes = toggleUserFavorite(res.user.id, pendingFavGameId);
        if (favRes.ok) {
          setFavoriteIds(favRes.favorites.map((f) => f.gameId));
        }
        setPendingFavGameId(null);
      }

      if (pendingViewAfterAuth) {
        setCurrentView(pendingViewAfterAuth);
        setPendingViewAfterAuth(null);
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
    setNewsForYouOnly(false);
    if (currentView === 'profile') {
      setCurrentView('home');
    }
    pushToast('Sesión cerrada', 'Tus favoritos y alertas permanecen protegidos.', 'info');
  }, [currentView, pushToast]);

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
    const next = updateQAState({ simulateApiFailure: !qaState.simulateApiFailure });
    setQaState(next);
    pushToast(
      next.simulateApiFailure ? 'Modo Caché activado (QA)' : 'Conexión API restablecida',
      next.simulateApiFailure
        ? 'Mostrando últimos precios válidos en caché sin interrumpir el catálogo.'
        : 'Sincronización de precios en vivo restaurada.',
      next.simulateApiFailure ? 'warning' : 'success'
    );
  }, [qaState.simulateApiFailure, pushToast]);

  const handleToggleChatbotFailure = useCallback(() => {
    const next = updateQAState({ simulateChatbotFailure: !qaState.simulateChatbotFailure });
    setQaState(next);
    pushToast(
      next.simulateChatbotFailure ? 'Chatbot IA deshabilitado (QA)' : 'Chatbot IA operativo',
      next.simulateChatbotFailure
        ? 'El asistente muestra un estado controlado mientras el catálogo sigue operando.'
        : 'El asistente inteligente volvió a estar disponible.',
      next.simulateChatbotFailure ? 'warning' : 'success'
    );
  }, [qaState.simulateChatbotFailure, pushToast]);

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
    return selectedGameId ? getGameById(selectedGameId) : undefined;
  }, [selectedGameId, catalogVersion]);

  const selectedGameOffers = useMemo(() => {
    void catalogVersion;
    return selectedGame ? getStoreOffersForGame(selectedGame.id) : [];
  }, [selectedGame, catalogVersion]);

  const filteredNews = useMemo(
    () => queryNews(newsCategory, newsForYouOnly, user?.id ?? null),
    [newsCategory, newsForYouOnly, user, favoriteIds]
  );

  if (!initialized) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F19] text-[#F8FAFC]">
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

      {/* RNF08: Subtle Cache Mode Banner when External API Failure is simulated */}
      {qaState.simulateApiFailure && (
        <div
          role="status"
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-200"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            Mostrando últimos precios válidos en caché — La API externa de tiendas está en modo
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
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onSearchSubmit={handleSearchSubmit}
            onNavigateCatalogWithPlatform={handleNavigateCatalogWithPlatform}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            games={filteredGames}
            filters={filters}
            favoriteGameIds={favoriteIdSet}
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
          />
        )}

        {currentView === 'news' && (
          <NewsView
            news={filteredNews}
            category={newsCategory}
            forYouOnly={newsForYouOnly}
            user={user}
            favoritesCount={favoriteIds.length}
            onChangeCategory={setNewsCategory}
            onToggleForYou={() => setNewsForYouOnly((prev) => !prev)}
            onOpenAuth={() => {
              setAuthReason('Inicia sesión para filtrar noticias según tus videojuegos favoritos.');
              setAuthModalOpen(true);
            }}
            onSelectGame={handleSelectGame}
          />
        )}

        {currentView === 'profile' && user && (
          <ProfileView
            user={user}
            favoriteGames={favoriteGames}
            alerts={alerts}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onSimulatePriceDrop={handleSimulatePriceDrop}
            onMarkAlertRead={handleMarkAlertRead}
            onMarkAllAlertsRead={handleMarkAllAlertsRead}
            onLogout={handleLogout}
            onNavigate={navigateTo}
          />
        )}
      </main>

      <Footer
        onNavigate={navigateTo}
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
