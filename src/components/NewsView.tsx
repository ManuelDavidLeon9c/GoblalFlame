import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ExternalLink,
  Flame,
  Newspaper,
  RefreshCw,
  Rocket,
  Star,
  Trophy,
  X,
} from 'lucide-react';

type NewsTab = 'populares' | 'lanzamientos' | 'noticias' | 'eventos';

interface RawgGame {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  ratings_count: number;
  genres?: Array<{ id: number; name: string }>;
}

interface LiveNewsItem {
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
}

interface EventCard {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  description: string;
  highlight: string;
}

const RAWG_API_KEY = '062c02ee49ef4184abbc0e744729f9db';

function getDateRanges() {
  const now = new Date();
  const year = now.getFullYear();
  const toIso = (d: Date) => d.toISOString().slice(0, 10);

  const todayIso = toIso(now);
  const yearStartIso = `${year}-01-01`;

  const recentStart = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);
  const recentStartIso = toIso(recentStart) < yearStartIso ? yearStartIso : toIso(recentStart);

  return { year, todayIso, yearStartIso, recentStartIso };
}

const SIMULATED_EVENTS: EventCard[] = [
  {
    id: 'evt-tga-2026',
    title: 'The Game Awards 2026',
    date: '10 de Diciembre 2026 · 19:30 COT',
    location: 'Peacock Theater, Los Ángeles / Streaming Global',
    category: 'Premiación y Estrenos',
    description:
      'Ceremonia oficial al Juego del Año 2026 con estrenos mundiales, tráilers inéditos para 2027 y ofertas relámpago en tiendas digitales.',
    highlight: 'Nominados GOTY 2026 y descuentos en vivo',
  },
  {
    id: 'evt-pcgs-2026',
    title: 'PC Gaming Show: Most Wanted',
    date: 'Diciembre 2026 · 15:00 COT',
    location: 'Transmisión Global Digital',
    category: 'Showcase PC y Steam',
    description:
      'Conteo regresivo con los 25 lanzamientos de PC más esperados, entrevistas exclusivas con desarrolladores y demos jugables.',
    highlight: 'Demos gratuitas por tiempo limitado',
  },
  {
    id: 'evt-sgf-2027',
    title: 'Summer Game Fest Showcase',
    date: 'Junio 2027 · 16:00 COT',
    location: 'YouTube Theater / Transmisión Global',
    category: 'Conferencia Principal',
    description:
      'El gran evento de mitad de año con anuncios multiplataforma para PC, PlayStation, Xbox y Nintendo Switch 2.',
    highlight: 'Más de 40 estudios internacionales confirmados',
  },
];

