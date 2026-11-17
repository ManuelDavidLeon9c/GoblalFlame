import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import {
  SEED_GAMES,
  SEED_NEWS,
  SEED_REVIEWS,
  SEED_STORE_OFFERS,
  SEED_USERS,
} from './src/data/seedData.ts';
import type {
  Game,
  Genre,
  NewsItem,
  Platform,
  Review,
  StoreOffer,
  User,
  UserRole,
} from './src/types/index.ts';
import {
  formatCopStrict,
  normalizeScraperPlatform,
  scrapeStorePrice,
  ScraperBlockedError,
  ScraperNotFoundError,
} from './src/services/scraperService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'globalflame_db.json');
const EXCEL_FILE = path.join(DATA_DIR, 'cuentas_globalflame.xlsx');
const TRM_COP_PER_USD = 4250;

interface ServerDB {
  users: User[];
  games: Game[];
  storeOffers: StoreOffer[];
  news: NewsItem[];
  reviews: Review[];
  lastCheapSharkSync: string | null;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDB(): ServerDB {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial: ServerDB = {
      users: structuredClone(SEED_USERS),
      games: structuredClone(SEED_GAMES),
      storeOffers: structuredClone(SEED_STORE_OFFERS),
      news: structuredClone(SEED_NEWS),
      reviews: structuredClone(SEED_REVIEWS),
      lastCheapSharkSync: null,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    syncExcelWorkbook(initial);
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw) as ServerDB;
}

function saveDB(db: ServerDB): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  syncExcelWorkbook(db);
}

function syncExcelWorkbook(db: ServerDB): void {
  try {
    const accountsSheet = db.users.map((u) => ({
      ID: u.id,
      Nombre: u.name,
      Correo: u.email,
      Contrasena: u.passwordHash,
      Rol: u.role,
      FotoPerfil: u.avatarUrl ? 'Foto cargada' : 'Iniciales',
      Plataformas: u.preferredPlatforms.join(', '),
      FechaCreacion: u.createdAt,
    }));

    const gamesSheet = db.games.map((g) => ({
      ID: g.id,
      Titulo: g.title,
      Genero: g.genre,
      Tienda: g.bestStore,
      PrecioOriginalCOP: g.originalPriceCop,
      DescuentoPct: g.discountPercent,
      PrecioFinalCOP: g.finalPriceCop,
      Fuente: g.isFromCheapShark ? 'CheapShark API' : 'Catalogo Local',
    }));

    const wb = XLSX.utils.book_new();
    const wsAccounts = XLSX.utils.json_to_sheet(accountsSheet);
    const wsGames = XLSX.utils.json_to_sheet(gamesSheet);
    XLSX.utils.book_append_sheet(wb, wsAccounts, 'Cuentas');
    XLSX.utils.book_append_sheet(wb, wsGames, 'Ofertas_COP');
    XLSX.writeFile(wb, EXCEL_FILE);
  } catch {
    // Keep server operational if excel write fails
  }
}

function usdToCop(usdStr: string): number {
  const usd = Number.parseFloat(usdStr);
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.round((usd * TRM_COP_PER_USD) / 100) * 100;
}

const CHEAPSHARK_GENRE_FALLBACKS: Genre[] = ['Acción', 'RPG', 'Aventura', 'Indie', 'Mundo Abierto'];
const CHEAPSHARK_THEMES: Game['artworkTheme'][] = [
  'cyberpunk',
  'elden',
  'gow',
  'rdr2',
  'witcher',
  'hollow',
  're4',
  'hades2',
];

interface CheapSharkDeal {
  title: string;
  dealID: string;
  storeID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  metacriticScore: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  releaseDate: number;
  dealRating: string;
  thumb: string;
}

interface CheapSharkStore {
  storeID: string;
  storeName: string;
  isActive: number;
}

function inferCheapSharkGenre(title: string, idx: number): Genre {
  const t = title.toLowerCase();
  if (/soccer|football|basketball|nba|fifa|fc\s|tennis|golf|racing|drive|rally|moto|f1|manager/.test(t)) {
    return 'Deportes';
  }
  if (/rpg|souls|elden|witcher|dragon|fantasy|persona|tales|quest|dungeon|baldurs|diablo|cyberpunk/.test(t)) {
    return 'RPG';
  }
  if (/watch_dogs|gta|frontier|island|open|horizon|skyrim|fallout|red dead|san andreas/.test(t)) {
    return 'Mundo Abierto';
  }
  if (/lego|puzzle|pixel|hollow|ori|platform|indie|sim|builder|tycoon/.test(t)) {
    return 'Indie';
  }
  if (/tomb|uncharted|plague|adventure|story|life is|syberia|darksiders/.test(t)) {
    return 'Aventura';
  }
  return CHEAPSHARK_GENRE_FALLBACKS[idx % CHEAPSHARK_GENRE_FALLBACKS.length];
}

