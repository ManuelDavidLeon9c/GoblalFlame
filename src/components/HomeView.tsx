import React, { useState } from 'react';
import { ArrowRight, BellRing, Monitor, Gamepad2, Search, Smartphone, Tag, Layers, RefreshCw } from 'lucide-react';
import { Game, Platform } from '../types';
import { GameCard } from './GameCard';

interface HomeViewProps {
  featuredGames: Game[];
  totalCatalogCount: number;
  favoriteGameIds: Set<string>;
  lastCheapSharkSync: string | null;
  isSyncingCheapShark: boolean;
  onSyncCheapShark: () => void;
  onSelectGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onSearchSubmit: (query: string) => void;
  onNavigateCatalogWithPlatform: (platform: Platform) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  featuredGames,
  totalCatalogCount,
  favoriteGameIds,
  isSyncingCheapShark,
  onSyncCheapShark,
  onSelectGame,
  onToggleFavorite,
  onSearchSubmit,
  onNavigateCatalogWithPlatform,
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
      <section className="relative overflow-hidden rounded-2xl border border-[#33251D] bg-[#1D1511]">
        <div className="absolute inset-0">
          {!heroImgFailed ? (
            <img
              src="/src/assets/images/cover_frontier_sunset_1794926636060.jpg"
              alt="Global Flame Colombia — Ofertas de videojuegos"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="h-full w-full object-cover object-center opacity-45"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#120D0A] via-[#2B170D] to-[#7C2D12]/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#120D0A] via-[#120D0A]/88 to-[#120D0A]/55" />
        </div>

        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold tracking-wider text-[#F59E0B]">
                Comparador oficial en pesos colombianos (COP) · Conectado con CheapShark API
              </p>
              <button
                type="button"
                onClick={onSyncCheapShark}
                disabled={isSyncingCheapShark}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F59E0B]/40 bg-[#150F0B]/80 px-2.5 py-1 text-[11px] font-semibold text-[#F59E0B] hover:bg-[#EA580C] hover:text-white transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncingCheapShark ? 'animate-spin' : ''}`} />
                {isSyncingCheapShark ? 'Sincronizando...' : 'Actualizar CheapShark'}
              </button>
            </div>

            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-balance leading-[1.12]">
              Las mejores ofertas de videojuegos en un solo lugar
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#D6C7BA] sm:text-lg">
              Compara descuentos reales en vivo desde CheapShark y tiendas en Colombia en pesos
              colombianos (COP). Guarda tus favoritos, publica reseñas y recibe alertas al instante.
            </p>

            {/* Central Hero Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#A89789]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Busca Cyberpunk 2077, Elden Ring, RPG o juegos gratis..."
                  aria-label="Buscar videojuegos por título o palabra clave"
                  className="h-12 w-full rounded-xl border border-[#33251D] bg-[#120D0A]/90 pr-4 pl-12 text-sm text-white placeholder-[#A89789] shadow-inner focus:border-[#F59E0B] focus:outline-none sm:text-base"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#EA580C] px-6 text-sm font-semibold text-white shadow-lg shadow-[#EA580C]/30 hover:bg-[#C2410C] transition-colors whitespace-nowrap shrink-0"
              >
                Buscar ofertas
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick platform jump filters */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-[#A89789]">Explorar por plataforma:</span>
              {quickPlatforms.map((item) => (
                <button
                  key={item.platform}
                  type="button"
                  onClick={() => onNavigateCatalogWithPlatform(item.platform)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#33251D] bg-[#120D0A]/80 px-3 py-1.5 text-xs font-medium text-[#FAF5F0] hover:border-[#F59E0B]/70 hover:text-[#F59E0B] transition-colors whitespace-nowrap"
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
            <p className="mt-1 text-sm text-[#A89789]">
              Descuentos verificados hoy en tiendas digitales y CheapShark en COP.
            </p>
          </div>

          <a
            href="/ofertas.html"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F59E0B] hover:text-white transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Ver los {totalCatalogCount} juegos en Ofertas
            <ArrowRight className="h-4 w-4" />
          </a>
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
        className="grid grid-cols-1 gap-6 rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 sm:p-8 md:grid-cols-3"
      >
        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EA580C]/20 text-[#F59E0B]">
            <Tag className="h-5 w-5" />
          </div>
          <h3 className="font-display text-base font-semibold text-white">
            Precios en COP vía CheapShark API
          </h3>
          <p className="text-sm leading-relaxed text-[#A89789]">
            Integramos ofertas reales en vivo convirtiendo automáticamente al peso colombiano (COP)
            con el porcentaje exacto de ahorro.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EA580C]/20 text-[#F59E0B]">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="font-display text-base font-semibold text-white">
            Reseñas y calificación comunitaria
          </h3>
          <p className="text-sm leading-relaxed text-[#A89789]">
            Lee opiniones reales debajo de cada título o inicia sesión como Usuario para calificar
            con estrellas y dejar tu reseña.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EA580C]/20 text-[#F59E0B]">
            <BellRing className="h-5 w-5" />
          </div>
          <h3 className="font-display text-base font-semibold text-white">
            Gestión de cuentas Excel / AppSheet
          </h3>
          <p className="text-sm leading-relaxed text-[#A89789]">
            Control por roles (Usuario y Administrador) con tabla administrativa exportable e
            importable en formato Excel (.xlsx).
          </p>
        </div>
      </section>
    </div>
  );
};
