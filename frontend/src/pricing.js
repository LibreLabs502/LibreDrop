// El descuento porcentual es el único dato de oferta. Si hay precio normal,
// se calcula el precio rebajado; sin precio, solo se muestra el porcentaje.

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const productPrice = (product) => toNumber(product?.price)

// Momento (en milisegundos) en que termina la oferta, o null si no tiene fin.
export const offerEndsAt = (product) => {
  const raw = product?.offer_ends_at
  if (!raw) return null
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : null
}

export const offerExpired = (product, now = Date.now()) => {
  const end = offerEndsAt(product)
  return end !== null && end <= now
}

const manualDiscountPercent = (product) => {
  const percent = toNumber(product?.discount_percent)
  if (percent === null || !Number.isInteger(percent) || percent < 1 || percent > 99) return null
  return percent
}

export const hasOffer = (product, now = Date.now()) => {
  if (offerExpired(product, now)) return false
  return manualDiscountPercent(product) !== null
}

export const discountPercent = (product, now = Date.now()) => {
  if (!hasOffer(product, now)) return 0
  return manualDiscountPercent(product) || 0
}

export const discountedPrice = (product, now = Date.now()) => {
  if (!hasOffer(product, now)) return null
  const price = productPrice(product)
  const percent = discountPercent(product, now)
  if (price === null) return null
  return Math.round((price * (100 - percent) / 100 + Number.EPSILON) * 100) / 100
}

// Precio principal: calculado si hay oferta y precio normal; si no, el normal.
export const effectivePrice = (product, now = Date.now()) =>
  hasOffer(product, now) ? discountedPrice(product, now) : productPrice(product)

// Milisegundos que le quedan a la oferta. Null si no tiene fecha de fin.
export const offerRemaining = (product, now = Date.now()) => {
  const end = offerEndsAt(product)
  if (end === null) return null
  return Math.max(0, end - now)
}

// Cuenta regresiva corta y legible: días/horas/minutos/segundos según falte.
export const formatCountdown = (remaining) => {
  if (remaining === null || remaining <= 0) return null
  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  if (minutes > 0) return `${minutes} min ${seconds} s`
  return `${seconds} s`
}

// Texto de cuenta regresiva para una oferta vigente, o null si no aplica.
export const offerCountdown = (product, now = Date.now()) => {
  if (!hasOffer(product, now)) return null
  return formatCountdown(offerRemaining(product, now))
}
