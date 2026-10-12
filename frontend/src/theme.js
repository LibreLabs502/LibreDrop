// Aplica la configuración visual de una tienda como variables CSS.
//
// Los colores vienen del backend (`theme` de la tienda). Este módulo solo los
// traduce a variables y deriva tonos para hover/focus/bordes. Si falta la
// configuración o es inválida, se usa el tema azul predeterminado —el mismo
// del backend— para no mostrar una paleta incorrecta.

export const DEFAULT_THEME = {
  primary: '#2563EB',
  secondary: '#DBEAFE',
  background: '#F6F7F9',
  text: '#1F2430',
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const normalize = (value) => (HEX_RE.test(String(value || '')) ? String(value) : null)

const toRgb = (hex) => {
  const clean = normalize(hex)
  if (!clean) return null
  let h = clean.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

const toHex = (rgb) =>
  `#${rgb
    .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()

// t = 0 devuelve `a`; t = 1 devuelve `b`.
const mix = (a, b, t) => {
  const ca = toRgb(a)
  const cb = toRgb(b)
  if (!ca || !cb) return a
  return toHex(ca.map((v, i) => v + (cb[i] - v) * t))
}

// Luminancia relativa (WCAG) para decidir el color de texto sobre el principal.
const luminance = (hex) => {
  const rgb = toRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const withAlpha = (hex, alpha) => {
  const rgb = toRgb(hex) || [0, 0, 0]
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

export function themeStyle(theme) {
  const source = theme && typeof theme === 'object' ? theme : {}
  const primary = normalize(source.primary) || DEFAULT_THEME.primary
  const secondary = normalize(source.secondary) || DEFAULT_THEME.secondary
  const background = normalize(source.background) || DEFAULT_THEME.background
  const text = normalize(source.text) || DEFAULT_THEME.text

  // Texto legible sobre el color principal (contraste).
  const onPrimary = luminance(primary) > 0.55 ? '#111827' : '#FFFFFF'
  // Para texto sobre fondo claro, usar el primario tal cual puede ser ilegible
  // en paletas claras (p. ej. Rosa); se oscurece hacia el color de texto.
  const primaryInk = luminance(primary) > 0.45 ? mix(primary, text, 0.5) : primary
  const isLightText = onPrimary === '#FFFFFF'

  // Superficie de tarjetas: casi blanca en temas claros, ligeramente aclarada
  // en temas oscuros.
  const lightBackground = luminance(background) > 0.5
  const surface = lightBackground
    ? mix(background, '#FFFFFF', 0.7)
    : mix(background, '#FFFFFF', 0.08)

  return {
    '--store-primary': primary,
    '--store-primary-dark': mix(primary, '#000000', 0.18),
    '--store-primary-soft': mix(primary, '#FFFFFF', 0.88),
    '--store-primary-ink': primaryInk,
    '--store-secondary': secondary,
    '--store-bg': background,
    '--store-surface': surface,
    '--store-text': text,
    '--store-muted': mix(text, background, 0.45),
    '--store-border': mix(background, text, 0.16),
    '--store-toolbar-bg': withAlpha(background, 0.9),
    '--store-on-primary': onPrimary,
    '--store-hero-overlay': isLightText ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
    '--store-hero-border': isLightText ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.3)',
    '--store-hero-border-strong': isLightText ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.45)',
  }
}
