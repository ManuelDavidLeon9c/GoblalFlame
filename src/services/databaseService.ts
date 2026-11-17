import {
  SEED_ALERTS,
  SEED_FAVORITES,
  SEED_GAMES,
  SEED_NEWS,
  SEED_REVIEWS,
  SEED_STORE_OFFERS,
  SEED_USERS,
} from '../data/seedData';
import {
  CatalogFilters,
  Favorite,
  Game,
  NewsCategory,
  NewsItem,
  Platform,
  PriceAlert,
  QAState,
  Review,
  Session,
  StoreOffer,
  User,
  UserRole,
} from '../types';
import { calculateDiscountPercent, formatCOP, normalizeText } from '../utils/formatters';

const STORAGE_KEYS = {
  USERS: 'gf_pg_users_v2',
  GAMES: 'gf_pg_games_v2',
  OFFERS: 'gf_pg_store_offers_v2',
  FAVORITES: 'gf_pg_favorites_v2',
  ALERTS: 'gf_pg_alerts_v2',
  NEWS: 'gf_pg_news_v2',
  REVIEWS: 'gf_pg_reviews_v2',
  SESSION: 'gf_pg_session_v2',
  QA: 'gf_pg_qa_state_v2',
  LAST_SYNC: 'gf_pg_last_cheapshark_sync_v2',
} as const;

function readTable<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return structuredClone(fallback);
    }
    return JSON.parse(raw) as T;
  } catch {
    return structuredClone(fallback);
  }
}

function writeTable<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage quota guard
  }
}

export function initializeDatabase(): void {
  readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  readTable<Game[]>(STORAGE_KEYS.GAMES, SEED_GAMES);
  readTable<StoreOffer[]>(STORAGE_KEYS.OFFERS, SEED_STORE_OFFERS);
  readTable<Favorite[]>(STORAGE_KEYS.FAVORITES, SEED_FAVORITES);
  readTable<PriceAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  readTable<NewsItem[]>(STORAGE_KEYS.NEWS, SEED_NEWS);
  readTable<Review[]>(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
  readTable<QAState>(STORAGE_KEYS.QA, {
    simulateApiFailure: false,
    simulateChatbotFailure: false,
  });
}

/**
 * Syncs local browser state with the Express + CheapShark + Excel backend DB
 */
export async function syncWithServerDatabase(): Promise<{
  games: Game[];
  storeOffers: StoreOffer[];
  news: NewsItem[];
  reviews: Review[];
  lastCheapSharkSync: string | null;
}> {
  const qa = getQAState();
  if (qa.simulateApiFailure) {
    return {
      games: getAllGames(),
      storeOffers: readTable<StoreOffer[]>(STORAGE_KEYS.OFFERS, SEED_STORE_OFFERS),
      news: readTable<NewsItem[]>(STORAGE_KEYS.NEWS, SEED_NEWS),
      reviews: readTable<Review[]>(STORAGE_KEYS.REVIEWS, SEED_REVIEWS),
      lastCheapSharkSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
    };
  }

  try {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) throw new Error('Bootstrap error');
    const data = (await res.json()) as {
      games: Game[];
      storeOffers: StoreOffer[];
      news: NewsItem[];
      reviews: Review[];
      lastCheapSharkSync: string | null;
    };
    writeTable(STORAGE_KEYS.GAMES, data.games);
    writeTable(STORAGE_KEYS.OFFERS, data.storeOffers);
    writeTable(STORAGE_KEYS.NEWS, data.news);
    writeTable(STORAGE_KEYS.REVIEWS, data.reviews);
    if (data.lastCheapSharkSync) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, data.lastCheapSharkSync);
    }
    return data;
  } catch {
    return {
      games: getAllGames(),
      storeOffers: readTable<StoreOffer[]>(STORAGE_KEYS.OFFERS, SEED_STORE_OFFERS),
      news: readTable<NewsItem[]>(STORAGE_KEYS.NEWS, SEED_NEWS),
      reviews: readTable<Review[]>(STORAGE_KEYS.REVIEWS, SEED_REVIEWS),
      lastCheapSharkSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
    };
  }
}

