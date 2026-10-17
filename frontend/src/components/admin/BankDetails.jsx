/**
 * Datos de la cuenta bancaria de LibreDrop (los trae el backend) donde los
 * dueños de tiendas depositan la suscripción. Se muestra en el paso de
 * activación y en el panel de pagos.
 */
export default function BankDetails({ billing }) {
  if (!billing) return null
  return (
    <div className="bank-details">
      <h4 className="form-section">Datos de la cuenta</h4>
      <div className="kv">
        <span>Banco</span>
        <span>{billing.bank}</span>
        <span>Tipo de cuenta</span>
        <span>{billing.account_type}</span>
        <span>Número de cuenta</span>
        <span><b>{billing.account_number}</b></span>
        <span>Titular</span>
        <span>{billing.holder}</span>
      </div>
    </div>
  )
}
