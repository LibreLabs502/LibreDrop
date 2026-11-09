// Precios de un producto y detección de ofertas.
//
// `sales_price` es el precio con descuento. Cuenta como oferta si existe, es
// mayor que cero y, cuando hay precio normal, es menor que ese precio.
// `discount_percent` es opcional y solo se usa cuando no hay precio normal:
// permite mostrar “Descuento del: 20%” sin una base para calcularlo.
//
// Una oferta con `offer_ends_at` vencido deja de contar como oferta, aunque el
// precio de oferta siga guardado. La tienda pública muestra el precio normal.

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const productPrice = (product) => toNumber(product?.price)

export const productSalesPrice = (product) => toNumber(product?.sales_price)

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
  if (percent === null || percent < 1 || percent > 99) return null
  return Math.round(percent)
}

export const hasOffer = (product, now = Date.now()) => {
  if (offerExpired(product, now)) return false
  const price = productPrice(product)
  const salesPrice = productSalesPrice(product)
  if (salesPrice === null || salesPrice <= 0) return false
  return price === null || salesPrice < price
}

export const discountPercent = (product, now = Date.now()) => {
  if (!hasOffer(product, now)) return 0
  const price = productPrice(product)
  // Con precio normal el porcentaje se calcula; sin precio normal se usa el
  // porcentaje manual si la tienda lo cargó.
  if (price !== null) return Math.round((1 - productSalesPrice(product) / price) * 100)
  return manualDiscountPercent(product) || 0
}

// Precio que se muestra como principal: el de oferta si hay, si no el normal.
export const effectivePrice = (product, now = Date.now()) =>
  hasOffer(product, now) ? productSalesPrice(product) : productPrice(product)

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
