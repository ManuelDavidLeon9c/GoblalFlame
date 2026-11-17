import React, { useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  CatalogFilters,
  Game,
  Genre,
  OfferType,
  Platform,
  SortOption,
} from '../types';
import { formatCOP } from '../utils/formatters';
import { GameCard } from './GameCard';

interface CatalogViewProps {
  games: Game[];
  filters: CatalogFilters;
  favoriteGameIds: Set<string>;
  onUpdateFilters: (next: Partial<CatalogFilters>) => void;
  onResetFilters: () => void;
  onSelectGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

const ALL_PLATFORMS: Platform[] = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Android/Móvil'];
const ALL_GENRES: Genre[] = ['Acción', 'RPG', 'Aventura', 'Deportes', 'Indie', 'Mundo Abierto'];
const ALL_OFFER_TYPES: OfferType[] = ['Descuento', 'Juego gratis', 'Bundle'];

export const CatalogView: React.FC<CatalogViewProps> = ({
  games,
  filters,
  favoriteGameIds,
  onUpdateFilters,
  onResetFilters,
  onSelectGame,
  onToggleFavorite,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleArrayItem = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.platforms.length > 0 ||
    filters.genres.length > 0 ||
    filters.offerTypes.length > 0 ||
    filters.freeOnly ||
    filters.maxPriceCop < 300000;

  const FilterControls = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="h-4 w-4 text-[#00E5FF]" />
          <span>Filtros combinables</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#00E5FF] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Plataforma (RF02 & RF03) */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Plataforma
        </h3>
        <div className="mt-2.5 space-y-2">
          {ALL_PLATFORMS.map((platform) => {
            const checked = filters.platforms.includes(platform);
            return (
              <label
                key={platform}
                className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onUpdateFilters({ platforms: toggleArrayItem(filters.platforms, platform) })
                  }
                  className="h-4 w-4 rounded border-[#1E293B] bg-[#0B0F19] accent-[#2563EB]"
                />
                <span>{platform}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Género (RF02) */}
      <div className="border-t border-[#1E293B] pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Género</h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {ALL_GENRES.map((genre) => {
            const active = filters.genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() =>
                  onUpdateFilters({ genres: toggleArrayItem(filters.genres, genre) })
                }
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[#00E5FF] bg-[#2563EB]/25 text-[#00E5FF]'
                    : 'border-[#1E293B] bg-[#0B0F19]/70 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango de precio en COP (RF02) */}
      <div className="border-t border-[#1E293B] pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Precio máximo (COP)
          </h3>
          <span className="font-mono-num text-xs font-semibold text-[#00E5FF]">
            {filters.freeOnly
              ? formatCOP(0)
              : filters.maxPriceCop >= 300000
                ? 'Sin límite'
                : formatCOP(filters.maxPriceCop)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={300000}
          step={15000}
          disabled={filters.freeOnly}
          value={filters.freeOnly ? 0 : filters.maxPriceCop}
          onChange={(e) => onUpdateFilters({ maxPriceCop: Number(e.target.value), freeOnly: false })}
          aria-label="Precio máximo en pesos colombianos"
          className="mt-3 w-full accent-[#00E5FF] cursor-pointer disabled:opacity-40"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: !filters.freeOnly, maxPriceCop: 300000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filters.freeOnly
                ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                : 'border-[#1E293B] bg-[#0B0F19]/70 text-slate-300 hover:text-white'
            }`}
          >
            Gratis / Free-to-Play
          </button>
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: false, maxPriceCop: 60000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !filters.freeOnly && filters.maxPriceCop === 60000
                ? 'border-[#00E5FF] bg-[#2563EB]/25 text-[#00E5FF]'
                : 'border-[#1E293B] bg-[#0B0F19]/70 text-slate-300 hover:text-white'
            }`}
          >
            Hasta $ 60.000
          </button>
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: false, maxPriceCop: 150000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !filters.freeOnly && filters.maxPriceCop === 150000
                ? 'border-[#00E5FF] bg-[#2563EB]/25 text-[#00E5FF]'
                : 'border-[#1E293B] bg-[#0B0F19]/70 text-slate-300 hover:text-white'
            }`}
          >
            Hasta $ 150.000
          </button>
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: false, maxPriceCop: 300000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !filters.freeOnly && filters.maxPriceCop >= 300000
                ? 'border-[#00E5FF] bg-[#2563EB]/25 text-[#00E5FF]'
                : 'border-[#1E293B] bg-[#0B0F19]/70 text-slate-300 hover:text-white'
            }`}
          >
            Todos los precios
          </button>
        </div>
      </div>

      {/* Tipo de oferta */}
      <div className="border-t border-[#1E293B] pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tipo de oferta
        </h3>
        <div className="mt-2.5 space-y-2">
          {ALL_OFFER_TYPES.map((offerType) => {
            const checked = filters.offerTypes.includes(offerType);
            return (
              <label
                key={offerType}
                className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onUpdateFilters({
                      offerTypes: toggleArrayItem(filters.offerTypes, offerType),
                    })
                  }
                  className="h-4 w-4 rounded border-[#1E293B] bg-[#0B0F19] accent-[#2563EB]"
                />
                <span>{offerType}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#1E293B] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Catálogo de Ofertas en Colombia
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Combina plataforma, género y presupuesto en COP en tiempo real sin recargar la página.
          </p>
        </div>
        <p className="font-mono-num text-sm font-medium text-slate-300">
          {games.length} {games.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      {/* Search + Sort + Mobile Filter Trigger */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            placeholder="Filtrar por título, estudio, género o tienda..."
            aria-label="Buscar en catálogo"
            className="h-11 w-full rounded-xl border border-[#1E293B] bg-[#131B2E] pr-4 pl-10 text-sm text-white placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#1E293B] bg-[#131B2E] px-4 text-sm font-medium text-white hover:border-[#2563EB] lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#00E5FF]" />
            Filtros
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort" className="text-xs font-medium text-slate-400 whitespace-nowrap">
              Ordenar:
            </label>
            <select
              id="catalog-sort"
              value={filters.sortBy}
              onChange={(e) => onUpdateFilters({ sortBy: e.target.value as SortOption })}
              className="h-11 rounded-xl border border-[#1E293B] bg-[#131B2E] px-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
            >
              <option value="popular">Más populares</option>
              <option value="price_asc">Menor precio</option>
              <option value="discount_desc">Mayor descuento</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Filters */}
      {mobileFiltersOpen && (
        <div className="rounded-xl border border-[#1E293B] bg-[#131B2E] p-5 lg:hidden">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" /> Cerrar panel
            </button>
          </div>
          {FilterControls}
        </div>
      )}

      {/* Main Split: Desktop Sidebar + Game Grid */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="hidden lg:block lg:w-72 shrink-0 rounded-xl border border-[#1E293B] bg-[#131B2E] p-5 sticky top-20">
          {FilterControls}
        </aside>

        <div className="flex-1 min-w-0">
          {games.length === 0 ? (
            /* RF01: Empty state with clear message & reset button */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1E293B] bg-[#131B2E] px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0B0F19] text-[#00E5FF] border border-[#1E293B]">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="font-display mt-4 text-xl font-bold text-white">
                Sin resultados encontrados
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                No encontramos videojuegos que coincidan con tu búsqueda o combinación de filtros
                actual en COP.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8] transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isFavorite={favoriteGameIds.has(game.id)}
                  onSelect={onSelectGame}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
