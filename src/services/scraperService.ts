import fs from 'fs';
import type { Browser } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Register Stealth plugin once to mimic human browser fingerprints
// and reduce false-positive bot blocks on official console/mobile storefronts.
const puppeteer = puppeteerExtra as unknown as {
  use: (plugin: unknown) => void;
  launch: (options?: Record<string, unknown>) => Promise<Browser>;
  executablePath?: () => string;
};
puppeteer.use(StealthPlugin());

export type ScraperPlatform = 'PlayStation' | 'Xbox' | 'Nintendo' | 'Mobile';

export interface ScrapePriceResult {
  success: true;
  source: 'Web Scraping (Plan B)';
  platform: ScraperPlatform;
  game_title: string;
  discount_percent: string;
  price_original: number;
  price_final: number;
  currency_detected: 'COP' | 'USD';
  price_cop_formatted: string;
  cached?: boolean;
  timestamp: string;
}

export class ScraperBlockedError extends Error {
  readonly statusCode = 403;
  constructor(message = 'Bloqueo severo detectado por la tienda oficial (timeout/anti-bot 8s).') {
    super(message);
    this.name = 'ScraperBlockedError';
  }
}

export class ScraperNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(
    message = 'Error: No se pudo extraer la información. Usar precio en caché de PostgreSQL'
  ) {
    super(message);
    this.name = 'ScraperNotFoundError';
  }
}

interface PlatformSelectorConfig {
  waitSelector: string;
  titleSelectors: string[];
  finalPriceSelectors: string[];
  originalPriceSelectors: string[];
  discountSelectors: string[];
}

const SCRAPE_CACHE_TTL_MS = 5 * 60 * 1000;
const scrapeMemoryCache = new Map<string, { expiresAt: number; data: ScrapePriceResult }>();

function resolveChromiumExecutable(): string | undefined {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export function normalizeScraperPlatform(input: string): ScraperPlatform | null {
  const clean = input.trim().toLowerCase();
  if (clean.includes('playstation') || clean === 'ps' || clean === 'ps5' || clean === 'ps4') {
    return 'PlayStation';
  }
  if (clean.includes('xbox')) {
    return 'Xbox';
  }
  if (clean.includes('nintendo') || clean.includes('eshop') || clean.includes('switch')) {
    return 'Nintendo';
  }
  if (
    clean.includes('mobile') ||
    clean.includes('móvil') ||
    clean.includes('movil') ||
    clean.includes('android') ||
    clean.includes('google play')
  ) {
    return 'Mobile';
  }
  return null;
}

export function validatePublicStoreUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new ScraperNotFoundError('URL de tienda inválida.');
  }

  if (parsed.protocol !== 'https:') {
    throw new ScraperNotFoundError('Solo se permiten URLs oficiales con protocolo HTTPS.');
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new ScraperBlockedError('Acceso denegado a direcciones internas o privadas.');
  }

  return parsed;
}

function getSelectorsForPlatform(platform: ScraperPlatform): PlatformSelectorConfig {
  switch (platform) {
    case 'PlayStation':
      return {
        waitSelector:
          'h1[data-qa="mfe-game-title#name"], span[data-qa="mfeCtaMain#offer0#finalPrice"], h1.psw-t-title-l',
        titleSelectors: [
          'h1[data-qa="mfe-game-title#name"]',
          'h1.psw-t-title-l',
          '[data-qa*="game-title"]',
          'h1',
        ],
        finalPriceSelectors: [
          'span[data-qa="mfeCtaMain#offer0#finalPrice"]',
          '[data-qa*="finalPrice"]',
          '.psw-t-title-m',
        ],
        originalPriceSelectors: [
          'span[data-qa="mfeCtaMain#offer0#originalPrice"]',
          '[data-qa*="originalPrice"]',
          's',
        ],
        discountSelectors: [
          'span[data-qa="mfeCtaMain#offer0#discountInfo"]',
          '[data-qa*="discountInfo"]',
          '.psw-t-tag',
        ],
      };

    case 'Xbox':
      return {
        waitSelector:
          '[data-testid="ProductDetailsHeader-ProductTitle"], [class*="Price-module__boldText"], h1',
        titleSelectors: [
          '[data-testid="ProductDetailsHeader-ProductTitle"]',
          'h1[class*="ProductDetailsHeader"]',
          'h1',
        ],
        finalPriceSelectors: [
          '[data-testid="price-final"]',
          '[class*="Price-module__boldText"]',
          '[class*="ProductDetailsHeader"] [class*="price"]',
        ],
        originalPriceSelectors: [
          '[data-testid="price-original"]',
          '[class*="Price-module__strikethrough"]',
          's',
        ],
        discountSelectors: [
          '[data-testid="discount-badge"]',
          '[class*="Badge-module__discount"]',
          '[class*="discount"]',
        ],
      };

    case 'Nintendo':
      return {
        waitSelector:
          '[data-testid="ProductTitle"], [data-testid="current-price"], [class*="Pricestyles__CurrentPrice"], h1',
        titleSelectors: ['[data-testid="ProductTitle"]', 'h1[class*="Heading"]', 'h1'],
        finalPriceSelectors: [
          '[data-testid="current-price"]',
          '[class*="Pricestyles__CurrentPrice"]',
          '[class*="msrp"]',
        ],
        originalPriceSelectors: [
          '[data-testid="regular-price"]',
          '[class*="Pricestyles__RegularPrice"]',
          's',
        ],
        discountSelectors: [
          '[data-testid="sale-badge"]',
          '[class*="DiscountBadge"]',
          '[class*="discount"]',
        ],
      };

    case 'Mobile':
      return {
        waitSelector: 'h1[itemprop="name"], meta[itemprop="price"], button[aria-label*="Comprar"], h1',
        titleSelectors: ['h1[itemprop="name"]', 'h1 span', 'h1'],
        finalPriceSelectors: [
          'meta[itemprop="price"]',
          'button[aria-label*="Comprar"]',
          'button[aria-label*="Buy"]',
          '[itemprop="offers"] [itemprop="price"]',
        ],
        originalPriceSelectors: ['s', '[aria-label*="Precio original"]'],
        discountSelectors: ['[class*="discount"]', '[aria-label*="%"]'],
      };
  }
}

