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
