import {
  PAYMENT_ACCOUNT_HOLDER,
  PAYMENT_ACCOUNT_NUMBER,
  PAYMENT_ACCOUNT_TYPE,
  PAYMENT_BANK,
} from '../../api'

/**
 * Datos de la cuenta bancaria de LibreDrop (dato fijo) donde los dueños de
 * tiendas depositan la suscripción. Se muestra en el paso de activación y en
 * el panel de pagos.
 */
export default function BankDetails() {
  return (
    <div className="bank-details">
      <h4 className="form-section">Datos de la cuenta</h4>
      <div className="kv">
        <span>Banco</span>
        <span>{PAYMENT_BANK}</span>
        <span>Tipo de cuenta</span>
        <span>{PAYMENT_ACCOUNT_TYPE}</span>
        <span>Número de cuenta</span>
        <span><b>{PAYMENT_ACCOUNT_NUMBER}</b></span>
        <span>Titular</span>
        <span>{PAYMENT_ACCOUNT_HOLDER}</span>
      </div>
    </div>
  )
}