export async function triggerCheapSharkLiveSync(): Promise<{
  ok: boolean;
  added?: number;
  updated?: number;
  error?: string;
}> {
  if (getQAState().simulateApiFailure) {
    return {
      ok: false,
      error: 'Modo Caché QA activo: desactiva "Simular fallo de API externa" para sincronizar CheapShark.',
    };
  }
  try {
    const res = await fetch('/api/cheapshark/sync', { method: 'POST' });
    const data = (await res.json()) as {
      ok: boolean;
      summary?: { added: number; updated: number };
      games: Game[];
      storeOffers: StoreOffer[];
      lastCheapSharkSync?: string;
      error?: string;
    };
    if (!data.ok) {
      return { ok: false, error: data.error || 'Error conectando con CheapShark API' };
    }
    writeTable(STORAGE_KEYS.GAMES, data.games);
    writeTable(STORAGE_KEYS.OFFERS, data.storeOffers);
    if (data.lastCheapSharkSync) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, data.lastCheapSharkSync);
    }
    return { ok: true, added: data.summary?.added ?? 0, updated: data.summary?.updated ?? 0 };
  } catch {
    return { ok: false, error: 'No fue posible contactar el servidor para sincronizar CheapShark.' };
  }
}

// ==========================================
// QA / System Reliability State (RNF08)
// ==========================================
export function getQAState(): QAState {
  return readTable<QAState>(STORAGE_KEYS.QA, {
    simulateApiFailure: false,
    simulateChatbotFailure: false,
  });
}

export function updateQAState(partial: Partial<QAState>): QAState {
  const current = getQAState();
  const next = { ...current, ...partial };
  writeTable(STORAGE_KEYS.QA, next);
  return next;
}

// ==========================================
// Authentication & Role Isolation (Usuario vs Administrador)
// ==========================================
export function getCurrentUser(): User | null {
  try {
    const rawSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!rawSession) return null;
    const session = JSON.parse(rawSession) as Session & { user?: User };
    if (session.user) return session.user;
    const users = readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    return users.find((u) => u.id === session.userId) ?? null;
  } catch {
    return null;
  }
}

export async function loginUserAsync(
  email: string,
  password: string,
  expectedRole?: UserRole
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, expectedRole }),
    });
    const data = (await res.json()) as { ok: boolean; user?: User; error?: string };
    if (!res.ok || !data.ok || !data.user) {
      return { ok: false, error: data.error || 'Credenciales inválidas.' };
    }
    const session: Session & { user: User } = {
      token: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: data.user.id,
      user: data.user,
      createdAt: new Date().toISOString(),
    };
    writeTable(STORAGE_KEYS.SESSION, session);
    return { ok: true, user: data.user };
  } catch {
    // Fallback to local if server unreachable
    const users = readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || user.passwordHash !== password) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }
    if (expectedRole && user.role !== expectedRole) {
      return { ok: false, error: `Esta cuenta no corresponde al rol ${expectedRole}.` };
    }
    writeTable(STORAGE_KEYS.SESSION, {
      token: `tok_${Date.now()}`,
      userId: user.id,
      user,
      createdAt: new Date().toISOString(),
    });
    return { ok: true, user };
  }
}