async function fetchAndMergeCheapSharkDeals(
  db: ServerDB
): Promise<{ added: number; updated: number; totalDeals: number }> {
  const headers = {
    'User-Agent': 'GlobalFlameColombia/1.0 (soporte@globalflame.co)',
    Accept: 'application/json',
  };

  const feedUrls = [
    'https://www.cheapshark.com/api/1.0/deals?pageSize=25&pageNumber=0&sortBy=DealRating&onSale=1',
    'https://www.cheapshark.com/api/1.0/deals?pageSize=20&pageNumber=0&sortBy=Savings&onSale=1',
    'https://www.cheapshark.com/api/1.0/deals?pageSize=20&pageNumber=0&sortBy=Metacritic&onSale=1',
    'https://www.cheapshark.com/api/1.0/deals?pageSize=15&pageNumber=0&sortBy=Release&onSale=1',
    'https://www.cheapshark.com/api/1.0/deals?pageSize=15&pageNumber=0&upperPrice=5&sortBy=DealRating&onSale=1',
  ];

  const [storesRes, ...feedResponses] = await Promise.all([
    fetch('https://www.cheapshark.com/api/1.0/stores', { headers }),
    ...feedUrls.map((url) => fetch(url, { headers })),
  ]);

  const validFeeds = await Promise.all(
    feedResponses.map(async (r) => (r.ok ? ((await r.json()) as CheapSharkDeal[]) : []))
  );

  const combinedDeals = validFeeds.flat();
  if (combinedDeals.length === 0) {
    throw new Error('CheapShark API no devolvió ofertas disponibles en este momento.');
  }

  // Deduplicate by gameID + storeID while preserving first-seen priority
  const uniqueDeals: CheapSharkDeal[] = [];
  const seenDealKeys = new Set<string>();
  for (const deal of combinedDeals) {
    const key = `${deal.gameID}:${deal.storeID}`;
    if (!seenDealKeys.has(key)) {
      seenDealKeys.add(key);
      uniqueDeals.push(deal);
    }
  }

  const stores = storesRes.ok ? ((await storesRes.json()) as CheapSharkStore[]) : [];
  const storeMap = new Map<string, string>();
  stores.forEach((s) => storeMap.set(s.storeID, s.storeName));

  let added = 0;
  let updated = 0;

  uniqueDeals.forEach((deal, idx) => {
    const cleanTitle = deal.title.trim();
    const originalCop = usdToCop(deal.normalPrice);
    const finalCop = usdToCop(deal.salePrice);
    const savingsPct = Math.max(0, Math.min(99, Math.round(Number.parseFloat(deal.savings) || 0)));
    const storeName = storeMap.get(deal.storeID) || `CheapShark Tienda #${deal.storeID}`;
    const dealUrl = `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(deal.dealID)}`;
    const releaseYear =
      deal.releaseDate > 0 ? new Date(deal.releaseDate * 1000).getFullYear() : 2025;
    const rawRating =
      Number.parseFloat(deal.steamRatingPercent) || Number.parseFloat(deal.metacriticScore) || 84;
    const starRating = Number(Math.max(3.5, Math.min(5, (rawRating / 100) * 5)).toFixed(1));
    const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const isBundle = /bundle|pack|collection|trilogy|anthology|complete|ultimate|gold edition/i.test(
      cleanTitle
    );

    const existing = db.games.find(
      (g) =>
        g.cheapSharkGameId === deal.gameID ||
        g.title.toLowerCase() === cleanTitle.toLowerCase()
    );

    if (existing) {
      const offerId = `so-cs-${deal.gameID}-${deal.storeID}`;
      const existingOffer = db.storeOffers.find((o) => o.id === offerId);
      if (existingOffer) {
        existingOffer.originalPriceCop = originalCop;
        existingOffer.finalPriceCop = finalCop;
        existingOffer.discountPercent = savingsPct;
        existingOffer.url = dealUrl;
        existingOffer.lastUpdated = new Date().toISOString();
      } else {
        db.storeOffers.push({
          id: offerId,
          gameId: existing.id,
          storeName: `${storeName} (CheapShark)`,
          platform: 'PC',
          originalPriceCop: originalCop,
          discountPercent: savingsPct,
          finalPriceCop: finalCop,
          url: dealUrl,
          lastUpdated: new Date().toISOString(),
        });
      }
      if (finalCop < existing.finalPriceCop && finalCop >= 0) {
        existing.finalPriceCop = finalCop;
        existing.originalPriceCop = originalCop;
        existing.discountPercent = savingsPct;
        existing.bestStore = storeName;
        existing.storeUrl = dealUrl;
      }
      existing.cheapSharkDealId = deal.dealID;
      existing.cheapSharkGameId = deal.gameID;
      updated += 1;
    } else {
      const id = `cs-${deal.gameID}`;
      const genre = inferCheapSharkGenre(cleanTitle, idx);
      const theme = CHEAPSHARK_THEMES[idx % CHEAPSHARK_THEMES.length];

      const newGame: Game = {
        id,
        slug: slug || id,
        title: cleanTitle,
        developer: storeName,
        publisher: 'Catálogo sincronizado vía CheapShark API',
        releaseYear: Number.isFinite(releaseYear) && releaseYear > 1995 ? releaseYear : 2025,
        genre,
        platforms: ['PC'],
        offerType: finalCop === 0 ? 'Juego gratis' : isBundle ? 'Bundle' : 'Descuento',
        originalPriceCop: originalCop,
        discountPercent: savingsPct,
        finalPriceCop: finalCop,
        rating: starRating,
        popularityScore: Math.max(
          70,
          Math.min(99, Math.round(Number.parseFloat(deal.dealRating) * 10) || 82)
        ),
        bestStore: storeName,
        storeUrl: dealUrl,
        synopsis: `${cleanTitle} forma parte del catálogo en vivo de ofertas de CheapShark en ${storeName}. Precio convertido automáticamente a pesos colombianos (COP) desde ${deal.salePrice} USD (precio regular ${deal.normalPrice} USD).`,
        features: [
          `Oferta en vivo sincronizada desde CheapShark API (${storeName})`,
          `Ahorro verificado del ${savingsPct}% respecto al precio regular`,
          'Activación digital oficial en plataforma PC',
          'Conversión automática transparente a pesos colombianos (COP)',
        ],
        minSpecs: {
          os: 'Windows 10 64-bit',
          processor: 'Intel Core i5 / AMD Ryzen 5 equivalente',
          memory: '8 GB RAM',
          graphics: 'NVIDIA GTX 1050 Ti / AMD RX 570',
          storage: '35 GB de espacio disponible',
        },
        recSpecs: {
          os: 'Windows 11 64-bit',
          processor: 'Intel Core i7 / AMD Ryzen 7 equivalente',
          memory: '16 GB RAM',
          graphics: 'NVIDIA RTX 2060 / AMD RX 6600',
          storage: '35 GB SSD',
        },
        coverImage: deal.thumb || undefined,
        artworkTheme: theme,
        gallery: [
          {
            id: `${id}-1`,
            title: cleanTitle,
            caption: `Oferta activa en ${storeName} vía CheapShark`,
            imageUrl: deal.thumb || undefined,
            themeVariant: theme,
          },
          {
            id: `${id}-2`,
            title: 'Comparativa de descuento en COP',
            caption: `Descuento del ${savingsPct}% verificado`,
            themeVariant: theme,
          },
          {
            id: `${id}-3`,
            title: 'Disponibilidad digital PC',
            caption: 'Entrega de clave oficial en tienda asociada',
            themeVariant: theme,
          },
        ],
        isFeatured: idx < 4,
        isFromCheapShark: true,
        cheapSharkDealId: deal.dealID,
        cheapSharkGameId: deal.gameID,
      };

      db.games.push(newGame);
      db.storeOffers.push({
        id: `so-cs-${deal.gameID}-${deal.storeID}`,
        gameId: id,
        storeName,
        platform: 'PC',
        originalPriceCop: originalCop,
        discountPercent: savingsPct,
        finalPriceCop: finalCop,
        url: dealUrl,
        lastUpdated: new Date().toISOString(),
      });
      added += 1;
    }
  });

  db.lastCheapSharkSync = new Date().toISOString();
  saveDB(db);
  return { added, updated, totalDeals: uniqueDeals.length };
}

