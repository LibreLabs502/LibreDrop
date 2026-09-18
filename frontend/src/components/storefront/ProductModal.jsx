import { formatPrice, waLink } from '../../api'
import { productOrderMessage } from '../../order'

export default function ProductModal({ product, store, onClose }) {
  if (!product) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">&times;</button>
        <div className="modal-grid">
          <div className="modal-media">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="product-media-fallback">{String(product.name)[0].toUpperCase()}</div>
            )}
          </div>
          <div className="modal-info">
            <h2>{product.name}</h2>
            <p className="product-price big">{formatPrice(product.price)}</p>
            {product.description && <p className="muted">{product.description}</p>}
            <div className="modal-actions">
              {store.phone ? (
                <a
                  className="btn-whatsapp block"
                  href={waLink(store.phone, productOrderMessage(store, product))}
                  target="_blank"
                  rel="noreferrer"
                >
                  Comprar por WhatsApp
                </a>
              ) : (
                <p className="muted">La tienda aún no configura su número de WhatsApp.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}