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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#1E293B] bg-[#131B2E] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563EB]/70 hover:shadow-[0_12px_30px_-10px_rgba(37,99,235,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] cursor-pointer"
    >
      {/* Cover media */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0B0F19]">
        <GameArtwork
          theme={game.artworkTheme}
          title={game.title}
          imageUrl={game.coverImage}
          className="h-full w-full"
        />

        {/* Measured contrast scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#131B2E] via-[#131B2E]/20 to-transparent" />

        {/* Discount / Free tag */}
        <div className="absolute top-3 left-3">
          {isFree ? (
            <span className="inline-flex items-center rounded-md bg-[#00E5FF] px-2.5 py-1 text-xs font-bold tracking-wide text-[#0B0F19] shadow-sm">
              GRATIS
            </span>
          ) : game.discountPercent > 0 ? (
            <span
              className={`font-mono-num inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-sm ${
                isMegaDiscount ? 'bg-rose-600' : 'bg-[#2563EB]'
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
              ? 'border-rose-500/60 bg-rose-500/20 text-rose-400'
              : 'border-white/15 bg-[#0B0F19]/75 text-slate-200 hover:border-[#00E5FF]/60 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Bottom rating & best store */}
        <div className="absolute right-3 bottom-2.5 left-3 flex items-center justify-between text-xs text-slate-200">
          <span className="truncate font-medium text-slate-300">{game.bestStore}</span>
          <span className="inline-flex items-center gap-1 font-mono-num font-semibold text-amber-300 shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {game.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Clean unboxed genre + release metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>{game.genre}</span>
            <span aria-hidden="true">·</span>
            <span>{game.offerType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{game.releaseYear}</span>
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-[#F8FAFC] group-hover:text-[#00E5FF] transition-colors">
            {game.title}
          </h3>

          {/* RF03: Unambiguous platform tags */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Plataformas disponibles">
            {game.platforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center gap-1 rounded border border-[#1E293B] bg-[#0B0F19]/70 px-2 py-0.5 text-[11px] font-medium text-slate-300 whitespace-nowrap"
              >
                <PlatformIcon platform={platform} />
                {PLATFORM_SHORT[platform]}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Footer */}
        <div className="mt-4 flex items-end justify-between border-t border-[#1E293B] pt-3.5">
          <div className="flex flex-col">
            {game.discountPercent > 0 && game.originalPriceCop > game.finalPriceCop ? (
              <span className="font-mono-num text-xs text-slate-400 line-through">
                {formatCOP(game.originalPriceCop)}
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                {isFree ? 'Acceso Free-to-Play' : 'Precio estándar'}
              </span>
            )}
            <span className="font-mono-num text-lg font-bold tracking-tight text-[#F8FAFC]">
              {formatCOP(game.finalPriceCop)}
            </span>
          </div>

          <span className="inline-flex items-center rounded-lg bg-[#2563EB]/15 px-3 py-1.5 text-xs font-semibold text-[#00E5FF] group-hover:bg-[#2563EB] group-hover:text-white transition-colors whitespace-nowrap shrink-0">
            Ver oferta
          </span>
        </div>
      </div>
    </article>
  );
};