function formatDateEs(iso: string | null): string {
  if (!iso) return 'Fecha por confirmar';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const NewsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NewsTab>('populares');
  const [games, setGames] = useState<RawgGame[]>([]);
  const [newsItems, setNewsItems] = useState<LiveNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [selectedNews, setSelectedNews] = useState<LiveNewsItem | null>(null);

  const { year: currentYear } = getDateRanges();

  const loadTabContent = useCallback(async (tab: NewsTab) => {
    if (tab === 'eventos') {
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { todayIso, yearStartIso, recentStartIso } = getDateRanges();

      if (tab === 'noticias') {
        const response = await fetch('/api/news/2026');
        if (!response.ok) {
          throw new Error(`El servidor de noticias respondió con estado HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          ok: boolean;
          items?: LiveNewsItem[];
          error?: string;
        };
        if (!data.ok || !Array.isArray(data.items)) {
          throw new Error(data.error || 'No se pudieron obtener noticias recientes.');
        }
        setNewsItems(data.items);
      } else {
        const endpoint =
          tab === 'populares'
            ? `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=${yearStartIso},${todayIso}&ordering=-added&page_size=8`
            : `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=${recentStartIso},${todayIso}&ordering=-added&page_size=8`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`RAWG API respondió con estado HTTP ${response.status}`);
        }
        const data = (await response.json()) as { results?: RawgGame[] };
        setGames(Array.isArray(data.results) ? data.results : []);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Error consultando la fuente en vivo: ${err.message}`
          : 'Ocurrió un error inesperado al cargar los datos.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab, loadTabContent]);

  const tabs: Array<{ id: NewsTab; label: string; icon: React.ReactNode }> = [
    { id: 'populares', label: `Populares ${currentYear}`, icon: <Flame className="h-4 w-4" /> },
    { id: 'lanzamientos', label: 'Lanzamientos', icon: <Rocket className="h-4 w-4" /> },
    { id: 'noticias', label: `Noticias ${currentYear}`, icon: <Newspaper className="h-4 w-4" /> },
    { id: 'eventos', label: 'Eventos', icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-2 py-4 sm:px-6">
      {/* Centered Warm Header */}
      <header className="flex max-w-3xl flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B]">
          Global Flame · Actualidad Gamer {currentYear}
        </p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-balance">
          Novedades y Noticias Gamer
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#D6C7BA] sm:text-base">
          Explora los videojuegos más populares de {currentYear}, los lanzamientos más recientes de
          esta temporada, noticias oficiales en vivo y los próximos eventos globales.
        </p>
      </header>

      {/* Centered Tabs Bar (Warm Palette) */}
      <nav
        aria-label="Categorías de novedades"
        className="mt-8 flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#33251D] bg-[#1D1511] p-2 shadow-lg shadow-black/40"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/35 ring-1 ring-[#F59E0B]/50'
                  : 'text-[#D6C7BA] hover:bg-[#150F0B] hover:text-[#F59E0B]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Content Container (Centered Grid) */}
      <div className="mt-8 w-full">
        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: activeTab === 'noticias' ? 6 : 8 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-[#33251D] bg-[#1D1511] animate-pulse"
              >
                <div className="h-44 w-full bg-[#150F0B]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-[#33251D]" />
                  <div className="h-3 w-1/2 rounded bg-[#33251D]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-red-500/40 bg-[#1D1511] p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
            <h2 className="font-display mt-3 text-lg font-bold text-white">
              No pudimos cargar esta sección
            </h2>
            <p className="mt-2 text-sm text-[#D6C7BA]">{error}</p>
            <button
              type="button"
              onClick={() => loadTabContent(activeTab)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C2410C] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar conexión
            </button>
          </div>
        )}

        {/* TAB 1 & 2: Populares 2026 / Lanzamientos Recientes 2026 */}
        {!loading && !error && (activeTab === 'populares' || activeTab === 'lanzamientos') && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => {
              const imgKey = `${activeTab}-${game.id}`;
              const hasValidImg = Boolean(game.background_image) && !brokenImages[imgKey];
              const genres = game.genres?.slice(0, 2).map((g) => g.name).join(' · ') || 'Videojuego';

              return (
                <article
                  key={game.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#33251D] bg-[#1D1511] transition-all duration-200 hover:-translate-y-1 hover:border-[#EA580C]/75 hover:shadow-[0_12px_30px_-10px_rgba(234,88,12,0.28)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#150F0B]">
                    {hasValidImg ? (
                      <img
                        src={game.background_image!}
                        alt={game.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [imgKey]: true }))
                        }
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2B170D] to-[#150F0B] p-4 text-center">
                        <span className="font-display text-sm font-bold text-[#F59E0B]">
                          {game.name}
                        </span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1D1511] via-transparent to-transparent" />

                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg border border-[#F59E0B]/35 bg-[#120D0A]/85 px-2.5 py-1 text-xs font-bold text-[#F59E0B] backdrop-blur-sm">
                      <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="font-mono-num">
                        {game.rating > 0 ? game.rating.toFixed(2) : 'Nuevo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <p className="text-xs font-medium text-[#F59E0B]">{genres}</p>
                      <h2 className="font-display mt-1 line-clamp-2 text-base font-bold text-white group-hover:text-[#FBBF24] transition-colors">
                        {game.name}
                      </h2>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#33251D] pt-3 text-xs text-[#D6C7BA]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#EA580C]" />
                        {formatDateEs(game.released)}
                      </span>
                      <span className="font-mono-num text-[#A89789]">
                        {game.ratings_count} votos
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* TAB 3: Noticias en Vivo 2026 (Steam Web API) */}
        {!loading && !error && activeTab === 'noticias' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item) => {
              const imgKey = `news-${item.id}`;
              const hasImg = Boolean(item.image) && !brokenImages[imgKey];

              return (
                <article
                  key={item.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#33251D] bg-[#1D1511] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#EA580C]/75 hover:shadow-[0_12px_30px_-10px_rgba(234,88,12,0.25)]"
                >
                  <div>
                    {hasImg && (
                      <div className="mb-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#150F0B]">
                        <img
                          src={item.image}
                          alt={item.gameTitle}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [imgKey]: true }))
                          }
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 text-xs text-[#A89789]">
                      <span className="font-semibold text-[#F59E0B] truncate">
                        {item.gameTitle} · {item.source}
                      </span>
                      <span className="shrink-0">{formatDateEs(item.publishedAt)}</span>
                    </div>

                    <h2 className="font-display mt-2 text-lg font-bold leading-snug text-white group-hover:text-[#FBBF24] transition-colors">
                      {item.title}
                    </h2>

                    <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-[#D6C7BA]">
                      {item.summary || `Actualización oficial publicada para ${item.gameTitle}.`}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#33251D] pt-3.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedNews(item)}
                      className="font-semibold text-[#FAF5F0] hover:text-[#F59E0B]"
                    >
                      Leer detalle
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#F59E0B] hover:underline"
                    >
                      Fuente oficial
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* TAB 4: Eventos (3 Centered Simulated Event Cards - Warm Palette) */}
        {!loading && !error && activeTab === 'eventos' && (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {SIMULATED_EVENTS.map((ev) => (
              <article
                key={ev.id}
                className="flex flex-col justify-between rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#EA580C]/75 hover:shadow-[0_12px_30px_-10px_rgba(234,88,12,0.28)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#F59E0B]">{ev.category}</span>
                    <Trophy className="h-4 w-4 text-[#EA580C]" />
                  </div>

                  <h2 className="font-display mt-3 text-xl font-bold text-white">{ev.title}</h2>

                  <p className="mt-2 text-xs font-medium text-[#A89789]">
                    {ev.date} · {ev.location}
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-[#D6C7BA]">{ev.description}</p>
                </div>

                <div className="mt-5 border-t border-[#33251D] pt-3.5 text-xs font-semibold text-[#F59E0B]">
                  {ev.highlight}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* News Detail Modal Reader */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-modal-title"
        >
          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#F59E0B]">
                  {selectedNews.gameTitle} · {formatDateEs(selectedNews.publishedAt)}
                </p>
                <h2 id="news-modal-title" className="font-display mt-1 text-xl font-bold text-white">
                  {selectedNews.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="rounded-lg p-1.5 text-[#A89789] hover:bg-[#261A14] hover:text-white"
                aria-label="Cerrar detalle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedNews.image && (
              <img
                src={selectedNews.image}
                alt={selectedNews.gameTitle}
                referrerPolicy="no-referrer"
                className="mt-4 max-h-60 w-full rounded-xl object-cover bg-[#150F0B]"
              />
            )}

            <p className="mt-4 text-sm leading-relaxed text-[#FAF5F0]">
              {selectedNews.summary ||
                `Anuncio oficial publicado para ${selectedNews.gameTitle}.`}
            </p>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#33251D] pt-4">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="rounded-xl border border-[#33251D] px-4 py-2 text-xs font-medium text-[#D6C7BA] hover:text-white"
              >
                Cerrar
              </button>
              <a
                href={selectedNews.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C2410C]"
              >
                Abrir nota completa
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
