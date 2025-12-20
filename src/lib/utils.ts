import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah (Rp)
 * @param value - Nilai angka yang akan diformat
 * @returns String dengan format "Rp1.234.567"
 */
export function formatCurrency(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

/**
 * Format angka ke format Rupiah singkat (untuk chart)
 * @param value - Nilai angka yang akan diformat
 * @returns String dengan format "1.5jt" atau "500rb"
 */
export function formatShortCurrency(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
  return value.toString();
}

/**
 * Format input angka dengan separator ribuan untuk display
 * @param value - String value dari input
 * @returns String dengan format separator ribuan "1.234.567"
 */
export function formatNumberInput(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  return parseInt(numericValue).toLocaleString('id-ID');
}

/**
 * Parse string dengan separator ribuan ke number
 * @param value - String dengan format "1.234.567"
 * @returns Number value
 */
export function parseFormattedNumber(value: string): number {
  const numericValue = value.replace(/\D/g, '');
  return numericValue ? parseInt(numericValue) : 0;
}
