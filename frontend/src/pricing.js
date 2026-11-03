// Precios de un producto y detección de ofertas.
//
// `sales_price` es el precio con descuento. Solo cuenta como oferta si existe,
// es mayor que cero y menor que el precio normal. Así el frontend nunca muestra
// descuentos inválidos aunque el backend tenga datos viejos.

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const productPrice = (product) => toNumber(product?.price)

export const productSalesPrice = (product) => toNumber(product?.sales_price)

export const hasOffer = (product) => {
  const price = productPrice(product)
  const salesPrice = productSalesPrice(product)
  return price !== null && salesPrice !== null && salesPrice > 0 && salesPrice < price
}

export const discountPercent = (product) => {
  if (!hasOffer(product)) return 0
  return Math.round((1 - productSalesPrice(product) / productPrice(product)) * 100)
}

// Precio que se muestra como principal: el de oferta si hay, si no el normal.
export const effectivePrice = (product) => (hasOffer(product) ? productSalesPrice(product) : productPrice(product))
