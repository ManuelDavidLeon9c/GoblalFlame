/**
 * RNF03: Global mandatory currency formatter for Colombian Pesos (COP).
 * Exact format: prefix "$ ", thousands separator ".", suffix " COP"
 * Example: 59900 -> "$ 59.900 COP"
 */
export function formatCOP(amount: number): string {
  const safeAmount = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));
  const formatted = safeAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted} COP`;
}

export function calculateDiscountPercent(originalPrice: number, finalPrice: number): number {
  if (originalPrice <= 0) return 0;
  if (finalPrice <= 0) return 100;
  const pct = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function formatDateCO(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoDate;
  }
}

export function formatTimeCO(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
