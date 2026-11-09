// Paginación de los carruseles de fotos de la tienda.
//
// - Con menos de 3 productos no aparece el carrusel; la colección sigue disponible
//   en el filtro del catálogo.
// - Con 3 o más se muestran tres fotos por tanda. Si la tanda no se completa,
//   se repiten fotos desde el principio (por ejemplo, con 4: 3 y luego 3 + 1
//   repetida).
export function carouselPage(products, slide = 0) {
  const count = products.length
  if (count < 3) return { pageSize: 0, pageCount: 0, items: [] }

  const pageCount = Math.ceil(count / 3)
  const activeSlide = ((slide % pageCount) + pageCount) % pageCount
  const items = Array.from(
    { length: 3 },
    (_, offset) => products[(activeSlide * 3 + offset) % count],
  )
  return { pageSize: 3, pageCount, items }
}
