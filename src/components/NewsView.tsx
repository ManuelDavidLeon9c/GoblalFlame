import React, { useState } from 'react';
import { ArrowRight, Heart, Newspaper, ShieldCheck, Sparkles, X } from 'lucide-react';
import { NewsCategory, NewsItem, User } from '../types';
import { formatDateCO } from '../utils/formatters';
import { GameArtwork } from './GameArtwork';

interface NewsViewProps {
  news: NewsItem[];
  category: 'Todas' | NewsCategory;
  forYouOnly: boolean;
  user: User | null;
  favoritesCount: number;
  onChangeCategory: (cat: 'Todas' | NewsCategory) => void;
  onToggleForYou: () => void;
  onOpenAuth: () => void;
  onSelectGame: (gameId: string) => void;
}

const CATEGORIES: Array<'Todas' | NewsCategory> = ['Todas', 'Noticias', 'Lanzamientos', 'Eventos'];

export const NewsView: React.FC<NewsViewProps> = ({
  news,
  category,
  forYouOnly,
  user,
  favoritesCount,
  onChangeCategory,
  onToggleForYou,
  onOpenAuth,
  onSelectGame,
}) => {
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#33251D] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Novedades y Lanzamientos
          </h1>
          <p className="mt-1 text-sm text-[#A89789]">
            Actualizaciones de la industria gamer, rebajas de temporada en Colombia y noticias
            personalizadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {user?.role === 'administrador' && (
            <a
              href="/perfil.html"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#C2410C] whitespace-nowrap"
            >
              <ShieldCheck className="h-4 w-4" />
              Agregar / editar novedades
            </a>
          )}

          <button
            type="button"
            onClick={onToggleForYou}
            aria-pressed={forYouOnly}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              forYouOnly
                ? 'border-[#F59E0B] bg-[#EA580C] text-white shadow-lg shadow-[#EA580C]/25'
                : 'border-[#33251D] bg-[#1D1511] text-[#FAF5F0] hover:border-[#F59E0B]/70'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Para ti (Basado en tus Favoritos)
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChangeCategory(cat)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-[#F59E0B] bg-[#EA580C]/20 text-[#F59E0B]'
                  : 'border-[#33251D] bg-[#1D1511] text-[#D6C7BA] hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {forYouOnly && !user ? (
        <div className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-[#F59E0B]" />
          <h2 className="font-display mt-3 text-xl font-bold text-white">
            Inicia sesión para ver tu feed personalizado
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#A89789]">
            El filtro &ldquo;Para ti&rdquo; muestra únicamente noticias vinculadas a los juegos y
            géneros que tienes guardados en tu lista de favoritos.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-5 rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C2410C]"
          >
            Iniciar sesión ahora
          </button>
        </div>
      ) : forYouOnly && favoritesCount === 0 ? (
        <div className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-10 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-[#F59E0B]" />
          <h2 className="font-display mt-3 text-xl font-bold text-white">
            Aún no tienes videojuegos en favoritos
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#A89789]">
            Marca al menos un juego con el ícono de corazón en el catálogo para personalizar tus
            noticias según tus títulos y géneros preferidos.
          </p>
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-2xl border border-[#33251D] bg-[#1D1511] p-10 text-center">
          <p className="text-sm text-[#D6C7BA]">
            No hay noticias en esta categoría que coincidan con tus favoritos actuales.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <article
              key={item.id}
              onClick={() => setActiveArticle(item)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveArticle(item);
                }
              }}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#33251D] bg-[#1D1511] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EA580C]/80 cursor-pointer"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#120D0A]">
                <GameArtwork
                  theme={item.artworkTheme}
                  title={item.title}
                  imageUrl={item.coverImage}
                  className="h-full w-full"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1D1511] via-transparent to-transparent" />
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#A89789]">
                    <span className="font-semibold text-[#F59E0B]">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateCO(item.publishedAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.readTime}</span>
                  </div>

                  <h2 className="font-display mt-2 text-lg font-bold leading-snug text-white group-hover:text-[#F59E0B] transition-colors">
                    {item.title}
                  </h2>

                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-[#D6C7BA]">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#33251D] pt-3.5 text-xs">
                  <span className="text-[#A89789]">{item.author}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#F59E0B]">
                    Leer nota
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Article Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#33251D] bg-[#1D1511] shadow-2xl">
            <div className="relative aspect-[16/8] w-full overflow-hidden bg-[#120D0A]">
              <GameArtwork
                theme={activeArticle.artworkTheme}
                title={activeArticle.title}
                imageUrl={activeArticle.coverImage}
                className="h-full w-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1D1511] via-transparent to-black/40" />
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#120D0A]/80 text-white hover:bg-[#120D0A]"
                aria-label="Cerrar artículo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#A89789]">
                <span className="font-semibold text-[#F59E0B]">{activeArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDateCO(activeArticle.publishedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.author}</span>
              </div>

              <h2 id="news-modal-title" className="font-display text-2xl font-bold text-white">
                {activeArticle.title}
              </h2>

              <p className="text-sm leading-relaxed text-[#FAF5F0] sm:text-base">
                {activeArticle.content}
              </p>

              {activeArticle.relatedGameIds.length > 0 && (
                <div className="border-t border-[#33251D] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A89789]">
                    Ofertas relacionadas en Global Flame
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {activeArticle.relatedGameIds.map((gid) => (
                      <button
                        key={gid}
                        type="button"
                        onClick={() => {
                          setActiveArticle(null);
                          onSelectGame(gid);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA580C] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#C2410C]"
                      >
                        Ver oferta del juego
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