/**
 * Cleans extracted price strings (e.g. "US$ 59.99", "$ 150.000 COP", "COP 129,900")
 * and converts them into a numeric float.
 */
export function parsePriceText(rawText: string): {
  amount: number;
  currency: 'COP' | 'USD';
} {
  if (!rawText) return { amount: 0, currency: 'USD' };

  const upper = rawText.toUpperCase();
  if (upper.includes('GRATIS') || upper.includes('FREE')) {
    return { amount: 0, currency: 'COP' };
  }

  const explicitlyCop = upper.includes('COP') || upper.includes('COL$');
  const explicitlyUsd = upper.includes('USD') || upper.includes('US$');

  const cleaned = rawText
    .replace(/USD|COP|US\$|COL\$|\$/gi, '')
    .replace(/[^\d.,]/g, '')
    .trim();

  if (!cleaned) return { amount: 0, currency: explicitlyCop ? 'COP' : 'USD' };

  let numeric = 0;
  // Detect Colombian/Latin thousands separator pattern like "150.000" or "1.250.000"
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    numeric = Number.parseFloat(cleaned.replace(/\./g, ''));
  } else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(cleaned)) {
    // US format like "1,299.99" or "150,000"
    numeric = Number.parseFloat(cleaned.replace(/,/g, ''));
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Decimal comma e.g. "59,99"
    numeric = Number.parseFloat(cleaned.replace(',', '.'));
  } else {
    numeric = Number.parseFloat(cleaned);
  }

  if (!Number.isFinite(numeric)) numeric = 0;

  const currency: 'COP' | 'USD' = explicitlyCop
    ? 'COP'
    : explicitlyUsd
      ? 'USD'
      : numeric >= 2000
        ? 'COP'
        : 'USD';

  return { amount: numeric, currency };
}

