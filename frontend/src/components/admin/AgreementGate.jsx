import { useState } from 'react'
import { useAuth } from '../../store/AuthContext'

export const AGREEMENT_VERSION = 'v3'

export function AgreementCopy() {
  return (
    <div className="agreement-copy" tabIndex="0" aria-label="Acuerdo de uso de LibreDrop">
      <section>
        <h2>1. Uso de LibreDrop</h2>
        <p>LibreDrop te permite crear y administrar una tienda en línea, publicar productos y recibir pedidos por los canales que configures. Te comprometés a mantener actualizados los datos de tu cuenta, proteger tus credenciales y usar la plataforma de forma legal y respetuosa.</p>
      </section>
      <section>
        <h2>2. Tu tienda y tus clientes</h2>
        <p>Sos responsable del contenido, precios, disponibilidad, entregas y atención de tu tienda. Al recibir datos de clientes, debés usarlos únicamente para atender sus pedidos y consultas, y compartirlos solo cuando sea necesario para completar la compra. No publiques información sensible o que no necesités.</p>
      </section>
      <section>
        <h2>3. Información y privacidad</h2>
        <p>LibreDrop guarda datos de cuenta y tienda, catálogo, pedidos, información de contacto de clientes y comprobantes de suscripción para prestar el servicio, dar soporte, proteger las cuentas y administrar pagos. Aplicamos permisos por tienda y acceso restringido a funciones administrativas.</p>
        <p>Los datos personales que el cliente proporciona al hacer un pedido se guardan para que la tienda lo atienda y se muestran a quienes administran esa tienda; no se publican en su catálogo. LibreDrop no usa esos datos de pedidos para entrenar modelos propios de inteligencia artificial.</p>
        <p>Las descripciones, fotos y demás contenido que publicás en una tienda pública sí son accesibles por internet. LibreDrop usa robots.txt para pedir a buscadores y rastreadores que no recorran ni indexen el sitio. Es una instrucción voluntaria: algunos bots pueden ignorarla y LibreDrop no puede controlar qué hacen terceros con contenido público que hayan recopilado, incluido su posible uso para entrenar modelos. No publiques contenido confidencial o información personal que no quieras hacer pública.</p>
        <p>Para operar usamos proveedores tecnológicos de alojamiento, base de datos y almacenamiento de imágenes. Cuando continuás a WhatsApp, Instagram, Facebook o TikTok, esos servicios aplican sus propias condiciones y políticas. LibreDrop no controla sus prácticas. Ningún servicio conectado a internet puede prometer seguridad absoluta.</p>
      </section>
      <section>
        <h2>4. Licencia del proyecto y mejoras</h2>
        <p>El código de LibreDrop se distribuye bajo la licencia GNU Affero General Public License, versión 3 (AGPL-3.0). La suscripción no cobra una licencia de uso del código; corresponde al alojamiento de la versión administrada por LibreDrop y a los servicios asociados. Podés consultar el <a href="https://github.com/LibreLabs502/LibreDrop/blob/main/LICENSE" target="_blank" rel="noreferrer">texto completo de la licencia</a>.</p>
        <p>Las solicitudes de cambios para el servicio oficial se evalúan para mejorar la plataforma en conjunto. Si una mejora se aprueba y se implementa, se integra al producto común y queda disponible para todas las tiendas; la suscripción no incluye desarrollos exclusivos por tienda ni garantiza que toda solicitud o fecha propuesta se apruebe. Los cambios y redistribuciones del código deben cumplir la AGPL-3.0.</p>
      </section>
      <section>
        <h2>5. Servicio, soporte y actualizaciones</h2>
        <p>La suscripción incluye el alojamiento de LibreDrop para que tu tienda esté disponible en internet, soporte de 6:00 a. m. a 10:00 p. m. (hora de Guatemala) por nuestras redes sociales y las actualizaciones que publiquemos para la plataforma. Los tiempos de respuesta pueden variar según la cantidad y complejidad de las consultas.</p>
      </section>
      <section>
        <h2>6. Suscripción y activación</h2>
        <p>La suscripción se paga por los medios indicados en el panel y se activa cuando LibreDrop verifica el pago. Si vence, la tienda conserva el período de gracia mostrado en el panel; después el acceso se suspende hasta confirmar el pago. LibreDrop no procesa los pagos que tus clientes acuerden directamente con tu tienda.</p>
      </section>
      <section>
        <h2>7. Disponibilidad y uso responsable</h2>
        <p>Podemos realizar mantenimiento, actualizar funciones o limitar temporalmente el acceso para proteger la plataforma, sus usuarios o terceros. No uses LibreDrop para fraude, actividades ilícitas, spam ni para vulnerar derechos de otras personas.</p>
      </section>
      <section>
        <h2>8. Aceptación</h2>
        <p>Al aceptar, confirmás que leíste este acuerdo y que estás autorizado a administrar la tienda seleccionada. Guardamos la versión aceptada y la fecha para dejar constancia. Si publicamos una versión nueva, te pediremos revisarla nuevamente.</p>
      </section>
    </div>
  )
}

export default function AgreementGate() {
  const { user, acceptAgreement, logout } = useAuth()
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const accept = async (event) => {
    event.preventDefault()
    if (!checked || busy) return
    setBusy(true)
    setError('')
    try {
      await acceptAgreement(AGREEMENT_VERSION)
    } catch (err) {
      setError(err.message || 'No se pudo guardar tu aceptación. Intentá de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="agreement-gate">
      <section className="agreement-card" aria-labelledby="agreement-title">
        <header className="agreement-header">
          <img src="/images/libredrop_icon.webp" alt="" />
          <div>
            <span className="agreement-eyebrow">ANTES DE CONTINUAR</span>
            <h1 id="agreement-title">Acuerdo de uso y datos</h1>
            <p>Hola{user?.first_name ? `, ${user.first_name}` : ''}. Revisá cómo funciona LibreDrop y cómo cuidamos tu información.</p>
          </div>
        </header>

        <div className="agreement-privacy-callout">
          <span aria-hidden="true">◇</span>
          <p><b>Tus datos están protegidos con nosotros.</b> Usamos controles de acceso para limitar quién puede ver la información y la utilizamos para operar LibreDrop, brindar soporte y administrar tu suscripción.</p>
        </div>

        <AgreementCopy />

        <form className="agreement-actions" onSubmit={accept}>
          <label className="agreement-check">
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
            <span>Leí y acepto el acuerdo de uso y tratamiento de datos de LibreDrop.</span>
          </label>
          {error && <p className="agreement-error" role="alert">{error}</p>}
          <div className="agreement-buttons">
            <button type="button" className="btn ghost" onClick={logout}>Cerrar sesión</button>
            <button type="submit" className="btn" disabled={!checked || busy}>{busy ? 'Guardando…' : 'Aceptar y continuar'}</button>
          </div>
        </form>
      </section>
    </main>
  )
}