export async function registerUserAsync(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'usuario',
  preferredPlatforms: Platform[] = ['PC']
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, preferredPlatforms }),
    });
    const data = (await res.json()) as { ok: boolean; user?: User; error?: string };
    if (!res.ok || !data.ok || !data.user) {
      return { ok: false, error: data.error || 'No se pudo registrar la cuenta.' };
    }
    writeTable(STORAGE_KEYS.SESSION, {
      token: `tok_${Date.now()}`,
      userId: data.user.id,
      user: data.user,
      createdAt: new Date().toISOString(),
    });
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: 'Error de conexión al registrar la cuenta.' };
  }
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export async function updateUserAvatarAsync(
  userId: string,
  avatarUrl: string | null
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/users/me/avatar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ avatarUrl }),
    });
    const data = (await res.json()) as { ok: boolean; user?: User; error?: string };
    if (!res.ok || !data.ok || !data.user) {
      return { ok: false, error: data.error || 'No se pudo actualizar la foto de perfil.' };
    }

    const rawSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession) as Session & { user?: User };
        writeTable(STORAGE_KEYS.SESSION, { ...session, user: data.user });
      } catch {
        // ignore parse error
      }
    }

    const cachedUsers = readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    writeTable(
      STORAGE_KEYS.USERS,
      cachedUsers.map((u) => (u.id === data.user!.id ? data.user! : u))
    );

    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: 'Error de conexión al guardar la foto de perfil.' };
  }
}

export async function deleteOwnAccountAsync(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/users/me', {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'No se pudo eliminar la cuenta.' };
    }

    localStorage.removeItem(STORAGE_KEYS.SESSION);

    const favs = readTable<Favorite[]>(STORAGE_KEYS.FAVORITES, SEED_FAVORITES).filter(
      (f) => f.userId !== userId
    );
    writeTable(STORAGE_KEYS.FAVORITES, favs);

    const alerts = readTable<PriceAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS).filter(
      (a) => a.userId !== userId
    );
    writeTable(STORAGE_KEYS.ALERTS, alerts);

    const cachedUsers = readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS).filter(
      (u) => u.id !== userId
    );
    writeTable(STORAGE_KEYS.USERS, cachedUsers);

    return { ok: true };
  } catch {
    return { ok: false, error: 'Error de conexión al intentar eliminar la cuenta.' };
  }
}

// ==========================================
// Games & Store Offers Queries
// ==========================================
export function getAllGames(): Game[] {
  return readTable<Game[]>(STORAGE_KEYS.GAMES, SEED_GAMES);
}

export function getGameById(gameId: string): Game | undefined {
  return getAllGames().find((g) => g.id === gameId);
}

export function getStoreOffersForGame(gameId: string): StoreOffer[] {
  const offers = readTable<StoreOffer[]>(STORAGE_KEYS.OFFERS, SEED_STORE_OFFERS);
  return offers
    .filter((o) => o.gameId === gameId)
    .sort((a, b) => a.finalPriceCop - b.finalPriceCop);
}

export function queryGames(filters: CatalogFilters): Game[] {
  let results = getAllGames();

  if (filters.search.trim().length > 0) {
    const q = normalizeText(filters.search);
    results = results.filter((g) => {
      const haystack = normalizeText(
        `${g.title} ${g.developer} ${g.genre} ${g.secondaryGenre ?? ''} ${g.platforms.join(' ')} ${g.bestStore}`
      );
      return haystack.includes(q);
    });
  }

  if (filters.platforms.length > 0) {
    results = results.filter((g) =>
      filters.platforms.some((p) => g.platforms.includes(p))
    );
  }

  if (filters.genres.length > 0) {
    results = results.filter(
      (g) =>
        filters.genres.includes(g.genre) ||
        (g.secondaryGenre ? filters.genres.includes(g.secondaryGenre) : false)
    );
  }

  if (filters.offerTypes.length > 0) {
    results = results.filter((g) => filters.offerTypes.includes(g.offerType));
  }

  if (filters.freeOnly) {
    results = results.filter((g) => g.finalPriceCop === 0);
  } else if (filters.maxPriceCop < 300000) {
    results = results.filter((g) => g.finalPriceCop <= filters.maxPriceCop);
  }

  results = [...results].sort((a, b) => {
    if (filters.sortBy === 'price_asc') {
      return a.finalPriceCop - b.finalPriceCop || b.discountPercent - a.discountPercent;
    }
    if (filters.sortBy === 'discount_desc') {
      return b.discountPercent - a.discountPercent || a.finalPriceCop - b.finalPriceCop;
    }
    return b.popularityScore - a.popularityScore;
  });

  return results;
}

