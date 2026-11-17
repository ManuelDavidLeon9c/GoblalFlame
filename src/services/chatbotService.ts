import { Game, Genre, Platform } from '../types';
import { formatCOP, normalizeText } from '../utils/formatters';
import { getAllGames, getQAState, getStoreOffersForGame } from './databaseService';

export interface ChatbotResponse {
  text: string;
  recommendedGameIds: string[];
  isError?: boolean;
}

const GENRE_KEYWORDS: Array<{ genre: Genre; terms: string[] }> = [
  { genre: 'RPG', terms: ['rpg', 'rol', 'roleplay'] },
  { genre: 'Acción', terms: ['accion', 'disparos', 'combate', 'pelea', 'terror', 'survival'] },
  { genre: 'Aventura', terms: ['aventura', 'historia', 'narrativa', 'exploracion'] },
  { genre: 'Deportes', terms: ['deportes', 'futbol', 'fifa', 'fc', 'carreras', 'autos', 'conduccion'] },
  { genre: 'Indie', terms: ['indie', 'independiente', 'metroidvania', 'roguelike'] },
  { genre: 'Mundo Abierto', terms: ['mundo abierto', 'open world', 'sandbox'] },
];

const PLATFORM_KEYWORDS: Array<{ platform: Platform; terms: string[] }> = [
  { platform: 'PC', terms: ['pc', 'computador', 'computadora', 'laptop', 'steam', 'epic'] },
  { platform: 'PlayStation', terms: ['ps5', 'ps4', 'playstation', 'play', 'sony'] },
  { platform: 'Xbox', terms: ['xbox', 'series x', 'series s', 'game pass'] },
  { platform: 'Nintendo', terms: ['nintendo', 'switch', 'eshop'] },
  { platform: 'Android/Móvil', terms: ['movil', 'celular', 'android', 'telefono', 'iphone'] },
];

/**
 * RF08: Deterministic natural language catalog assistant.
 * Strictly reads live local database records without hallucinating titles or prices.
 */
export function processChatbotQuery(rawQuery: string): ChatbotResponse {
  const qa = getQAState();
  if (qa.simulateChatbotFailure) {
    return {
      text: 'El servicio del asistente IA está temporalmente fuera de línea por mantenimiento simulado (Modo QA). Puedes seguir explorando, filtrando y comparando precios en el catálogo principal sin interrupciones.',
      recommendedGameIds: [],
      isError: true,
    };
  }

  const query = normalizeText(rawQuery);
  const games = getAllGames();

  if (!query) {
    return {
      text: 'Escribe tu consulta sobre juegos, plataformas, géneros o precios en COP del catálogo de Global Flame.',
      recommendedGameIds: [],
    };
  }

  // Greeting
  if (/^(hola|buenas|hey|saludos|que tal|buenos dias|buenas tardes|buenas noches)/.test(query) && query.length < 26) {
    return {
      text: `¡Hola! Soy el asistente de catálogo de Global Flame. Actualmente monitoreo ${games.length} títulos con precios actualizados en COP. Pregúntame por un juego específico (ej. "¿Cuánto cuesta Cyberpunk 2077?"), por género ("¿Qué juegos de RPG están en oferta?") o por presupuesto ("Recomiéndame un juego barato para PC").`,
      recommendedGameIds: [],
    };
  }

  // Direct title match check
  const matchedByTitle = findTitleMatches(query, games);
  if (matchedByTitle.length > 0) {
    const game = matchedByTitle[0];
    const offers = getStoreOffersForGame(game.id);
    const offerLines = offers
      .slice(0, 3)
      .map((o) => `• ${o.storeName} (${o.platform}): ${formatCOP(o.finalPriceCop)}${o.discountPercent > 0 ? ` (-${o.discountPercent}%)` : ''}`)
      .join('\n');

    const discountText =
      game.finalPriceCop === 0
        ? 'Es un título gratuito (Free-to-Play).'
        : game.discountPercent > 0
          ? `Tiene un ${game.discountPercent}% de descuento (antes ${formatCOP(game.originalPriceCop)}, ahora ${formatCOP(game.finalPriceCop)}).`
          : `Su precio actual es ${formatCOP(game.finalPriceCop)}.`;

    return {
      text: `${game.title} (${game.genre} · ${game.platforms.join(', ')})\n${discountText}\n\nMejores precios registrados en Global Flame:\n${offerLines}`,
      recommendedGameIds: [game.id],
    };
  }

  // Check if user asks for a specific unknown game ("cuanto cuesta GTA VI" / "tienen Halo")
  if (/(cuanto cuesta|precio de|tienen|busco|valor de)/.test(query)) {
    const cleaned = query
      .replace(/(cuanto cuesta|cual es el precio de|precio de|tienen|busco|valor de|el juego|el|la|en oferta)/g, '')
      .trim();
    if (cleaned.length >= 3) {
      const topDeals = [...games]
        .sort((a, b) => b.discountPercent - a.discountPercent)
        .slice(0, 3);
      return {
        text: `No encontré "${cleaned}" dentro del inventario local actual de Global Flame. No invento precios fuera de nuestro catálogo verificado, pero estas son las mayores ofertas disponibles hoy:\n${formatGameList(topDeals)}`,
        recommendedGameIds: topDeals.map((g) => g.id),
      };
    }
  }

  // Parse intent filters (platform, genre, cheap/budget, free, top discount)
  const detectedPlatforms = PLATFORM_KEYWORDS.filter((p) =>
    p.terms.some((t) => query.includes(t))
  ).map((p) => p.platform);

  const detectedGenres = GENRE_KEYWORDS.filter((g) =>
    g.terms.some((t) => query.includes(t))
  ).map((g) => g.genre);

  const wantsFree = /(gratis|free|sin costo|cero pesos|gratuito)/.test(query);
  const wantsCheap = /(barato|economico|economica|bajo precio|menor precio|menos de|presupuesto)/.test(query);
  const wantsBestDiscount = /(mayor descuento|mejor oferta|mas descuento|descuentos|rebajas|ofertas)/.test(query);
  const wantsPopular = /(popular|populares|mejor calificado|top|recomendado)/.test(query);

  // Check numeric budget like "menos de 60000" or "60 mil"
  let maxBudget: number | null = null;
  const milMatch = query.match(/(\d+)\s*mil/);
  const numMatch = query.match(/(\d{4,6})/);
  if (milMatch) {
    maxBudget = Number(milMatch[1]) * 1000;
  } else if (numMatch) {
    maxBudget = Number(numMatch[1]);
  } else if (wantsCheap) {
    maxBudget = 100000;
  }

  let filtered = [...games];

  if (detectedPlatforms.length > 0) {
    filtered = filtered.filter((g) =>
      detectedPlatforms.some((p) => g.platforms.includes(p))
    );
  }

  if (detectedGenres.length > 0) {
    filtered = filtered.filter(
      (g) =>
        detectedGenres.includes(g.genre) ||
        (g.secondaryGenre ? detectedGenres.includes(g.secondaryGenre) : false)
    );
  }

  if (wantsFree) {
    filtered = filtered.filter((g) => g.finalPriceCop === 0);
  } else if (maxBudget !== null) {
    filtered = filtered.filter((g) => g.finalPriceCop <= maxBudget!);
  } else if (wantsBestDiscount && detectedGenres.length === 0 && detectedPlatforms.length === 0) {
    filtered = filtered.filter((g) => g.discountPercent > 0);
  }

  if (wantsCheap || maxBudget !== null) {
    filtered.sort((a, b) => a.finalPriceCop - b.finalPriceCop);
  } else if (wantsPopular) {
    filtered.sort((a, b) => b.popularityScore - a.popularityScore);
  } else {
    filtered.sort((a, b) => b.discountPercent - a.discountPercent || a.finalPriceCop - b.finalPriceCop);
  }

  if (filtered.length === 0) {
    return {
      text: 'No hay títulos en el catálogo local que cumplan exactamente con todos esos criterios combinados. Prueba ampliando el presupuesto o preguntando por otro género o plataforma.',
      recommendedGameIds: [],
    };
  }

  const topResults = filtered.slice(0, 4);
  const criteriaParts: string[] = [];
  if (detectedGenres.length > 0) criteriaParts.push(`género ${detectedGenres.join(' / ')}`);
  if (detectedPlatforms.length > 0) criteriaParts.push(`plataforma ${detectedPlatforms.join(' / ')}`);
  if (wantsFree) criteriaParts.push('juegos gratuitos');
  if (maxBudget !== null && !wantsFree) criteriaParts.push(`precio hasta ${formatCOP(maxBudget)}`);

  const intro =
    criteriaParts.length > 0
      ? `Encontré ${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'} en Global Flame (${criteriaParts.join(', ')}):`
      : 'Estas son las mejores ofertas verificadas actualmente en Global Flame:';

  return {
    text: `${intro}\n${formatGameList(topResults)}`,
    recommendedGameIds: topResults.map((g) => g.id),
  };
}

