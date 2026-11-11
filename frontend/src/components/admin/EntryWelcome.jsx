import { useEffect } from 'react'

export default function EntryWelcome({ user, type, ready, onComplete }) {
  useEffect(() => {
    if (!ready) return undefined

    const timer = window.setTimeout(() => {
      const finish = () => onComplete()
      if (document.startViewTransition) document.startViewTransition(finish)
      else finish()
    }, type === 'registration' ? 1700 : 1450)

    return () => window.clearTimeout(timer)
  }, [onComplete, ready, type])

  const displayName = user?.username || 'de nuevo'
  const isRegistration = type === 'registration'

  return (
    <main className={`entry-welcome${isRegistration ? ' registration' : ''}`}>
      <div className="entry-welcome-orbit" aria-hidden="true"><span /></div>
      <div className="entry-welcome-content">
        <img src="/images/libredrop_icon.webp" alt="" />
        <p className="entry-welcome-kicker">LibreDrop</p>
        <h1>{isRegistration ? `¡Tu tienda está casi lista, ${user?.first_name || displayName}!` : `¡Bienvenido de nuevo, ${displayName}!`}</h1>
        <p>{isRegistration ? 'En el siguiente paso te guiamos para completar el pago y activar tu tienda.' : 'Preparando tu espacio de trabajo…'}</p>
        <span className="entry-welcome-loader" aria-hidden="true"><i /><i /><i /></span>
      </div>
    </main>
  )
}
