import {
  SEED_ALERTS,
  SEED_FAVORITES,
  SEED_GAMES,
  SEED_NEWS,
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
  Session,
  StoreOffer,
  User,
} from '../types';
import { calculateDiscountPercent, formatCOP, normalizeText } from '../utils/formatters';

const STORAGE_KEYS = {
  USERS: 'gf_pg_users_v1',
  GAMES: 'gf_pg_games_v1',
  OFFERS: 'gf_pg_store_offers_v1',
  FAVORITES: 'gf_pg_favorites_v1',
  ALERTS: 'gf_pg_alerts_v1',
  NEWS: 'gf_pg_news_v1',
  SESSION: 'gf_pg_session_v1',
  QA: 'gf_pg_qa_state_v1',
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
  readTable<QAState>(STORAGE_KEYS.QA, {
    simulateApiFailure: false,
    simulateChatbotFailure: false,
  });
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
// Authentication & Session Isolation (RNF07)
// ==========================================
export function getCurrentUser(): User | null {
  try {
    const rawSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!rawSession) return null;
    const session = JSON.parse(rawSession) as Session;
    const users = readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    return users.find((u) => u.id === session.userId) ?? null;
  } catch {
    return null;
  }
}

export function loginUser(
  email: string,
  password: string
): { ok: true; user: User } | { ok: false; error: string } {
  const users = readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  const cleanEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user || user.passwordHash !== password) {
    return { ok: false, error: 'Correo o contraseña incorrectos. Verifica tus credenciales.' };
  }

  const session: Session = {
    token: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  };
  writeTable(STORAGE_KEYS.SESSION, session);
  return { ok: true, user };
}

export function registerUser(
  name: string,
  email: string,
  password: string,
  preferredPlatforms: Platform[] = ['PC']
): { ok: true; user: User } | { ok: false; error: string } {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanName.length < 2) {
    return { ok: false, error: 'Ingresa tu nombre completo (mínimo 2 caracteres).' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Ingresa un correo electrónico válido.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const users = readTable<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { ok: false, error: 'Ya existe una cuenta registrada con ese correo.' };
  }

  const initials = cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash: password,
    avatarInitials: initials || 'GF',
    preferredPlatforms: preferredPlatforms.length > 0 ? preferredPlatforms : ['PC'],
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeTable(STORAGE_KEYS.USERS, users);

  const session: Session = {
    token: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: newUser.id,
    createdAt: new Date().toISOString(),
  };
  writeTable(STORAGE_KEYS.SESSION, session);
  return { ok: true, user: newUser };
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// ==========================================
// Games & Store Offers Queries (RF01-RF04)
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

  // RF01: Keyword search (title, developer, genre, synopsis)
  if (filters.search.trim().length > 0) {
    const q = normalizeText(filters.search);
    results = results.filter((g) => {
      const haystack = normalizeText(
        `${g.title} ${g.developer} ${g.genre} ${g.secondaryGenre ?? ''} ${g.platforms.join(' ')} ${g.bestStore}`
      );
      return haystack.includes(q);
    });
  }

  // RF02 & RF03: Platform multi-filter
  if (filters.platforms.length > 0) {
    results = results.filter((g) =>
      filters.platforms.some((p) => g.platforms.includes(p))
    );
  }

  // RF02: Genre multi-filter
  if (filters.genres.length > 0) {
    results = results.filter(
      (g) =>
        filters.genres.includes(g.genre) ||
        (g.secondaryGenre ? filters.genres.includes(g.secondaryGenre) : false)
    );
  }

  // RF02: Offer type multi-filter
  if (filters.offerTypes.length > 0) {
    results = results.filter((g) => filters.offerTypes.includes(g.offerType));
  }

  // RF02: Free-to-Play or Price range COP
  if (filters.freeOnly) {
    results = results.filter((g) => g.finalPriceCop === 0);
  } else if (filters.maxPriceCop < 300000) {
    results = results.filter((g) => g.finalPriceCop <= filters.maxPriceCop);
  }

  // Sorting
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
// Favorites & Price Alerts (RF05, RF06, RNF07)
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

/**
 * RF06: Simulates a live price drop on one of the authenticated user's paid favorite games,
 * updates both the games and store_offers tables, and dispatches a real PriceAlert.
 */
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

  // Pick a random or top paid favorite game
  const target = paidFavGames[Math.floor(Math.random() * paidFavGames.length)];
  const oldPriceCop = target.finalPriceCop;
  // Drop by 20% from current price (rounded cleanly to hundreds)
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

  // Sync best store offer
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
// News Feed (RF07 Personalized by Favorites)
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