function getAdminFromHeader(req: express.Request, db: ServerDB): User | null {
  const adminId = req.header('x-user-id');
  if (!adminId) return null;
  const found = db.users.find((u) => u.id === adminId);
  return found && found.role === 'administrador' ? found : null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Ensure DB & Excel exist at boot and attempt background CheapShark sync
  const bootDb = loadDB();
  fetchAndMergeCheapSharkDeals(bootDb).catch(() => {
    // Graceful offline fallback
  });

  // ==========================================
  // Public & Catalog API
  // ==========================================
  app.get('/api/bootstrap', (_req, res) => {
    const db = loadDB();
    res.json({
      games: db.games,
      storeOffers: db.storeOffers,
      news: db.news,
      reviews: db.reviews,
      lastCheapSharkSync: db.lastCheapSharkSync,
    });
  });

  app.post('/api/cheapshark/sync', async (_req, res) => {
    const db = loadDB();
    try {
      const summary = await fetchAndMergeCheapSharkDeals(db);
      res.json({
        ok: true,
        summary,
        games: db.games,
        storeOffers: db.storeOffers,
        lastCheapSharkSync: db.lastCheapSharkSync,
      });
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'No fue posible conectar con CheapShark API',
        games: db.games,
        storeOffers: db.storeOffers,
      });
    }
  });

  // ==========================================
  // Auth API (Usuario vs Administrador)
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    const { email, password, expectedRole } = req.body as {
      email?: string;
      password?: string;
      expectedRole?: UserRole;
    };
    const db = loadDB();
    const cleanEmail = (email ?? '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user || user.passwordHash !== password) {
      res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' });
      return;
    }

    if (expectedRole && user.role !== expectedRole) {
      res.status(403).json({
        ok: false,
        error:
          expectedRole === 'administrador'
            ? 'Esta cuenta pertenece al rol Usuario. Cambia al modo Usuario o usa credenciales de Administrador.'
            : 'Esta cuenta pertenece al rol Administrador. Cambia a la pestaña Administrador para ingresar.',
      });
      return;
    }

    res.json({ ok: true, user });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role, preferredPlatforms } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      preferredPlatforms?: Platform[];
    };
    const db = loadDB();
    const cleanName = (name ?? '').trim();
    const cleanEmail = (email ?? '').trim().toLowerCase();

    if (cleanName.length < 2) {
      res.status(400).json({ ok: false, error: 'Ingresa tu nombre completo (mínimo 2 caracteres).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ ok: false, error: 'Correo electrónico inválido.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' });
      return;
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
      role: role === 'administrador' ? 'administrador' : 'usuario',
      avatarInitials: initials || 'GF',
      preferredPlatforms: preferredPlatforms && preferredPlatforms.length > 0 ? preferredPlatforms : ['PC'],
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDB(db);
    res.json({ ok: true, user: newUser });
  });

  app.put('/api/users/me/avatar', (req, res) => {
    const requesterId = req.header('x-user-id');
    if (!requesterId) {
      res.status(401).json({ ok: false, error: 'Debes iniciar sesión para actualizar tu foto.' });
      return;
    }

    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === requesterId);
    if (idx === -1) {
      res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });
      return;
    }

    const { avatarUrl } = req.body as { avatarUrl?: string | null };
    if (avatarUrl === null || avatarUrl === '') {
      delete db.users[idx].avatarUrl;
      saveDB(db);
      res.json({ ok: true, user: db.users[idx] });
      return;
    }

    if (
      typeof avatarUrl !== 'string' ||
      !/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(avatarUrl)
    ) {
      res.status(400).json({ ok: false, error: 'Formato de imagen no válido (usa PNG, JPG, WEBP o GIF).' });
      return;
    }

    if (avatarUrl.length > 450_000) {
      res.status(400).json({
        ok: false,
        error: 'La imagen es demasiado pesada. Intenta con una foto más ligera.',
      });
      return;
    }

    db.users[idx].avatarUrl = avatarUrl;
    saveDB(db);
    res.json({ ok: true, user: db.users[idx] });
  });

  app.delete('/api/users/me', (req, res) => {
    const requesterId = req.header('x-user-id');
    if (!requesterId) {
      res.status(401).json({ ok: false, error: 'Debes iniciar sesión para eliminar tu cuenta.' });
      return;
    }

    const db = loadDB();
    const target = db.users.find((u) => u.id === requesterId);
    if (!target) {
      res.status(404).json({ ok: false, error: 'La cuenta ya no existe.' });
      return;
    }

    if (target.role === 'administrador') {
      const adminCount = db.users.filter((u) => u.role === 'administrador').length;
      if (adminCount <= 1) {
        res.status(400).json({
          ok: false,
          error: 'No puedes eliminar la única cuenta de Administrador activa del sistema.',
        });
        return;
      }
    }

    db.users = db.users.filter((u) => u.id !== target.id);
    saveDB(db);
    res.json({ ok: true, deletedUserId: target.id });
  });

  // ==========================================
  // Community Reviews API
  // ==========================================
  app.post('/api/reviews', (req, res) => {
    const { gameId, userId, rating, comment } = req.body as {
      gameId?: string;
      userId?: string;
      rating?: number;
      comment?: string;
    };
    const db = loadDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(401).json({ ok: false, error: 'Debes iniciar sesión para publicar una reseña.' });
      return;
    }
    const game = db.games.find((g) => g.id === gameId);
    if (!game) {
      res.status(404).json({ ok: false, error: 'Videojuego no encontrado.' });
      return;
    }
    const cleanComment = (comment ?? '').trim();
    const numericRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    if (cleanComment.length < 4) {
      res.status(400).json({ ok: false, error: 'Escribe una reseña de al menos 4 caracteres.' });
      return;
    }

    const review: Review = {
      id: `rev-${Date.now()}`,
      gameId: game.id,
      userId: user.id,
      userName: user.name,
      userInitials: user.avatarInitials,
      rating: numericRating,
      comment: cleanComment,
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(review);

    // Recalculate game rating with community reviews
    const gameReviews = db.reviews.filter((r) => r.gameId === game.id);
    if (gameReviews.length > 0) {
      const avg = gameReviews.reduce((acc, r) => acc + r.rating, 0) / gameReviews.length;
      game.rating = Number(avg.toFixed(1));
    }

    saveDB(db);
    res.json({ ok: true, review, reviews: db.reviews, updatedGame: game });
  });

  app.delete('/api/reviews/:id', (req, res) => {
    const db = loadDB();
    const requesterId = req.header('x-user-id');
    const requester = db.users.find((u) => u.id === requesterId);
    const target = db.reviews.find((r) => r.id === req.params.id);

    if (!target) {
      res.status(404).json({ ok: false, error: 'Reseña no encontrada.' });
      return;
    }
    if (!requester || (requester.role !== 'administrador' && requester.id !== target.userId)) {
      res.status(403).json({ ok: false, error: 'No tienes permiso para eliminar esta reseña.' });
      return;
    }

    db.reviews = db.reviews.filter((r) => r.id !== target.id);
    saveDB(db);
    res.json({ ok: true, reviews: db.reviews });
  });

  // ==========================================
  // Admin Accounts & Excel/AppSheet API
  // ==========================================
  app.get('/api/admin/users', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Acceso restringido a Administradores.' });
      return;
    }
    res.json({ ok: true, users: db.users });
  });

  app.post('/api/admin/users', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Acceso restringido a Administradores.' });
      return;
    }
    const { name, email, passwordHash, role, preferredPlatforms } = req.body as Partial<User>;
    const cleanEmail = (email ?? '').trim().toLowerCase();
    if (!name || !cleanEmail || !passwordHash) {
      res.status(400).json({ ok: false, error: 'Nombre, correo y contraseña son obligatorios.' });
      return;
    }
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ ok: false, error: 'Ese correo ya existe en la tabla.' });
      return;
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: passwordHash.trim(),
      role: role === 'administrador' ? 'administrador' : 'usuario',
      avatarInitials: name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'GF',
      preferredPlatforms: preferredPlatforms && preferredPlatforms.length > 0 ? preferredPlatforms : ['PC'],
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDB(db);
    res.json({ ok: true, users: db.users });
  });

  app.put('/api/admin/users/:id', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Acceso restringido a Administradores.' });
      return;
    }
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ ok: false, error: 'Cuenta no encontrada.' });
      return;
    }
    const patch = req.body as Partial<User>;
    const current = db.users[idx];
    const nextName = patch.name !== undefined ? patch.name.trim() : current.name;
    db.users[idx] = {
      ...current,
      name: nextName || current.name,
      email: patch.email !== undefined ? patch.email.trim().toLowerCase() : current.email,
      passwordHash: patch.passwordHash !== undefined ? patch.passwordHash : current.passwordHash,
      role: patch.role === 'administrador' || patch.role === 'usuario' ? patch.role : current.role,
      preferredPlatforms: patch.preferredPlatforms ?? current.preferredPlatforms,
      avatarInitials: nextName
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || current.avatarInitials,
    };
    saveDB(db);
    res.json({ ok: true, users: db.users });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const db = loadDB();
    const admin = getAdminFromHeader(req, db);
    if (!admin) {
      res.status(403).json({ ok: false, error: 'Acceso restringido a Administradores.' });
      return;
    }
    if (req.params.id === admin.id) {
      res.status(400).json({ ok: false, error: 'No puedes eliminar tu propia cuenta activa.' });
      return;
    }
    db.users = db.users.filter((u) => u.id !== req.params.id);
    saveDB(db);
    res.json({ ok: true, users: db.users });
  });

  app.get('/api/admin/excel/export', (req, res) => {
    const db = loadDB();
    const adminId = (req.query.userId as string) || req.header('x-user-id') || '';
    const admin = db.users.find((u) => u.id === adminId && u.role === 'administrador');
    if (!admin) {
      res.status(403).json({ ok: false, error: 'Acceso restringido a Administradores.' });
      return;
    }
    syncExcelWorkbook(db);
    res.download(EXCEL_FILE, 'cuentas_globalflame.xlsx');
  });

  app.post('/api/admin/excel/import', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Acceso restringido a Administradores.' });
      return;
    }
    const { rows } = req.body as {
      rows?: Array<{
        ID?: string;
        Nombre?: string;
        Correo?: string;
        Contrasena?: string;
        Rol?: string;
        Plataformas?: string;
      }>;
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ ok: false, error: 'El archivo Excel no contiene filas válidas.' });
      return;
    }

    let importedCount = 0;
    for (const row of rows) {
      const email = String(row.Correo ?? '').trim().toLowerCase();
      const name = String(row.Nombre ?? '').trim();
      const pass = String(row.Contrasena ?? '').trim();
      if (!email || !name || !pass) continue;

      const role: UserRole =
        String(row.Rol ?? '').toLowerCase().includes('admin') ? 'administrador' : 'usuario';
      const platformsRaw = String(row.Plataformas ?? 'PC')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as Platform[];

      const existing = db.users.find((u) => u.email.toLowerCase() === email);
      if (existing) {
        existing.name = name;
        existing.passwordHash = pass;
        existing.role = role;
        if (platformsRaw.length > 0) existing.preferredPlatforms = platformsRaw;
      } else {
        db.users.push({
          id: row.ID ? String(row.ID) : `usr-${Date.now()}-${importedCount}`,
          name,
          email,
          passwordHash: pass,
          role,
          avatarInitials:
            name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? '')
              .join('') || 'GF',
          preferredPlatforms: platformsRaw.length > 0 ? platformsRaw : ['PC'],
          createdAt: new Date().toISOString(),
        });
      }
      importedCount += 1;
    }

    saveDB(db);
    res.json({ ok: true, importedCount, users: db.users });
  });

  // ==========================================
  // Admin Games & News CRUD API
  // ==========================================
  app.post('/api/admin/games', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Solo un Administrador puede agregar juegos.' });
      return;
    }
    const body = req.body as Partial<Game>;
    if (!body.title || body.finalPriceCop === undefined) {
      res.status(400).json({ ok: false, error: 'Título y precio final en COP son obligatorios.' });
      return;
    }
    const orig = Math.max(0, Number(body.originalPriceCop ?? body.finalPriceCop));
    const fin = Math.max(0, Number(body.finalPriceCop));
    const disc = orig > 0 ? Math.max(0, Math.round(((orig - fin) / orig) * 100)) : 0;
    const id = `game-custom-${Date.now()}`;

    const newGame: Game = {
      id,
      slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: body.title.trim(),
      developer: body.developer?.trim() || 'Estudio Independiente',
      publisher: body.publisher?.trim() || 'Global Flame',
      releaseYear: Number(body.releaseYear) || 2026,
      genre: body.genre || 'Acción',
      platforms: body.platforms && body.platforms.length > 0 ? body.platforms : ['PC'],
      offerType: fin === 0 ? 'Juego gratis' : body.offerType || 'Descuento',
      originalPriceCop: orig,
      discountPercent: disc,
      finalPriceCop: fin,
      rating: 4.5,
      popularityScore: 85,
      bestStore: body.bestStore?.trim() || 'Steam Colombia',
      storeUrl: body.storeUrl?.trim() || 'https://store.steampowered.com/',
      synopsis:
        body.synopsis?.trim() ||
        'Oferta agregada y verificada por el equipo de administración de Global Flame Colombia.',
      features: body.features && body.features.length > 0
        ? body.features
        : ['Precio verificado en pesos colombianos (COP)', 'Activación digital oficial'],
      minSpecs: body.minSpecs ?? {
        os: 'Windows 10 64-bit',
        processor: 'Intel Core i5 / AMD Ryzen 5',
        memory: '8 GB RAM',
        graphics: 'GTX 1060 / RX 580',
        storage: '40 GB SSD',
      },
      recSpecs: body.recSpecs ?? {
        os: 'Windows 11 64-bit',
        processor: 'Intel Core i7 / AMD Ryzen 7',
        memory: '16 GB RAM',
        graphics: 'RTX 3060 / RX 6700 XT',
        storage: '40 GB NVMe SSD',
      },
      coverImage: body.coverImage?.trim() || undefined,
      artworkTheme: body.artworkTheme || 'cyberpunk',
      gallery: [
        {
          id: `${id}-1`,
          title: body.title.trim(),
          caption: `Disponible en ${body.bestStore?.trim() || 'Steam Colombia'}`,
          imageUrl: body.coverImage?.trim() || undefined,
          themeVariant: body.artworkTheme || 'cyberpunk',
        },
        {
          id: `${id}-2`,
          title: 'Comparativa de precio',
          caption: 'Verificado en pesos colombianos',
          themeVariant: body.artworkTheme || 'cyberpunk',
        },
        {
          id: `${id}-3`,
          title: 'Requisitos técnicos',
          caption: 'Optimizado para plataforma seleccionada',
          themeVariant: body.artworkTheme || 'cyberpunk',
        },
      ],
      isFeatured: Boolean(body.isFeatured),
    };

    db.games.unshift(newGame);
    db.storeOffers.push({
      id: `so-${id}`,
      gameId: id,
      storeName: newGame.bestStore,
      platform: newGame.platforms[0],
      originalPriceCop: orig,
      discountPercent: disc,
      finalPriceCop: fin,
      url: newGame.storeUrl,
      lastUpdated: new Date().toISOString(),
    });
    saveDB(db);
    res.json({ ok: true, game: newGame, games: db.games, storeOffers: db.storeOffers });
  });

  app.put('/api/admin/games/:id', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Solo un Administrador puede editar juegos.' });
      return;
    }
    const idx = db.games.findIndex((g) => g.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ ok: false, error: 'Videojuego no encontrado.' });
      return;
    }
    const current = db.games[idx];
    const patch = req.body as Partial<Game>;
    const orig = patch.originalPriceCop !== undefined ? Number(patch.originalPriceCop) : current.originalPriceCop;
    const fin = patch.finalPriceCop !== undefined ? Number(patch.finalPriceCop) : current.finalPriceCop;
    const disc = orig > 0 ? Math.max(0, Math.round(((orig - fin) / orig) * 100)) : 0;

    db.games[idx] = {
      ...current,
      ...patch,
      originalPriceCop: orig,
      finalPriceCop: fin,
      discountPercent: disc,
    };

    const offerIdx = db.storeOffers.findIndex((o) => o.gameId === current.id);
    if (offerIdx >= 0) {
      db.storeOffers[offerIdx] = {
        ...db.storeOffers[offerIdx],
        storeName: db.games[idx].bestStore,
        originalPriceCop: orig,
        finalPriceCop: fin,
        discountPercent: disc,
        lastUpdated: new Date().toISOString(),
      };
    }

    saveDB(db);
    res.json({ ok: true, game: db.games[idx], games: db.games, storeOffers: db.storeOffers });
  });

  app.delete('/api/admin/games/:id', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Solo un Administrador puede eliminar juegos.' });
      return;
    }
    db.games = db.games.filter((g) => g.id !== req.params.id);
    db.storeOffers = db.storeOffers.filter((o) => o.gameId !== req.params.id);
    saveDB(db);
    res.json({ ok: true, games: db.games, storeOffers: db.storeOffers });
  });

  app.post('/api/admin/news', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Solo un Administrador puede publicar novedades.' });
      return;
    }
    const body = req.body as Partial<NewsItem>;
    if (!body.title || !body.summary) {
      res.status(400).json({ ok: false, error: 'Titular y resumen son obligatorios.' });
      return;
    }
    const newItem: NewsItem = {
      id: `news-${Date.now()}`,
      title: body.title.trim(),
      summary: body.summary.trim(),
      content: body.content?.trim() || body.summary.trim(),
      category: body.category || 'Noticias',
      publishedAt: new Date().toISOString(),
      author: body.author?.trim() || 'Administración Global Flame',
      readTime: '3 min',
      relatedGameIds: body.relatedGameIds ?? [],
      relatedGenres: body.relatedGenres ?? ['Acción'],
      artworkTheme: body.artworkTheme || 'cyberpunk',
    };
    db.news.unshift(newItem);
    saveDB(db);
    res.json({ ok: true, newsItem: newItem, news: db.news });
  });

  app.put('/api/admin/news/:id', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Solo un Administrador puede editar novedades.' });
      return;
    }
    const idx = db.news.findIndex((n) => n.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ ok: false, error: 'Novedad no encontrada.' });
      return;
    }
    db.news[idx] = { ...db.news[idx], ...(req.body as Partial<NewsItem>) };
    saveDB(db);
    res.json({ ok: true, newsItem: db.news[idx], news: db.news });
  });

  app.delete('/api/admin/news/:id', (req, res) => {
    const db = loadDB();
    if (!getAdminFromHeader(req, db)) {
      res.status(403).json({ ok: false, error: 'Solo un Administrador puede eliminar novedades.' });
      return;
    }
    db.news = db.news.filter((n) => n.id !== req.params.id);
    saveDB(db);
    res.json({ ok: true, news: db.news });
  });

  // ==========================================
  // Live 2026 Gaming News API (Steam Web API)
  // ==========================================
  let cachedNews2026: { fetchedAt: number; items: Array<Record<string, unknown>> } | null = null;

  function cleanNewsBody(raw: string): string {
    return (raw || '')
      .replace(/\{STEAM_CLAN_IMAGE\}[^\s\]"']*/gi, '')
      .replace(/\[img\][\s\S]*?\[\/img\]/gi, '')
      .replace(/\[url=[^\]]*\]/gi, '')
      .replace(/\[\/?url\]/gi, '')
      .replace(/\[\/?(b|i|u|h1|h2|h3|list|olist|\*|quote|code|spoiler|strike)\]/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  app.get('/api/news/2026', async (_req, res) => {
    const now = Date.now();
    if (cachedNews2026 && now - cachedNews2026.fetchedAt < 10 * 60 * 1000) {
      res.json({
        ok: true,
        year: new Date().getUTCFullYear(),
        items: cachedNews2026.items,
        cached: true,
      });
      return;
    }

    const currentYear = new Date().getUTCFullYear();
    const trackedApps = [
      { appid: 730, gameTitle: 'Counter-Strike 2' },
      { appid: 2694490, gameTitle: 'Path of Exile 2' },
      { appid: 1091500, gameTitle: 'Cyberpunk 2077' },
      { appid: 2246340, gameTitle: 'Monster Hunter Wilds' },
      { appid: 892970, gameTitle: 'Valheim' },
      { appid: 1245620, gameTitle: 'ELDEN RING' },
      { appid: 1145350, gameTitle: 'Hades II' },
      { appid: 1030300, gameTitle: 'Hollow Knight: Silksong' },
      { appid: 1086940, gameTitle: "Baldur's Gate 3" },
    ];

    try {
      const results = await Promise.allSettled(
        trackedApps.map(async (appInfo) => {
          const apiUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appInfo.appid}&count=4&maxlength=360&feeds=steam_community_announcements,pcgamer,eurogamer,rockpapershotgun&format=json`;
          const r = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'GlobalFlameColombia/1.0 (soporte@globalflame.co)',
              Accept: 'application/json',
            },
          });
          if (!r.ok) return [];
          const data = (await r.json()) as {
            appnews?: {
              newsitems?: Array<{
                gid: string;
                title: string;
                url: string;
                author: string;
                contents: string;
                feedlabel: string;
                date: number;
                appid: number;
              }>;
            };
          };
          const items = data.appnews?.newsitems ?? [];
          return items
            .filter((item) => new Date(item.date * 1000).getUTCFullYear() >= currentYear)
            .slice(0, 2)
            .map((item) => ({
              id: `${appInfo.appid}-${item.gid}`,
              appid: appInfo.appid,
              gameTitle: appInfo.gameTitle,
              title: item.title,
              summary: cleanNewsBody(item.contents),
              url: item.url,
              author: item.author || appInfo.gameTitle,
              source: item.feedlabel || 'Anuncio Oficial',
              publishedAt: new Date(item.date * 1000).toISOString(),
              image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appInfo.appid}/header.jpg`,
            }));
        })
      );

      const collected: Array<{
        id: string;
        appid: number;
        gameTitle: string;
        title: string;
        summary: string;
        url: string;
        author: string;
        source: string;
        publishedAt: string;
        image: string;
      }> = [];

      for (const r of results) {
        if (r.status === 'fulfilled') {
          collected.push(...r.value);
        }
      }

      collected.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      // Prioritize variety across games for the first 9 cards
      const picked: typeof collected = [];
      const seenGames = new Set<number>();
      for (const item of collected) {
        if (!seenGames.has(item.appid)) {
          picked.push(item);
          seenGames.add(item.appid);
        }
        if (picked.length >= 9) break;
      }
      if (picked.length < 9) {
        const pickedIds = new Set(picked.map((p) => p.id));
        for (const item of collected) {
          if (!pickedIds.has(item.id)) {
            picked.push(item);
            if (picked.length >= 9) break;
          }
        }
      }

      cachedNews2026 = { fetchedAt: now, items: picked };
      res.json({ ok: true, year: currentYear, items: picked, cached: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error consultando noticias 2026.';
      res.status(502).json({ ok: false, error: message, items: [] });
    }
  });

  // ==========================================
  // Plan B: Web Scraping Microservice Endpoint
  // Complemento resiliente para Consolas (PS, Xbox, Nintendo) y Móvil (Google Play)
  // No interfiere con CheapShark API (PC).
  // ==========================================
  app.get('/api/scrape/price', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    const rawPlatform = typeof req.query.platform === 'string' ? req.query.platform.trim() : '';
    const gameId = typeof req.query.gameId === 'string' ? req.query.gameId.trim() : '';

    if (!rawUrl || !rawPlatform) {
      res.status(400).json({
        success: false,
        source: 'Web Scraping (Plan B)',
        error: 'Debes enviar los parámetros query "url" y "platform" (PlayStation, Xbox, Nintendo, Mobile).',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const platform = normalizeScraperPlatform(rawPlatform);
    if (!platform) {
      res.status(400).json({
        success: false,
        source: 'Web Scraping (Plan B)',
        error: `Plataforma no soportada "${rawPlatform}". Usa PlayStation, Xbox, Nintendo o Mobile.`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const findCachedFallback = () => {
      const db = loadDB();
      const matchedOffer = db.storeOffers.find(
        (o) => (gameId ? o.gameId === gameId : false) && o.url === rawUrl
      );
      const matchedGame = gameId
        ? db.games.find((g) => g.id === gameId)
        : db.games.find((g) => g.storeUrl === rawUrl);

      if (matchedOffer) {
        return {
          game_title: matchedGame?.title || 'Título en caché',
          storeName: matchedOffer.storeName,
          price_cop_formatted: formatCopStrict(matchedOffer.finalPriceCop),
          discount_percent: matchedOffer.discountPercent > 0 ? `-${matchedOffer.discountPercent}%` : '0%',
        };
      }
      if (matchedGame) {
        return {
          game_title: matchedGame.title,
          storeName: matchedGame.bestStore,
          price_cop_formatted: formatCopStrict(matchedGame.finalPriceCop),
          discount_percent: matchedGame.discountPercent > 0 ? `-${matchedGame.discountPercent}%` : '0%',
        };
      }
      return null;
    };

    try {
      const result = await scrapeStorePrice({
        url: rawUrl,
        platform,
        trmCopPerUsd: TRM_COP_PER_USD,
      });
      res.json(result);
    } catch (err) {
      const cachedFallback = findCachedFallback();
      if (err instanceof ScraperBlockedError) {
        res.status(403).json({
          success: false,
          source: 'Web Scraping (Plan B)',
          platform,
          error: err.message,
          cached_fallback: cachedFallback,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const errorMsg =
        err instanceof ScraperNotFoundError
          ? err.message
          : 'Error: No se pudo extraer la información. Usar precio en caché de PostgreSQL';

      res.status(404).json({
        success: false,
        source: 'Web Scraping (Plan B)',
        platform,
        error: errorMsg,
        cached_fallback: cachedFallback,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ==========================================
  // Multi-Page Vite / Static Serving
  // ==========================================
  app.get('/favicon.svg', (_req, res) => {
    res.type('image/svg+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'favicon.svg'));
  });

  app.get('/novedades-rawg.html', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'novedades-rawg.html'));
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Global Flame server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