// ==========================================
// Community Reviews (Per-Game)
// ==========================================
export function getReviewsForGame(gameId: string): Review[] {
  const all = readTable<Review[]>(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
  return all
    .filter((r) => r.gameId === gameId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addGameReviewAsync(
  gameId: string,
  userId: string,
  rating: number,
  comment: string
): Promise<{ ok: true; reviews: Review[] } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId, rating, comment }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      reviews?: Review[];
      updatedGame?: Game;
      error?: string;
    };
    if (!res.ok || !data.ok || !data.reviews) {
      return { ok: false, error: data.error || 'No se pudo guardar la reseña.' };
    }
    writeTable(STORAGE_KEYS.REVIEWS, data.reviews);
    if (data.updatedGame) {
      const games = getAllGames().map((g) =>
        g.id === data.updatedGame!.id ? data.updatedGame! : g
      );
      writeTable(STORAGE_KEYS.GAMES, games);
    }
    return { ok: true, reviews: data.reviews };
  } catch {
    return { ok: false, error: 'Error de conexión al guardar la reseña.' };
  }
}

export async function deleteGameReviewAsync(
  reviewId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    });
    const data = (await res.json()) as { ok: boolean; reviews?: Review[]; error?: string };
    if (!res.ok || !data.ok || !data.reviews) {
      return { ok: false, error: data.error || 'No se pudo eliminar la reseña.' };
    }
    writeTable(STORAGE_KEYS.REVIEWS, data.reviews);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Error de conexión al eliminar reseña.' };
  }
}

// ==========================================
// Favorites & Price Alerts
// ==========================================
export function getUserFavorites(userId: string | null): Favorite[] {
  if (!userId) return [];
  const all = readTable<Favorite[]>(STORAGE_KEYS.FAVORITES, SEED_FAVORITES);
  return all.filter((f) => f.userId === userId);
}

export function toggleUserFavorite(
  userId: string | null,
  gameId: string
): { ok: true; added: boolean; favorites: Favorite[] } | { ok: false; reason: 'UNAUTHORIZED' | 'NOT_FOUND' } {
  if (!userId) {
    return { ok: false, reason: 'UNAUTHORIZED' };
  }
  const game = getGameById(gameId);
  if (!game) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const all = readTable<Favorite[]>(STORAGE_KEYS.FAVORITES, SEED_FAVORITES);
  const existingIdx = all.findIndex((f) => f.userId === userId && f.gameId === gameId);

  let added = false;
  if (existingIdx >= 0) {
    all.splice(existingIdx, 1);
  } else {
    all.unshift({
      id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      gameId,
      savedPriceCop: game.finalPriceCop,
      createdAt: new Date().toISOString(),
    });
    added = true;
  }

  writeTable(STORAGE_KEYS.FAVORITES, all);
  return {
    ok: true,
    added,
    favorites: all.filter((f) => f.userId === userId),
  };
}

