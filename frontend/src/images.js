// Fotos de un producto. La primera del orden es la portada; el resto se muestra
// en la ventana de detalles. El backend siempre devuelve las cinco claves, con
// null cuando no hay foto.
export const PRODUCT_IMAGE_FIELDS = ['image', 'image2', 'image3', 'image4', 'image5']

// Orden efectivo: primero las claves guardadas en `photo_order` y después las
// que falten, en su orden natural. Ignora claves inválidas o repetidas para no
// romper la vista si llega un dato viejo o corrupto.
const orderedFields = (product) => {
  const stored = Array.isArray(product?.photo_order) ? product.photo_order : []
  const seen = new Set()
  const fields = []
  for (const key of stored) {
    if (PRODUCT_IMAGE_FIELDS.includes(key) && !seen.has(key)) {
      seen.add(key)
      fields.push(key)
    }
  }
  for (const key of PRODUCT_IMAGE_FIELDS) {
    if (!seen.has(key)) fields.push(key)
  }
  return fields
}

export const productImages = (product) =>
  orderedFields(product)
    .map((field) => product?.[field])
    .filter(Boolean)
