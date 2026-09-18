import { formatPrice, waLink } from '../../api'
import { productOrderMessage } from '../../order'

export default function ProductCard({ product, store, onSelect }) {
  return (
    <div className="product-card">
      <button className="product-media" onClick={() => onSelect(product)} aria-label={`Ver ${product.name}`}>
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-media-fallback">{String(product.name)[0].toUpperCase()}</div>
        )}
      </button>
      <div className="product-body">
        <h3 className="product-name" onClick={() => onSelect(product)}>{product.name}</h3>
        <p className="product-desc">{product.description || ''}</p>
        <div className="product-footer">
          <span className="product-price">{formatPrice(product.price)}</span>
          {store.phone ? (
            <a
              className="btn-whatsapp"
              href={waLink(store.phone, productOrderMessage(store, product))}
              target="_blank"
              rel="noreferrer"
            >
              Comprar por WhatsApp
            </a>
          ) : (
            <span className="muted">Sin WhatsApp configurado</span>
          )}
        </div>
      </div>
    </div>
  )
}