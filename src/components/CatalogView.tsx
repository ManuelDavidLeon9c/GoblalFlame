import React, { useState } from 'react';
import { Filter, RefreshCw, RotateCcw, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import {
  CatalogFilters,
  Game,
  Genre,
  OfferType,
  Platform,
  SortOption,
  User,
} from '../types';
import { formatCOP } from '../utils/formatters';
import { GameCard } from './GameCard';

interface CatalogViewProps {
  games: Game[];
  filters: CatalogFilters;
  favoriteGameIds: Set<string>;
  user: User | null;
  isSyncingCheapShark: boolean;
  onSyncCheapShark: () => void;
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
  user,
  isSyncingCheapShark,
  onSyncCheapShark,
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
      <div className="flex items-center justify-between border-b border-[#33251D] pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="h-4 w-4 text-[#F59E0B]" />
          <span>Filtros combinables</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#F59E0B] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Plataforma */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A89789]">
          Plataforma
        </h3>
        <div className="mt-2.5 space-y-2">
          {ALL_PLATFORMS.map((platform) => {
            const checked = filters.platforms.includes(platform);
            return (
              <label
                key={platform}
                className="flex items-center gap-2.5 text-sm text-[#D6C7BA] cursor-pointer hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onUpdateFilters({ platforms: toggleArrayItem(filters.platforms, platform) })
                  }
                  className="h-4 w-4 rounded border-[#33251D] bg-[#150F0B] accent-[#EA580C]"
                />
                <span>{platform}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Género */}
      <div className="border-t border-[#33251D] pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A89789]">Género</h3>
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
                    ? 'border-[#F59E0B] bg-[#EA580C]/25 text-[#F59E0B]'
                    : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:border-[#5C4435] hover:text-white'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango de precio en COP */}
      <div className="border-t border-[#33251D] pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A89789]">
            Precio máximo (COP)
          </h3>
          <span className="font-mono-num text-xs font-semibold text-[#F59E0B]">
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
          className="mt-3 w-full accent-[#EA580C] cursor-pointer disabled:opacity-40"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: !filters.freeOnly, maxPriceCop: 300000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filters.freeOnly
                ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:text-white'
            }`}
          >
            Gratis / Free-to-Play
          </button>
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: false, maxPriceCop: 60000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !filters.freeOnly && filters.maxPriceCop === 60000
                ? 'border-[#F59E0B] bg-[#EA580C]/25 text-[#F59E0B]'
                : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:text-white'
            }`}
          >
            Hasta $ 60.000
          </button>
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: false, maxPriceCop: 150000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !filters.freeOnly && filters.maxPriceCop === 150000
                ? 'border-[#F59E0B] bg-[#EA580C]/25 text-[#F59E0B]'
                : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:text-white'
            }`}
          >
            Hasta $ 150.000
          </button>
          <button
            type="button"
            onClick={() => onUpdateFilters({ freeOnly: false, maxPriceCop: 300000 })}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !filters.freeOnly && filters.maxPriceCop >= 300000
                ? 'border-[#F59E0B] bg-[#EA580C]/25 text-[#F59E0B]'
                : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:text-white'
            }`}
          >
            Todos los precios
          </button>
        </div>
      </div>

      {/* Tipo de oferta */}
      <div className="border-t border-[#33251D] pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A89789]">
          Tipo de oferta
        </h3>
        <div className="mt-2.5 space-y-2">
          {ALL_OFFER_TYPES.map((offerType) => {
            const checked = filters.offerTypes.includes(offerType);
            return (
              <label
                key={offerType}
                className="flex items-center gap-2.5 text-sm text-[#D6C7BA] cursor-pointer hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onUpdateFilters({
                      offerTypes: toggleArrayItem(filters.offerTypes, offerType),
                    })
                  }
                  className="h-4 w-4 rounded border-[#33251D] bg-[#150F0B] accent-[#EA580C]"
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
      <div className="flex flex-col gap-3 border-b border-[#33251D] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Catálogo de Ofertas en Colombia
          </h1>
          <p className="mt-1 text-sm text-[#A89789]">
            Ofertas sincronizadas con CheapShark API y catálogo local en pesos colombianos (COP).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSyncCheapShark}
            disabled={isSyncingCheapShark}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#33251D] bg-[#1D1511] px-3.5 py-2 text-xs font-semibold text-[#F59E0B] hover:border-[#F59E0B] transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingCheapShark ? 'animate-spin' : ''}`} />
            {isSyncingCheapShark ? 'Sincronizando...' : 'Sincronizar CheapShark'}
          </button>

          {user?.role === 'administrador' && (
            <a
              href="/perfil.html"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#C2410C]"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Editar o agregar juegos
            </a>
          )}

          <p className="font-mono-num text-sm font-medium text-[#D6C7BA]">
            {games.length} {games.length === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>
      </div>

      {/* Search + Sort + Mobile Filter Trigger */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#A89789]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            placeholder="Filtrar por título, estudio, género o tienda..."
            aria-label="Buscar en catálogo"
            className="h-11 w-full rounded-xl border border-[#33251D] bg-[#1D1511] pr-4 pl-10 text-sm text-white placeholder-[#A89789] focus:border-[#F59E0B] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#33251D] bg-[#1D1511] px-4 text-sm font-medium text-white hover:border-[#EA580C] lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#F59E0B]" />
            Filtros
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort" className="text-xs font-medium text-[#A89789] whitespace-nowrap">
              Ordenar:
            </label>
            <select
              id="catalog-sort"
              value={filters.sortBy}
              onChange={(e) => onUpdateFilters({ sortBy: e.target.value as SortOption })}
              className="h-11 rounded-xl border border-[#33251D] bg-[#1D1511] px-3 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
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
        <div className="rounded-xl border border-[#33251D] bg-[#1D1511] p-5 lg:hidden">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#A89789] hover:text-white"
            >
              <X className="h-4 w-4" /> Cerrar panel
            </button>
          </div>
          {FilterControls}
        </div>
      )}

      {/* Main Split */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="hidden lg:block lg:w-72 shrink-0 rounded-xl border border-[#33251D] bg-[#1D1511] p-5 sticky top-20">
          {FilterControls}
        </aside>

        <div className="flex-1 min-w-0">
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#33251D] bg-[#1D1511] px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#150F0B] text-[#F59E0B] border border-[#33251D]">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="font-display mt-4 text-xl font-bold text-white">
                Sin resultados encontrados
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#A89789]">
                No encontramos videojuegos que coincidan con tu búsqueda o combinación de filtros
                actual en COP.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C2410C] transition-colors"
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
