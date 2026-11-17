import React, { useState } from 'react';
import { ArrowRight, BellRing, Monitor, Gamepad2, Search, Smartphone, Tag, Layers } from 'lucide-react';
import { Game, Platform, ViewRoute } from '../types';
import { GameCard } from './GameCard';

interface HomeViewProps {
  featuredGames: Game[];
  totalCatalogCount: number;
  favoriteGameIds: Set<string>;
  onSelectGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onSearchSubmit: (query: string) => void;
  onNavigateCatalogWithPlatform: (platform: Platform) => void;
  onNavigate: (view: ViewRoute) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  featuredGames,
  totalCatalogCount,
  favoriteGameIds,
  onSelectGame,
  onToggleFavorite,
  onSearchSubmit,
  onNavigateCatalogWithPlatform,
  onNavigate,
}) => {
  const [heroSearch, setHeroSearch] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(heroSearch);
  };

  const quickPlatforms: Array<{ platform: Platform; label: string; icon: React.ReactNode }> = [
    { platform: 'PC', label: 'PC', icon: <Monitor className="h-4 w-4" /> },
    { platform: 'PlayStation', label: 'PlayStation', icon: <Gamepad2 className="h-4 w-4" /> },
    { platform: 'Xbox', label: 'Xbox', icon: <Gamepad2 className="h-4 w-4" /> },
    { platform: 'Nintendo', label: 'Nintendo', icon: <Gamepad2 className="h-4 w-4" /> },
    { platform: 'Android/Móvil', label: 'Móvil', icon: <Smartphone className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-14">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#1E293B] bg-[#131B2E]">
        {/* Background artwork with measured contrast scrim */}
        <div className="absolute inset-0">
          {!heroImgFailed ? (
            <img
              src="/src/assets/images/hero_cyber_arena_1794926634204.jpg"
              alt="Global Flame Colombia — Comparador de ofertas de videojuegos"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="h-full w-full object-cover object-center opacity-45"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0B0F19] via-[#131B2E] to-[#1E3A8A]/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/88 to-[#0B0F19]/55" />
        </div>

        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-[#00E5FF]">
              Comparador oficial de precios en pesos colombianos (COP)
            </p>
            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-balance leading-[1.12]">
              Las mejores ofertas de videojuegos en un solo lugar
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Compara descuentos verificados en tiempo real entre Steam, Epic Games, PlayStation,
              Xbox y Nintendo para Colombia. Guarda tus favoritos y recibe alertas cuando bajen de
              precio.
            </p>

            {/* Central Hero Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Busca Cyberpunk 2077, Elden Ring, RPG o juegos gratis..."
                  aria-label="Buscar videojuegos por título o palabra clave"
                  className="h-12 w-full rounded-xl border border-[#1E293B] bg-[#0B0F19]/90 pr-4 pl-12 text-sm text-white placeholder-slate-400 shadow-inner focus:border-[#00E5FF] focus:outline-none sm:text-base"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
              >
                Buscar ofertas
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick platform jump filters */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-slate-400">Explorar por plataforma:</span>
              {quickPlatforms.map((item) => (
                <button
                  key={item.platform}
                  type="button"
                  onClick={() => onNavigateCatalogWithPlatform(item.platform)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B] bg-[#0B0F19]/75 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-[#00E5FF]/60 hover:text-[#00E5FF] transition-colors whitespace-nowrap"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals Grid */}
      <section aria-labelledby="featured-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="featured-heading"
              className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Ofertas Destacadas
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Descuentos verificados hoy en tiendas digitales disponibles en Colombia.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00E5FF] hover:text-white transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Ver los {totalCatalogCount} juegos del catálogo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorite={favoriteGameIds.has(game.id)}
              onSelect={onSelectGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Value Proposition Strip */}
      <section
        aria-label="Beneficios de Global Flame"
        className="grid grid-cols-1 gap-6 rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 sm:p-8 md:grid-cols-3"
      >
        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#00E5FF]">
            <Tag className="h-5 w-5" />
          </div>
          <h3 className="font-display text-base font-semibold text-white">
            Precios reales en pesos colombianos
          </h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Olvídate de convertir dólares manualmente. Visualiza el valor exacto en COP y el
            porcentaje real de ahorro antes de comprar.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#00E5FF]">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="font-display text-base font-semibold text-white">
            Comparación multi-tienda y plataforma
          </h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Consulta en un solo lugar las ofertas para PC, PlayStation, Xbox, Nintendo y Android
            con filtros combinables instantáneos.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#00E5FF]">
            <BellRing className="h-5 w-5" />
          </div>
          <h3 className="font-display text-base font-semibold text-white">
            Alertas de bajada de precio y noticias
          </h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Guarda tus títulos favoritos para recibir notificaciones inmediatas cuando bajen de
            precio y lee noticias filtradas según tus gustos.
          </p>
        </div>
      </section>
    </div>
  );
};
