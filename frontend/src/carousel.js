// Paginación de los carruseles de fotos de la tienda.
//
// - Con 0 o 1 producto no hay carrusel: solo queda el filtro de la colección.
// - Con 2 productos se muestra una foto por tanda: 1 y 1.
// - Con 3 o más se muestran tres fotos por tanda. Si la tanda no se completa,
//   se repiten fotos desde el principio (por ejemplo, con 4: 3 y luego 3 + 1
//   repetida).
export function carouselPage(products, slide = 0) {
  const count = products.length
  if (count < 2) return { pageSize: 0, pageCount: 0, items: [] }

  if (count === 2) {
    const index = ((slide % count) + count) % count
    return { pageSize: 1, pageCount: count, items: [products[index]] }
  }

  const pageCount = Math.ceil(count / 3)
  const activeSlide = ((slide % pageCount) + pageCount) % pageCount
  const items = Array.from(
    { length: 3 },
    (_, offset) => products[(activeSlide * 3 + offset) % count],
  )
  return { pageSize: 3, pageCount, items }
}
