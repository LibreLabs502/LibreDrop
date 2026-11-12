export const SUBSCRIPTION_TRANSITION_MS = 1500

export const waitForSubscriptionTransition = () =>
  new Promise((resolve) => window.setTimeout(resolve, SUBSCRIPTION_TRANSITION_MS))

export default function SubscriptionPaymentTransition() {
  return (
    <div className="subscription-transition" role="status" aria-live="polite" aria-label="Preparando el pago de tu suscripción">
      <div className="subscription-transition-brand">
        <img src="/images/libredrop_icon.webp" alt="" />
        <strong>LibreDrop</strong>
      </div>
      <p>Preparando tu pago de suscripción…</p>
    </div>
  )
}