export function getUserAlerts(userId: string | null): PriceAlert[] {
  if (!userId) return [];
  const all = readTable<PriceAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  return all
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markAlertAsRead(userId: string, alertId: string): PriceAlert[] {
  const all = readTable<PriceAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  const updated = all.map((a) =>
    a.userId === userId && a.id === alertId ? { ...a, isRead: true } : a
  );
  writeTable(STORAGE_KEYS.ALERTS, updated);
  return getUserAlerts(userId);
}

export function markAllAlertsAsRead(userId: string): PriceAlert[] {
  const all = readTable<PriceAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  const updated = all.map((a) => (a.userId === userId ? { ...a, isRead: true } : a));
  writeTable(STORAGE_KEYS.ALERTS, updated);
  return getUserAlerts(userId);
}

export function simulatePriceDropForUser(
  userId: string | null
):
  | { ok: true; alert: PriceAlert; updatedGame: Game }
  | { ok: false; error: string } {
  if (!userId) {
    return { ok: false, error: 'Debes iniciar sesión para recibir alertas personalizadas.' };
  }

  const userFavs = getUserFavorites(userId);
  if (userFavs.length === 0) {
    return {
      ok: false,
      error: 'Agrega al menos un videojuego con precio a tus favoritos para simular una bajada de precio.',
    };
  }

  const games = getAllGames();
  const paidFavGames = userFavs
    .map((f) => games.find((g) => g.id === f.gameId))
    .filter((g): g is Game => Boolean(g && g.finalPriceCop > 5000));

  if (paidFavGames.length === 0) {
    return {
      ok: false,
      error: 'Tus favoritos actuales ya son gratuitos. Agrega un juego pago para simular un descuento.',
    };
  }

  const target = paidFavGames[Math.floor(Math.random() * paidFavGames.length)];
  const oldPriceCop = target.finalPriceCop;
  const rawNewPrice = Math.max(9900, Math.round((oldPriceCop * 0.8) / 100) * 100);
  const baseOriginal = target.originalPriceCop > rawNewPrice ? target.originalPriceCop : oldPriceCop;
  const newDiscount = calculateDiscountPercent(baseOriginal, rawNewPrice);

  const updatedGame: Game = {
    ...target,
    originalPriceCop: baseOriginal,
    finalPriceCop: rawNewPrice,
    discountPercent: newDiscount,
    offerType: 'Descuento',
  };

  const nextGames = games.map((g) => (g.id === updatedGame.id ? updatedGame : g));
  writeTable(STORAGE_KEYS.GAMES, nextGames);

  const offers = readTable<StoreOffer[]>(STORAGE_KEYS.OFFERS, SEED_STORE_OFFERS);
  let syncedFirst = false;
  const nextOffers = offers.map((offer) => {
    if (offer.gameId === updatedGame.id && !syncedFirst) {
      syncedFirst = true;
      return {
        ...offer,
        finalPriceCop: rawNewPrice,
        discountPercent: newDiscount,
        lastUpdated: new Date().toISOString(),
      };
    }
    return offer;
  });
  writeTable(STORAGE_KEYS.OFFERS, nextOffers);

  const newAlert: PriceAlert = {
    id: `al-${Date.now()}`,
    userId,
    gameId: updatedGame.id,
    gameTitle: updatedGame.title,
    oldPriceCop,
    newPriceCop: rawNewPrice,
    discountPercent: newDiscount,
    message: `¡Bajada de precio! ${updatedGame.title} bajó de ${formatCOP(oldPriceCop)} a ${formatCOP(rawNewPrice)} (-${newDiscount}%) en ${updatedGame.bestStore}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const allAlerts = readTable<PriceAlert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS);
  allAlerts.unshift(newAlert);
  writeTable(STORAGE_KEYS.ALERTS, allAlerts);

  return { ok: true, alert: newAlert, updatedGame };
}

// ==========================================
// News Feed
// ==========================================
export function queryNews(
  category: 'Todas' | NewsCategory,
  forYouOnly: boolean,
  userId: string | null
): NewsItem[] {
  const allNews = readTable<NewsItem[]>(STORAGE_KEYS.NEWS, SEED_NEWS);

  let filtered = allNews;
  if (category !== 'Todas') {
    filtered = filtered.filter((n) => n.category === category);
  }

  if (forYouOnly) {
    if (!userId) return [];
    const userFavs = getUserFavorites(userId);
    if (userFavs.length === 0) return [];

    const favGameIds = new Set(userFavs.map((f) => f.gameId));
    const games = getAllGames();
    const favGenres = new Set<string>();
    userFavs.forEach((f) => {
      const g = games.find((item) => item.id === f.gameId);
      if (g) {
        favGenres.add(g.genre);
        if (g.secondaryGenre) favGenres.add(g.secondaryGenre);
      }
    });

    filtered = filtered.filter(
      (n) =>
        n.relatedGameIds.some((id) => favGameIds.has(id)) ||
        n.relatedGenres.some((gen) => favGenres.has(gen))
    );
  }

  return [...filtered].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