export function formatCopStrict(amountCop: number): string {
  const rounded = Math.max(0, Math.round(amountCop));
  const formatted = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted} COP`;
}

export async function scrapeStorePrice(params: {
  url: string;
  platform: ScraperPlatform;
  trmCopPerUsd?: number;
}): Promise<ScrapePriceResult> {
  const trm = params.trmCopPerUsd ?? 4250;
  const parsedUrl = validatePublicStoreUrl(params.url);
  const cacheKey = `${params.platform}:${parsedUrl.toString()}`;

  const cachedEntry = scrapeMemoryCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return { ...cachedEntry.data, cached: true };
  }

  const selectors = getSelectorsForPlatform(params.platform);
  const executablePath = resolveChromiumExecutable();
  const launchTimeoutMs = 8000;

  let browser: Browser | null = null;
  const abortController = new AbortController();
  const severeTimeoutId = setTimeout(() => abortController.abort(), launchTimeoutMs);

  try {
    browser = await puppeteer.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-CO,es;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    const response = await Promise.race([
      page.goto(parsedUrl.toString(), {
        waitUntil: 'domcontentloaded',
        timeout: launchTimeoutMs,
      }),
      new Promise<never>((_resolve, reject) => {
        abortController.signal.addEventListener('abort', () => {
          reject(new ScraperBlockedError('Tiempo límite de 8s excedido por bloqueo de la tienda.'));
        });
      }),
    ]);

    if (response && (response.status() === 403 || response.status() === 429)) {
      throw new ScraperBlockedError(
        `La tienda bloqueó la solicitud automatizada (HTTP ${response.status()}).`
      );
    }

    // Check immediate Cloudflare / CAPTCHA / Access Denied walls
    const blockSignal = await page.evaluate(() => {
      const title = (document.title || '').toLowerCase();
      const bodyText = (document.body?.innerText || '').slice(0, 1500).toLowerCase();
      const hasCaptcha = Boolean(
        document.querySelector('iframe[src*="recaptcha"], #cf-challenge-running, .cf-browser-verification')
      );
      if (
        hasCaptcha ||
        title.includes('just a moment') ||
        title.includes('access denied') ||
        title.includes('attention required') ||
        bodyText.includes('verify you are human') ||
        bodyText.includes('enable javascript and cookies to continue')
      ) {
        return true;
      }
      return false;
    });

    if (blockSignal) {
      throw new ScraperBlockedError('Protección anti-bot/Cloudflare o reCAPTCHA detectada en tienda.');
    }

    // Dynamic wait for DOM & price selectors (no static sleep)
    try {
      await page.waitForSelector(selectors.waitSelector, { timeout: 6000 });
    } catch {
      throw new ScraperNotFoundError(
        'Error: No se pudo extraer la información. Usar precio en caché de PostgreSQL'
      );
    }

    const extracted = await page.evaluate((cfg) => {
      const pickFirstText = (candidates: string[]): string => {
        for (const sel of candidates) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const attrContent = el.getAttribute('content') || el.getAttribute('aria-label');
          const txt = (attrContent || el.textContent || '').trim();
          if (txt) return txt;
        }
        return '';
      };

      return {
        title: pickFirstText(cfg.titleSelectors),
        finalPriceText: pickFirstText(cfg.finalPriceSelectors),
        originalPriceText: pickFirstText(cfg.originalPriceSelectors),
        discountText: pickFirstText(cfg.discountSelectors),
      };
    }, selectors);

    if (!extracted.finalPriceText) {
      throw new ScraperNotFoundError(
        'Error: No se pudo extraer la información. Usar precio en caché de PostgreSQL'
      );
    }

    const parsedFinal = parsePriceText(extracted.finalPriceText);
    const parsedOriginal = extracted.originalPriceText
      ? parsePriceText(extracted.originalPriceText)
      : parsedFinal;

    const baseOriginal = parsedOriginal.amount > 0 ? parsedOriginal.amount : parsedFinal.amount;
    const finalNumeric = parsedFinal.amount;

    let discountPctText = '0%';
    const discountMatch = extracted.discountText.match(/-?\d+\s*%/);
    if (discountMatch) {
      const val = discountMatch[0].replace(/\s+/g, '');
      discountPctText = val.startsWith('-') ? val : `-${val}`;
    } else if (baseOriginal > finalNumeric && baseOriginal > 0) {
      const computedPct = Math.round(((baseOriginal - finalNumeric) / baseOriginal) * 100);
      discountPctText = `-${computedPct}%`;
    }

    const finalCop =
      parsedFinal.currency === 'COP'
        ? finalNumeric
        : Math.round((finalNumeric * trm) / 100) * 100;

    const result: ScrapePriceResult = {
      success: true,
      source: 'Web Scraping (Plan B)',
      platform: params.platform,
      game_title: extracted.title || 'Título verificado en tienda',
      discount_percent: discountPctText,
      price_original: Number(baseOriginal.toFixed(2)),
      price_final: Number(finalNumeric.toFixed(2)),
      currency_detected: parsedFinal.currency,
      price_cop_formatted: formatCopStrict(finalCop),
      timestamp: new Date().toISOString(),
    };

    scrapeMemoryCache.set(cacheKey, {
      expiresAt: Date.now() + SCRAPE_CACHE_TTL_MS,
      data: result,
    });

    return result;
  } catch (err) {
    if (err instanceof ScraperBlockedError || err instanceof ScraperNotFoundError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort')) {
      throw new ScraperBlockedError('Operación abortada tras 8 segundos por bloqueo o latencia severa.');
    }
    throw new ScraperNotFoundError(
      'Error: No se pudo extraer la información. Usar precio en caché de PostgreSQL'
    );
  } finally {
    clearTimeout(severeTimeoutId);
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
