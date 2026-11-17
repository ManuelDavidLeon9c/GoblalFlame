import React, { useState } from 'react';
import { Heart, Monitor, Gamepad2, Smartphone, Star } from 'lucide-react';
import { Game, Platform } from '../types';
import { formatCOP } from '../utils/formatters';
import { GameArtwork } from './GameArtwork';

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  onSelect: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

const PLATFORM_SHORT: Record<Platform, string> = {
  PC: 'PC',
  PlayStation: 'PS5',
  Xbox: 'Xbox',
  Nintendo: 'Nintendo',
  'Android/Móvil': 'Móvil',
};

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === 'PC') return <Monitor className="h-3 w-3" aria-hidden="true" />;
  if (platform === 'Android/Móvil') return <Smartphone className="h-3 w-3" aria-hidden="true" />;
  return <Gamepad2 className="h-3 w-3" aria-hidden="true" />;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const [pulseHeart, setPulseHeart] = useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPulseHeart(true);
    setTimeout(() => setPulseHeart(false), 260);
    onToggleFavorite(game.id);
  };

  const isFree = game.finalPriceCop === 0;
  const isMegaDiscount = game.discountPercent >= 55;

  return (
    <article
      onClick={() => onSelect(game.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(game.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver oferta de ${game.title}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#33251D] bg-[#1D1511] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EA580C]/80 hover:shadow-[0_12px_30px_-10px_rgba(234,88,12,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] cursor-pointer"
    >
      {/* Cover media */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#120D0A]">
        <GameArtwork
          theme={game.artworkTheme}
          title={game.title}
          imageUrl={game.coverImage}
          className="h-full w-full"
        />

        {/* Measured contrast scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1D1511] via-[#1D1511]/20 to-transparent" />

        {/* Discount / Free tag */}
        <div className="absolute top-3 left-3">
          {isFree ? (
            <span className="inline-flex items-center rounded-md bg-[#F59E0B] px-2.5 py-1 text-xs font-bold tracking-wide text-[#120D0A] shadow-sm">
              GRATIS
            </span>
          ) : game.discountPercent > 0 ? (
            <span
              className={`font-mono-num inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-sm ${
                isMegaDiscount ? 'bg-red-600' : 'bg-[#EA580C]'
              }`}
            >
              -{game.discountPercent}%
            </span>
          ) : null}
        </div>

        {/* Favorite toggle button */}
        <button
          type="button"
          onClick={handleHeartClick}
          aria-label={isFavorite ? `Quitar ${game.title} de favoritos` : `Agregar ${game.title} a favoritos`}
          aria-pressed={isFavorite}
          className={`absolute top-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-lg border backdrop-blur-md transition-transform duration-150 ${
            pulseHeart ? 'scale-125' : 'scale-100 hover:scale-105'
          } ${
            isFavorite
              ? 'border-red-500/70 bg-red-500/20 text-red-400'
              : 'border-white/15 bg-[#120D0A]/75 text-[#FAF5F0] hover:border-[#F59E0B]/70 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Bottom rating & best store */}
        <div className="absolute right-3 bottom-2.5 left-3 flex items-center justify-between text-xs text-[#FAF5F0]">
          <span className="truncate font-medium text-[#D6C7BA]">{game.bestStore}</span>
          <span className="inline-flex items-center gap-1 font-mono-num font-semibold text-amber-300 shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {game.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#A89789]">
            <span>{game.genre}</span>
            <span aria-hidden="true">·</span>
            <span>{game.offerType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{game.releaseYear}</span>
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-[#FAF5F0] group-hover:text-[#F59E0B] transition-colors">
            {game.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Plataformas disponibles">
            {game.platforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center gap-1 rounded border border-[#33251D] bg-[#150F0B] px-2 py-0.5 text-[11px] font-medium text-[#D6C7BA] whitespace-nowrap"
              >
                <PlatformIcon platform={platform} />
                {PLATFORM_SHORT[platform]}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Footer */}
        <div className="mt-4 flex items-end justify-between border-t border-[#33251D] pt-3.5">
          <div className="flex flex-col">
            {game.discountPercent > 0 && game.originalPriceCop > game.finalPriceCop ? (
              <span className="font-mono-num text-xs text-[#A89789] line-through">
                {formatCOP(game.originalPriceCop)}
              </span>
            ) : (
              <span className="text-xs text-[#A89789]">
                {isFree ? 'Acceso Free-to-Play' : 'Precio estándar'}
              </span>
            )}
            <span className="font-mono-num text-lg font-bold tracking-tight text-[#FAF5F0]">
              {formatCOP(game.finalPriceCop)}
            </span>
          </div>

          <span className="inline-flex items-center rounded-lg bg-[#EA580C]/20 px-3 py-1.5 text-xs font-semibold text-[#F59E0B] group-hover:bg-[#EA580C] group-hover:text-white transition-colors whitespace-nowrap shrink-0">
            Ver oferta
          </span>
        </div>
      </div>
    </article>
  );
};
