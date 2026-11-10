import test from 'node:test'
import assert from 'node:assert/strict'

import {
  discountPercent,
  discountedPrice,
  effectivePrice,
  formatCountdown,
  hasOffer,
  offerCountdown,
  offerExpired,
} from './pricing.js'

test('el porcentaje entero es el dato que define una oferta', () => {
  assert.equal(hasOffer({ price: '10', discount_percent: 20 }), true)
  assert.equal(hasOffer({ price: '10' }), false)
  assert.equal(hasOffer({ price: '10', discount_percent: 0 }), false)
  assert.equal(hasOffer({ price: '10', discount_percent: 100 }), false)
  assert.equal(hasOffer({ price: '10', discount_percent: 20.5 }), false)
})

test('calcula el porcentaje de descuento y el precio rebajado', () => {
  const product = { price: '10.00', discount_percent: 20 }
  assert.equal(discountPercent(product), 20)
  assert.equal(discountedPrice(product), 8)
  assert.equal(effectivePrice(product), 8)
})

test('redondea el precio rebajado a dos decimales', () => {
  assert.equal(discountedPrice({ price: '99.99', discount_percent: 25 }), 74.99)
  assert.equal(discountedPrice({ price: '10.05', discount_percent: 50 }), 5.03)
})

test('sin precio normal muestra el porcentaje sin inventar un precio', () => {
  const product = { price: null, discount_percent: 20 }
  assert.equal(hasOffer(product), true)
  assert.equal(discountPercent(product), 20)
  assert.equal(discountedPrice(product), null)
  assert.equal(effectivePrice(product), null)
})

test('una oferta vencida deja de contar y muestra el precio normal', () => {
  const product = {
    price: '10.00',
    discount_percent: 20,
    offer_ends_at: '2030-01-01T10:00:00Z',
  }
  const before = new Date('2030-01-01T09:59:59Z').getTime()
  const after = new Date('2030-01-01T10:00:01Z').getTime()

  assert.equal(offerExpired(product, before), false)
  assert.equal(offerExpired(product, after), true)
  assert.equal(hasOffer(product, before), true)
  assert.equal(hasOffer(product, after), false)
  assert.equal(discountPercent(product, after), 0)
  assert.equal(effectivePrice(product, after), 10)
  assert.equal(offerCountdown(product, after), null)
})

test('la cuenta regresiva usa la unidad más cómoda', () => {
  assert.equal(formatCountdown(2 * 86400_000 + 3 * 3600_000), '2 d 3 h')
  assert.equal(formatCountdown(3 * 3600_000 + 20 * 60_000), '3 h 20 min')
  assert.equal(formatCountdown(5 * 60_000 + 30_000), '5 min 30 s')
  assert.equal(formatCountdown(45_000), '45 s')
  assert.equal(formatCountdown(0), null)
  assert.equal(formatCountdown(null), null)
})

test('la cuenta regresiva solo aparece en ofertas vigentes', () => {
  const now = new Date('2030-01-01T09:00:00Z').getTime()
  const product = {
    price: '10',
    discount_percent: 20,
    offer_ends_at: '2030-01-01T10:00:00Z',
  }
  assert.equal(offerCountdown(product, now), '1 h 0 min')
  assert.equal(offerCountdown({ price: '10', discount_percent: 20 }, now), null)
  assert.equal(offerCountdown({ price: '10' }, now), null)
})
