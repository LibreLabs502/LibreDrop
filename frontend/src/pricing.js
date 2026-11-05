// Las ofertas se representan solo con un porcentaje entero de 1 a 99.
const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const productPrice = (product) => toNumber(product?.price)
export const discountPercent = (product) => {
  const percent = toNumber(product?.discount_percent)
  return Number.isInteger(percent) && percent >= 1 && percent <= 99 ? percent : 0
}
export const hasOffer = (product) => discountPercent(product) > 0
export const effectivePrice = (product) => {
  const price = productPrice(product)
  if (price === null) return null
  return hasOffer(product) ? Math.round(price * (100 - discountPercent(product))) / 100 : price
}
