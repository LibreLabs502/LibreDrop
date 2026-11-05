// Precios de un producto y detección de ofertas.
//
// `sales_price` es el precio con descuento. Cuenta como oferta si existe, es
// mayor que cero y, cuando hay precio normal, es menor que ese precio.
// `discount_percent` es opcional y solo se usa cuando no hay precio normal:
// permite mostrar “Descuento del: 20%” sin una base para calcularlo.

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const productPrice = (product) => toNumber(product?.price)

export const productSalesPrice = (product) => toNumber(product?.sales_price)

const manualDiscountPercent = (product) => {
  const percent = toNumber(product?.discount_percent)
  if (percent === null || percent < 1 || percent > 99) return null
  return Math.round(percent)
}

export const hasOffer = (product) => {
  const price = productPrice(product)
  const salesPrice = productSalesPrice(product)
  if (salesPrice === null || salesPrice <= 0) return false
  return price === null || salesPrice < price
}

export const discountPercent = (product) => {
  if (!hasOffer(product)) return 0
  const price = productPrice(product)
  // Con precio normal el porcentaje se calcula; sin precio normal se usa el
  // porcentaje manual si la tienda lo cargó.
  if (price !== null) return Math.round((1 - productSalesPrice(product) / price) * 100)
  return manualDiscountPercent(product) || 0
}

// Precio que se muestra como principal: el de oferta si hay, si no el normal.
export const effectivePrice = (product) => (hasOffer(product) ? productSalesPrice(product) : productPrice(product))
