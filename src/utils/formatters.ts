/**
 * Formats numbers, dates, and currency strictly using English (Western) digits (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
 * and converts any Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩) to English digits.
 */

// Convert Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) to Western/English numerals (0-9)
export function toEnglishDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/[٠-٩]/g, (char) => String('0123456789'[char.charCodeAt(0) - 1632]))
    .replace(/[۰-۹]/g, (char) => String('0123456789'[char.charCodeAt(0) - 1776]));
}

// Convert input value to number safely using English digits
export function parseEnglishNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const englishStr = toEnglishDigits(val).replace(/,/g, '').trim();
  const num = parseFloat(englishStr);
  return isNaN(num) ? 0 : num;
}

// Format financial amount with thousands separators in English digits (e.g., "145,000" or "1,250.50")
export function formatAmount(val: number | string | null | undefined, decimals?: number): string {
  if (val === null || val === undefined) return '0';
  const num = typeof val === 'number' ? val : parseEnglishNumber(val);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals !== undefined ? decimals : 0,
    maximumFractionDigits: decimals !== undefined ? decimals : 2,
    useGrouping: true,
  }).format(num);
  return toEnglishDigits(formatted);
}

// Format integer/count in English digits (e.g., "48" or "1,248")
export function formatCount(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '0';
  const num = typeof val === 'number' ? val : parseEnglishNumber(val);
  const formatted = new Intl.NumberFormat('en-US', {
    useGrouping: true,
  }).format(Math.round(num));
  return toEnglishDigits(formatted);
}

// Format percentage with English digits (e.g., "85%" or "95.5%")
export function formatPercent(val: number | string | null | undefined, decimals = 0): string {
  if (val === null || val === undefined) return '0%';
  const num = typeof val === 'number' ? val : parseEnglishNumber(val);
  return `${toEnglishDigits(num.toFixed(decimals))}%`;
}

// Format date and time in Arabic language BUT with strictly English digits
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return toEnglishDigits(formatted);
  } catch {
    // Fallback ISO format with English digits
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${mins}`;
  }
}

// Format long date with day name in Arabic and strictly English numbers
export function formatLongDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
    return toEnglishDigits(formatted);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

// Format time only with strictly English digits
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  try {
    const formatted = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return toEnglishDigits(formatted);
  } catch {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }
}
