import type { Band } from '../lib/attendance'

/** Colour treatment per attendance band, so every screen speaks the same language. */
export const BAND_TEXT: Record<Band, string> = {
  safe: 'text-primary',
  warn: 'text-warning',
  danger: 'text-secondary',
  empty: 'text-on-surface-variant',
}

export const BAND_FILL: Record<Band, string> = {
  safe: 'bg-primary',
  warn: 'bg-warning',
  danger: 'bg-secondary',
  empty: 'bg-outline-variant',
}

export const BAND_BORDER: Record<Band, string> = {
  safe: 'border-primary',
  warn: 'border-warning',
  danger: 'border-secondary',
  empty: 'border-outline',
}

/** Raw hex, for the inline conic-gradient ring and hard shadows. */
export const BAND_HEX: Record<Band, string> = {
  safe: '#38bdf8',
  warn: '#ffb020',
  danger: '#ff3b22',
  empty: '#3a3a3a',
}