function findTitleMatches(normalizedQuery: string, games: Game[]): Game[] {
  const aliases: Array<{ gameId: string; terms: string[] }> = [
    { gameId: 'game-cyberpunk', terms: ['cyberpunk', 'night city', 'phantom liberty'] },
    { gameId: 'game-elden', terms: ['elden ring', 'elden'] },
    { gameId: 'game-gow', terms: ['god of war', 'ragnarok', 'kratos'] },
    { gameId: 'game-rdr2', terms: ['red dead', 'rdr2', 'arthur morgan'] },
    { gameId: 'game-witcher3', terms: ['witcher', 'geralt', 'wild hunt'] },
    { gameId: 'game-hollow', terms: ['hollow knight', 'hallownest'] },
    { gameId: 'game-hogwarts', terms: ['hogwarts', 'harry potter'] },
    { gameId: 'game-fc26', terms: ['fc 26', 'fc26', 'ea sports fc', 'fifa'] },
    { gameId: 'game-re4', terms: ['resident evil', 're4', 'leon kennedy'] },
    { gameId: 'game-genshin', terms: ['genshin', 'teyvat'] },
    { gameId: 'game-hades2', terms: ['hades ii', 'hades 2', 'hades'] },
    { gameId: 'game-forza5', terms: ['forza', 'horizon 5'] },
  ];

  const matchedIds: string[] = [];
  for (const entry of aliases) {
    if (entry.terms.some((term) => normalizedQuery.includes(term))) {
      matchedIds.push(entry.gameId);
    }
  }

  return matchedIds
    .map((id) => games.find((g) => g.id === id))
    .filter((g): g is Game => Boolean(g));
}

function formatGameList(games: Game[]): string {
  return games
    .map((g) => {
      const priceStr =
        g.finalPriceCop === 0
          ? `${formatCOP(0)} (Gratis)`
          : `${formatCOP(g.finalPriceCop)}${g.discountPercent > 0 ? ` (-${g.discountPercent}%)` : ''}`;
      return `• ${g.title} — ${priceStr} · ${g.bestStore}`;
    })
    .join('\n');
}
