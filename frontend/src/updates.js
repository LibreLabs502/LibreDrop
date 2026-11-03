// Registro de novedades que se muestra al entrar al panel.
//
// Para publicar una actualización nueva:
// 1. Agregá una entrada al principio de UPDATES con una `version` única.
// 2. Actualizá VERSIONS.md con el mismo resumen para los desarrolladores.
//
// El panel muestra automáticamente la entrada más reciente a cada usuario que
// todavía no la haya visto. Lo visto se guarda en localStorage por usuario.
export const UPDATES = [
  {
    version: 'v0.9',
    date: 'Noviembre 2026',
    title: 'Novedades en tu panel',
    items: [
      'Ahora podés personalizar el texto de los botones de compra de tu tienda.',
      'Elegí por ejemplo “Pedir por” o “Comprar por”: se usa en WhatsApp, Instagram, Facebook y TikTok.',
      'Si lo dejás vacío, tus botones vuelven a decir “Comprar por”.',
    ],
  },
  {
    version: 'v0.8',
    date: 'Noviembre 2026',
    title: 'Novedades en tu panel',
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
