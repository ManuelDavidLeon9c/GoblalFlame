import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Cpu,
  ExternalLink,
  Heart,
  Monitor,
  Pause,
  Play,
  ShieldCheck,
  Star,
  Store,
  X,
} from 'lucide-react';
import { Game, StoreOffer } from '../types';
import { formatCOP, formatDateCO } from '../utils/formatters';
import { GameArtwork } from './GameArtwork';

interface GameDetailViewProps {
  game: Game;
  storeOffers: StoreOffer[];
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (gameId: string) => void;
  onNotifyStoreRedirect: (storeName: string, priceCop: number) => void;
}

export const GameDetailView: React.FC<GameDetailViewProps> = ({
  game,
  storeOffers,
  isFavorite,
  onBack,
  onToggleFavorite,
  onNotifyStoreRedirect,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [trailerProgress, setTrailerProgress] = useState(18);
  const [checkoutStore, setCheckoutStore] = useState<{
    storeName: string;
    priceCop: number;
    url: string;
  } | null>(null);

  useEffect(() => {
    setActiveSlideIndex(0);
    setIsPlayingTrailer(false);
    setTrailerProgress(18);
    setCheckoutStore(null);
  }, [game.id]);

  // Simulated trailer playback timer
  useEffect(() => {
    if (!isPlayingTrailer) return;
    const interval = setInterval(() => {
      setTrailerProgress((prev) => {
        if (prev >= 100) {
          setActiveSlideIndex((idx) => (idx + 1) % game.gallery.length);
          return 0;
        }
        return prev + 4;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isPlayingTrailer, game.gallery.length]);

  const activeSlide = game.gallery[activeSlideIndex] ?? game.gallery[0];
  const isFree = game.finalPriceCop === 0;

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-[#1E293B] bg-[#131B2E] px-3.5 py-2 text-sm font-medium text-slate-200 hover:border-[#00E5FF]/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </button>

        <span className="text-xs text-slate-400">
          {game.developer} · {game.releaseYear}
        </span>
      </div>

      {/* Main Media + Purchase Module Split */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Trailer Simulator & Interactive Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#1E293B] bg-[#070A12]">
            <GameArtwork
              theme={activeSlide?.themeVariant || game.artworkTheme}
              title={activeSlide?.title || game.title}
              imageUrl={activeSlide?.imageUrl ?? game.coverImage}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-[#0B0F19]/40" />

            {/* Top trailer badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/15 bg-[#0B0F19]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <span className="text-[#00E5FF]">
                {isPlayingTrailer ? 'Reproduciendo vista previa' : 'Tráiler / Galería HD'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">{activeSlide?.title}</span>
            </div>

            {/* Bottom interactive player bar */}
            <div className="absolute right-4 bottom-4 left-4 rounded-xl border border-white/10 bg-[#0B0F19]/85 p-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlayingTrailer((prev) => !prev)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
                  aria-label={isPlayingTrailer ? 'Pausar tráiler simulado' : 'Reproducir tráiler simulado'}
                >
                  {isPlayingTrailer ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-white">{activeSlide?.caption}</span>
                    <span className="font-mono-num ml-2 text-slate-400 shrink-0">
                      00:{String(Math.floor((trailerProgress / 100) * 45)).padStart(2, '0')} / 00:45
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#00E5FF] transition-all duration-150"
                      style={{ width: `${trailerProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Thumbnails */}
          <div className="grid grid-cols-3 gap-3">
            {game.gallery.map((slide, index) => {
              const selected = index === activeSlideIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => {
                    setActiveSlideIndex(index);
                    setTrailerProgress(0);
                  }}
                  className={`group relative aspect-[16/10] overflow-hidden rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40'
                      : 'border-[#1E293B] opacity-75 hover:opacity-100'
                  }`}
                >
                  <GameArtwork
                    theme={slide.themeVariant}
                    title={slide.title}
                    imageUrl={slide.imageUrl}
                    className="h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/90 via-transparent to-transparent" />
                  <span className="absolute right-2 bottom-1.5 left-2 truncate text-[11px] font-medium text-white">
                    {slide.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 space-y-5 lg:sticky lg:top-20">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                {game.genre}
                {game.secondaryGenre ? ` · ${game.secondaryGenre}` : ''} · {game.offerType}
              </span>
              <span className="inline-flex items-center gap-1 font-mono-num font-semibold text-amber-300">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {game.rating.toFixed(1)} / 5
              </span>
            </div>

            <h1 className="font-display mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
              {game.title}
            </h1>

            {/* Platforms */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {game.platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-md border border-[#1E293B] bg-[#0B0F19] px-2.5 py-1 text-xs font-medium text-slate-200"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing box */}
          <div className="rounded-xl border border-[#1E293B] bg-[#0B0F19]/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Mejor oferta actual ({game.bestStore})
              </span>
              {isFree ? (
                <span className="rounded bg-[#00E5FF] px-2 py-0.5 text-xs font-bold text-[#0B0F19]">
                  GRATIS
                </span>
              ) : game.discountPercent > 0 ? (
                <span className="font-mono-num rounded bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                  -{game.discountPercent}%
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono-num text-3xl font-extrabold text-white">
                {formatCOP(game.finalPriceCop)}
              </span>
              {game.discountPercent > 0 && game.originalPriceCop > game.finalPriceCop && (
                <span className="font-mono-num text-sm text-slate-400 line-through">
                  {formatCOP(game.originalPriceCop)}
                </span>
              )}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() =>
                setCheckoutStore({
                  storeName: game.bestStore,
                  priceCop: game.finalPriceCop,
                  url: game.storeUrl,
                })
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 hover:bg-[#1D4ED8] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Comprar ahora en {game.bestStore}
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(game.id)}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors ${
                isFavorite
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                  : 'border-[#1E293B] bg-[#0B0F19] text-white hover:border-[#00E5FF]'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Guardado en Favoritos' : 'Agregar a Favoritos'}
            </button>
          </div>

          <div className="flex items-center gap-2 border-t border-[#1E293B] pt-4 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#00E5FF] shrink-0" />
            <span>Precios verificados en tiendas digitales oficiales para Colombia.</span>
          </div>
        </div>
      </div>

      {/* Store Comparison Table */}
      <section className="rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-[#00E5FF]" />
          <h2 className="font-display text-xl font-bold text-white">
            Comparación de precios por tienda en Colombia
          </h2>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-xs uppercase text-slate-400">
                <th className="py-3 pr-4 font-semibold">Tienda oficial</th>
                <th className="py-3 px-4 font-semibold">Plataforma</th>
                <th className="py-3 px-4 font-semibold">Descuento</th>
                <th className="py-3 px-4 font-semibold">Precio COP</th>
                <th className="py-3 pl-4 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {storeOffers.map((offer, idx) => (
                <tr key={offer.id} className="hover:bg-[#0B0F19]/40">
                  <td className="py-3.5 pr-4 font-medium text-white">
                    {offer.storeName}
                    {idx === 0 && (
                      <span className="ml-2 text-xs font-semibold text-[#00E5FF]">
                        Mejor precio
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{offer.platform}</td>
                  <td className="py-3.5 px-4 font-mono-num text-slate-300">
                    {offer.discountPercent > 0 ? `-${offer.discountPercent}%` : 'Estándar'}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num font-bold text-white">
                    {formatCOP(offer.finalPriceCop)}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setCheckoutStore({
                          storeName: offer.storeName,
                          priceCop: offer.finalPriceCop,
                          url: offer.url,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1E293B] bg-[#0B0F19] px-3 py-1.5 text-xs font-semibold text-[#00E5FF] hover:border-[#00E5FF] transition-colors whitespace-nowrap"
                    >
                      Ir a tienda
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Synopsis, Features & Technical Requirements (RF04) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="lg:col-span-6 rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Sinopsis</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              {game.synopsis}
            </p>
          </div>

          <div className="border-t border-[#1E293B] pt-5">
            <h3 className="font-display text-base font-semibold text-white">
              Características principales
            </h3>
            <ul className="mt-3 space-y-2.5">
              {game.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00E5FF]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lg:col-span-6 rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#00E5FF]" />
            <h2 className="font-display text-xl font-bold text-white">
              Características y Requisitos Técnicos
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#1E293B] bg-[#0B0F19]/75 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Monitor className="h-4 w-4 text-slate-400" />
                Requisitos Mínimos
              </div>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-slate-400">Sistema Operativo</dt>
                  <dd className="font-medium text-white">{game.minSpecs.os}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Procesador</dt>
                  <dd className="font-medium text-white">{game.minSpecs.processor}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Memoria RAM</dt>
                  <dd className="font-medium text-white">{game.minSpecs.memory}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Tarjeta Gráfica</dt>
                  <dd className="font-medium text-white">{game.minSpecs.graphics}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Almacenamiento</dt>
                  <dd className="font-medium text-white">{game.minSpecs.storage}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-[#2563EB]/40 bg-[#0B0F19]/75 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
                <Cpu className="h-4 w-4" />
                Requisitos Recomendados
              </div>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-slate-400">Sistema Operativo</dt>
                  <dd className="font-medium text-white">{game.recSpecs.os}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Procesador</dt>
                  <dd className="font-medium text-white">{game.recSpecs.processor}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Memoria RAM</dt>
                  <dd className="font-medium text-white">{game.recSpecs.memory}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Tarjeta Gráfica</dt>
                  <dd className="font-medium text-white">{game.recSpecs.graphics}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Almacenamiento</dt>
                  <dd className="font-medium text-white">{game.recSpecs.storage}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>

      {/* In-app Official Store Checkout Simulation Modal (avoids window.open / window.alert) */}
      {checkoutStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-redirect-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#131B2E] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#00E5FF]">Redirección segura simulada</p>
                <h3 id="store-redirect-title" className="font-display mt-1 text-xl font-bold text-white">
                  {checkoutStore.storeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStore(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Cerrar ventana"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#1E293B] bg-[#0B0F19] p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Título</span>
                <span className="font-semibold text-white text-right">{game.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total verificado en COP</span>
                <span className="font-mono-num font-bold text-[#00E5FF]">
                  {formatCOP(checkoutStore.priceCop)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha de consulta</span>
                <span className="text-slate-300">{formatDateCO(new Date().toISOString())}</span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              En el entorno de producción, este botón te dirige al carrito oficial de{' '}
              <strong className="text-slate-200">{checkoutStore.storeName}</strong> ({checkoutStore.url})
              manteniendo el precio regional de Colombia.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutStore(null)}
                className="rounded-xl border border-[#1E293B] px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onNotifyStoreRedirect(checkoutStore.storeName, checkoutStore.priceCop);
                  setCheckoutStore(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
              >
                Confirmar enlace de compra
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
