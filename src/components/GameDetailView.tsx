import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Cpu,
  ExternalLink,
  Heart,
  MessageSquarePlus,
  Monitor,
  Pause,
  Play,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { Game, Review, StoreOffer, User } from '../types';
import { formatCOP, formatDateCO } from '../utils/formatters';
import { GameArtwork } from './GameArtwork';

interface GameDetailViewProps {
  game: Game;
  storeOffers: StoreOffer[];
  reviews: Review[];
  user: User | null;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (gameId: string) => void;
  onNotifyStoreRedirect: (storeName: string, priceCop: number) => void;
  onSubmitReview: (gameId: string, rating: number, comment: string) => Promise<boolean>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onOpenAuthForReview: () => void;
}

export const GameDetailView: React.FC<GameDetailViewProps> = ({
  game,
  storeOffers,
  reviews,
  user,
  isFavorite,
  onBack,
  onToggleFavorite,
  onNotifyStoreRedirect,
  onSubmitReview,
  onDeleteReview,
  onOpenAuthForReview,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [trailerProgress, setTrailerProgress] = useState(18);
  const [checkoutStore, setCheckoutStore] = useState<{
    storeName: string;
    priceCop: number;
    url: string;
  } | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setActiveSlideIndex(0);
    setIsPlayingTrailer(false);
    setTrailerProgress(18);
    setCheckoutStore(null);
    setReviewComment('');
    setReviewRating(5);
  }, [game.id]);

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuthForReview();
      return;
    }
    setSubmittingReview(true);
    try {
      const ok = await onSubmitReview(game.id, reviewRating, reviewComment);
      if (ok) {
        setReviewComment('');
        setReviewRating(5);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-[#33251D] bg-[#1D1511] px-3.5 py-2 text-sm font-medium text-[#FAF5F0] hover:border-[#F59E0B] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Ofertas
        </button>

        <span className="text-xs text-[#A89789]">
          {game.developer} · {game.releaseYear}
          {game.isFromCheapShark ? ' · CheapShark API' : ''}
        </span>
      </div>

      {/* Main Media + Purchase Module Split */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Trailer Simulator & Interactive Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#33251D] bg-[#120D0A]">
            <GameArtwork
              theme={activeSlide?.themeVariant || game.artworkTheme}
              title={activeSlide?.title || game.title}
              imageUrl={activeSlide?.imageUrl ?? game.coverImage}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120D0A] via-transparent to-[#120D0A]/40" />

            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/15 bg-[#120D0A]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <span className="text-[#F59E0B]">
                {isPlayingTrailer ? 'Reproduciendo vista previa' : 'Tráiler / Galería HD'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#D6C7BA]">{activeSlide?.title}</span>
            </div>

            <div className="absolute right-4 bottom-4 left-4 rounded-xl border border-white/10 bg-[#120D0A]/88 p-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlayingTrailer((prev) => !prev)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EA580C] text-white hover:bg-[#C2410C] transition-colors"
                  aria-label={isPlayingTrailer ? 'Pausar tráiler simulado' : 'Reproducir tráiler simulado'}
                >
                  {isPlayingTrailer ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-white">{activeSlide?.caption}</span>
                    <span className="font-mono-num ml-2 text-[#A89789] shrink-0">
                      00:{String(Math.floor((trailerProgress / 100) * 45)).padStart(2, '0')} / 00:45
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#33251D]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#F59E0B] transition-all duration-150"
                      style={{ width: `${trailerProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                      ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/40'
                      : 'border-[#33251D] opacity-75 hover:opacity-100'
                  }`}
                >
                  <GameArtwork
                    theme={slide.themeVariant}
                    title={slide.title}
                    imageUrl={slide.imageUrl}
                    className="h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120D0A]/90 via-transparent to-transparent" />
                  <span className="absolute right-2 bottom-1.5 left-2 truncate text-[11px] font-medium text-white">
                    {slide.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 space-y-5 lg:sticky lg:top-20">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-[#A89789]">
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

            <div className="mt-3 flex flex-wrap gap-1.5">
              {game.platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-md border border-[#33251D] bg-[#150F0B] px-2.5 py-1 text-xs font-medium text-[#FAF5F0]"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#33251D] bg-[#150F0B] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A89789]">
                Mejor oferta actual ({game.bestStore})
              </span>
              {isFree ? (
                <span className="rounded bg-[#F59E0B] px-2 py-0.5 text-xs font-bold text-[#120D0A]">
                  GRATIS
                </span>
              ) : game.discountPercent > 0 ? (
                <span className="font-mono-num rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  -{game.discountPercent}%
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono-num text-3xl font-extrabold text-white">
                {formatCOP(game.finalPriceCop)}
              </span>
              {game.discountPercent > 0 && game.originalPriceCop > game.finalPriceCop && (
                <span className="font-mono-num text-sm text-[#A89789] line-through">
                  {formatCOP(game.originalPriceCop)}
                </span>
              )}
            </div>
          </div>

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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] px-5 text-sm font-semibold text-white shadow-lg shadow-[#EA580C]/25 hover:bg-[#C2410C] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Comprar ahora en {game.bestStore}
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(game.id)}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors ${
                isFavorite
                  ? 'border-red-500/60 bg-red-500/15 text-red-300 hover:bg-red-500/25'
                  : 'border-[#33251D] bg-[#150F0B] text-white hover:border-[#F59E0B]'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Guardado en Favoritos' : 'Agregar a Favoritos'}
            </button>
          </div>

          <div className="flex items-center gap-2 border-t border-[#33251D] pt-4 text-xs text-[#A89789]">
            <ShieldCheck className="h-4 w-4 text-[#F59E0B] shrink-0" />
            <span>Precios verificados en tiendas digitales y CheapShark para Colombia.</span>
          </div>
        </div>
      </div>

      {/* Store Comparison Table */}
      <section className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-6">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-[#F59E0B]" />
          <h2 className="font-display text-xl font-bold text-white">
            Comparación de precios por tienda en Colombia
          </h2>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#33251D] text-xs uppercase text-[#A89789]">
                <th className="py-3 pr-4 font-semibold">Tienda oficial</th>
                <th className="py-3 px-4 font-semibold">Plataforma</th>
                <th className="py-3 px-4 font-semibold">Descuento</th>
                <th className="py-3 px-4 font-semibold">Precio COP</th>
                <th className="py-3 pl-4 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#33251D]">
              {storeOffers.map((offer, idx) => (
                <tr key={offer.id} className="hover:bg-[#150F0B]/60">
                  <td className="py-3.5 pr-4 font-medium text-white">
                    {offer.storeName}
                    {idx === 0 && (
                      <span className="ml-2 text-xs font-semibold text-[#F59E0B]">
                        Mejor precio
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#D6C7BA]">{offer.platform}</td>
                  <td className="py-3.5 px-4 font-mono-num text-[#D6C7BA]">
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
                      className="inline-flex items-center gap-1 rounded-lg border border-[#33251D] bg-[#150F0B] px-3 py-1.5 text-xs font-semibold text-[#F59E0B] hover:border-[#F59E0B] transition-colors whitespace-nowrap"
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

      {/* Synopsis & Technical Requirements */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="lg:col-span-6 rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Sinopsis</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#D6C7BA] sm:text-base">
              {game.synopsis}
            </p>
          </div>

          <div className="border-t border-[#33251D] pt-5">
            <h3 className="font-display text-base font-semibold text-white">
              Características principales
            </h3>
            <ul className="mt-3 space-y-2.5">
              {game.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-sm text-[#D6C7BA]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lg:col-span-6 rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#F59E0B]" />
            <h2 className="font-display text-xl font-bold text-white">
              Características y Requisitos Técnicos
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#33251D] bg-[#150F0B] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D6C7BA]">
                <Monitor className="h-4 w-4 text-[#A89789]" />
                Requisitos Mínimos
              </div>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-[#A89789]">Sistema Operativo</dt>
                  <dd className="font-medium text-white">{game.minSpecs.os}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Procesador</dt>
                  <dd className="font-medium text-white">{game.minSpecs.processor}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Memoria RAM</dt>
                  <dd className="font-medium text-white">{game.minSpecs.memory}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Tarjeta Gráfica</dt>
                  <dd className="font-medium text-white">{game.minSpecs.graphics}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Almacenamiento</dt>
                  <dd className="font-medium text-white">{game.minSpecs.storage}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-[#EA580C]/45 bg-[#150F0B] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                <Cpu className="h-4 w-4" />
                Requisitos Recomendados
              </div>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-[#A89789]">Sistema Operativo</dt>
                  <dd className="font-medium text-white">{game.recSpecs.os}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Procesador</dt>
                  <dd className="font-medium text-white">{game.recSpecs.processor}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Memoria RAM</dt>
                  <dd className="font-medium text-white">{game.recSpecs.memory}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Tarjeta Gráfica</dt>
                  <dd className="font-medium text-white">{game.recSpecs.graphics}</dd>
                </div>
                <div>
                  <dt className="text-[#A89789]">Almacenamiento</dt>
                  <dd className="font-medium text-white">{game.recSpecs.storage}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>

      {/* COMMUNITY REVIEWS SECTION BELOW EVERY GAME */}
      <section
        aria-labelledby="reviews-heading"
        className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 space-y-6"
      >
        <div className="flex flex-col gap-2 border-b border-[#33251D] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-[#F59E0B]" />
              <h2 id="reviews-heading" className="font-display text-xl font-bold text-white">
                Reseñas y Calificaciones de la Comunidad
              </h2>
            </div>
            <p className="mt-1 text-sm text-[#A89789]">
              Califica {game.title} con estrellas y comparte tu opinión con otros jugadores en
              Colombia.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#33251D] bg-[#150F0B] px-3.5 py-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="font-mono-num text-lg font-bold text-white">
              {game.rating.toFixed(1)}
            </span>
            <span className="text-xs text-[#A89789]">({reviews.length} reseñas)</span>
          </div>
        </div>

        {/* Review Form */}
        {user ? (
          <form
            onSubmit={handleReviewSubmit}
            className="rounded-xl border border-[#33251D] bg-[#150F0B] p-4 space-y-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold text-[#FAF5F0]">
                Publicando como {user.name} ({user.role === 'administrador' ? 'Administrador' : 'Usuario'})
              </span>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación en estrellas">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    aria-label={`${star} estrellas`}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-[#4B372B]'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono-num ml-2 text-xs font-bold text-amber-300">
                  {reviewRating} / 5
                </span>
              </div>
            </div>

            <textarea
              rows={3}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={`¿Qué te pareció ${game.title} y su precio actual en COP?`}
              className="w-full rounded-xl border border-[#33251D] bg-[#1D1511] p-3 text-sm text-white placeholder-[#8C7A6B] focus:border-[#F59E0B] focus:outline-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingReview}
                className="inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#C2410C] transition-colors disabled:opacity-60"
              >
                {submittingReview ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#33251D] bg-[#150F0B] p-4 sm:flex-row sm:items-center">
            <p className="text-xs text-[#D6C7BA]">
              Inicia sesión como <strong className="text-[#F59E0B]">Usuario</strong> para calificar
              este videojuego y publicar tu reseña.
            </p>
            <button
              type="button"
              onClick={onOpenAuthForReview}
              className="rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C2410C] whitespace-nowrap"
            >
              Iniciar sesión para reseñar
            </button>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#A89789]">
            Sé el primero en dejar una reseña para {game.title}.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => {
              const canDelete =
                user && (user.role === 'administrador' || user.id === rev.userId);
              return (
                <article
                  key={rev.id}
                  className="rounded-xl border border-[#33251D] bg-[#150F0B] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EA580C]/25 text-xs font-bold text-[#F59E0B]">
                        {rev.userInitials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{rev.userName}</p>
                        <p className="text-[11px] text-[#A89789]">{formatDateCO(rev.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5" aria-label={`${rev.rating} de 5 estrellas`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-[#33251D]'
                            }`}
                          />
                        ))}
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteReview(rev.id)}
                          className="rounded p-1 text-red-400 hover:bg-red-500/15"
                          aria-label="Eliminar reseña"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-[#D6C7BA]">{rev.comment}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Safe In-App Store Redirect Modal */}
      {checkoutStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-redirect-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#33251D] bg-[#1D1511] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#F59E0B]">Redirección segura simulada</p>
                <h3 id="store-redirect-title" className="font-display mt-1 text-xl font-bold text-white">
                  {checkoutStore.storeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStore(null)}
                className="rounded-lg p-1.5 text-[#A89789] hover:bg-[#33251D] hover:text-white"
                aria-label="Cerrar ventana"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#33251D] bg-[#150F0B] p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A89789]">Título</span>
                <span className="font-semibold text-white text-right">{game.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A89789]">Total verificado en COP</span>
                <span className="font-mono-num font-bold text-[#F59E0B]">
                  {formatCOP(checkoutStore.priceCop)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A89789]">Fecha de consulta</span>
                <span className="text-[#D6C7BA]">{formatDateCO(new Date().toISOString())}</span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#A89789]">
              Enlace verificado hacia{' '}
              <strong className="text-[#FAF5F0]">{checkoutStore.storeName}</strong> ({checkoutStore.url}).
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutStore(null)}
                className="rounded-xl border border-[#33251D] px-4 py-2.5 text-sm font-medium text-[#D6C7BA] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onNotifyStoreRedirect(checkoutStore.storeName, checkoutStore.priceCop);
                  setCheckoutStore(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C2410C]"
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
