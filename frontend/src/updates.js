// Registro de novedades que se muestra al entrar al panel.
//
// Para publicar una actualización nueva:
// 1. Agregá una entrada al principio de UPDATES con una `version` única.
// 2. Actualizá VERSIONS.md con el mismo resumen para los desarrolladores.
//
// Al entrar, el panel muestra solo la última entrada; al abrir “Novedades” o
// “Ver Novedades” muestra todas, separadas por versión. Avisa con “Nuevo”
// mientras el usuario no haya visto la más reciente. Lo visto se guarda en
// localStorage por usuario.
export const UPDATES = [
  {
    version: 'v0.11',
    date: 'Noviembre 2026',
    title: 'Más fotos y detalles de productos',
    items: [
      'Ahora podés subir hasta 5 fotos por producto desde Catálogo.',
      'La primera foto es la portada y las demás aparecen en la ventana de detalles.',
      'En la tienda pública agregamos “Ver detalles…” debajo de la descripción, antes de los botones de compra.',
      'Desde esa ventana tus clientes pueden ver todas las fotos, el precio y las opciones de compra.',
    ],
  },
  {
    version: 'v0.10',
    date: 'Noviembre 2026',
    title: 'Ofertas en tu tienda',
    items: [
      'Agregá un precio de oferta a tus productos desde Catálogo.',
      'La tienda pública muestra el precio anterior tachado y el porcentaje de descuento.',
      'Nuevo filtro “Ofertas” para que tus clientes vean solo los productos rebajados.',
      'Esta ventana ahora muestra también las versiones anteriores, separadas por número.',
    ],
  },
  {
    version: 'v0.9',
    date: 'Noviembre 2026',
    title: 'Texto de los botones de compra',
    items: [
      'Ahora podés personalizar el texto de los botones de compra de tu tienda.',
      'Elegí por ejemplo “Pedir por” o “Comprar por”: se usa en WhatsApp, Instagram, Facebook y TikTok.',
      'Si lo dejás vacío, tus botones vuelven a decir “Comprar por”.',
    ],
  },
  {
    version: 'v0.8',
    date: 'Noviembre 2026',
    title: 'Novedades del panel',
    items: [
      'Ahora vas a ver este resumen cada vez que haya una actualización nueva.',
      'Agregá la marca de tus productos y editá todos sus datos.',
      'Los productos sin precio ya no muestran Q 0.00.',
      'En Instagram, Facebook y TikTok podés copiar el pedido y pegarlo en el chat.',
    ],
  },
]

export const LATEST_UPDATE = UPDATES[0] || null

// Documentación completa de versiones publicada en GitHub.
export const VERSIONS_URL = 'https://github.com/LibreLabs502/LibreDrop/blob/main/VERSIONS.md'

const seenKey = (user) => `libredrop_updates_seen:${user?.id ?? user?.username ?? 'anon'}`

export const hasSeenLatestUpdate = (user) => {
  if (!LATEST_UPDATE) return true
  try {
    return localStorage.getItem(seenKey(user)) === LATEST_UPDATE.version
  } catch {
    // Si el navegador bloquea localStorage, mostramos las novedades igual.
    return false
  }
}

export const markLatestUpdateSeen = (user) => {
  if (!LATEST_UPDATE) return
  try {
    localStorage.setItem(seenKey(user), LATEST_UPDATE.version)
  } catch {
    // Sin localStorage no hay forma de recordarlo; no es un error fatal.
  }
}
