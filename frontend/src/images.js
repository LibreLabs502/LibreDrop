// Fotos de un producto. La primera (image) es la portada; el resto se muestra
// en la ventana de detalles. El backend siempre devuelve las cinco claves, con
// null cuando no hay foto.
export const PRODUCT_IMAGE_FIELDS = ['image', 'image2', 'image3', 'image4', 'image5']

export const productImages = (product) =>
  PRODUCT_IMAGE_FIELDS.map((field) => product?.[field]).filter(Boolean)
