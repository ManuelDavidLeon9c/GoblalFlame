export type Platform = 'PC' | 'PlayStation' | 'Xbox' | 'Nintendo' | 'Android/Móvil';

export type Genre = 'Acción' | 'RPG' | 'Aventura' | 'Deportes' | 'Indie' | 'Mundo Abierto';

export type OfferType = 'Descuento' | 'Juego gratis' | 'Bundle';

export type SortOption = 'popular' | 'price_asc' | 'discount_desc';

export type ViewRoute = 'home' | 'catalog' | 'detail' | 'news' | 'profile';

export type NewsCategory = 'Noticias' | 'Lanzamientos' | 'Eventos';

export type UserRole = 'usuario' | 'administrador';

export interface TechnicalSpecs {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export interface GallerySlide {
  id: string;
  title: string;
  caption: string;
  imageUrl?: string;
  themeVariant: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  developer: string;
  publisher: string;
  releaseYear: number;
  genre: Genre;
  secondaryGenre?: Genre;
  platforms: Platform[];
  offerType: OfferType;
  originalPriceCop: number;
  discountPercent: number;
  finalPriceCop: number;
  rating: number;
  popularityScore: number;
  bestStore: string;
  storeUrl: string;
  synopsis: string;
  features: string[];
  minSpecs: TechnicalSpecs;
  recSpecs: TechnicalSpecs;
  coverImage?: string;
  artworkTheme:
    | 'cyberpunk'
    | 'elden'
    | 'hogwarts'
    | 'rdr2'
    | 'gow'
    | 'witcher'
    | 'hollow'
    | 'fc26'
    | 're4'
    | 'genshin'
    | 'hades2'
    | 'forza5';
  gallery: GallerySlide[];
  isFeatured: boolean;
  isFromCheapShark?: boolean;
  cheapSharkDealId?: string;
  cheapSharkGameId?: string;
}

export interface StoreOffer {
  id: string;
  gameId: string;
  storeName: string;
  platform: Platform;
  originalPriceCop: number;
  discountPercent: number;
  finalPriceCop: number;
  url: string;
  lastUpdated: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarInitials: string;
  preferredPlatforms: Platform[];
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  gameId: string;
  savedPriceCop: number;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  gameId: string;
  gameTitle: string;
  oldPriceCop: number;
  newPriceCop: number;
  discountPercent: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  gameId: string;
  userId: string;
  userName: string;
  userInitials: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  publishedAt: string;
  author: string;
  readTime: string;
  relatedGameIds: string[];
  relatedGenres: Genre[];
  coverImage?: string;
  artworkTheme: string;
}

export interface CatalogFilters {
  search: string;
  platforms: Platform[];
  genres: Genre[];
  offerTypes: OfferType[];
  maxPriceCop: number;
  freeOnly: boolean;
  sortBy: SortOption;
}

export interface QAState {
  simulateApiFailure: boolean;
  simulateChatbotFailure: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  recommendedGameIds?: string[];
}
