import test from 'node:test'
import assert from 'node:assert/strict'

import {
  discountPercent,
  effectivePrice,
  formatCountdown,
  hasOffer,
  offerCountdown,
  offerExpired,
} from './pricing.js'

test('sin precio de oferta no hay oferta', () => {
  assert.equal(hasOffer({ price: '100', sales_price: null }), false)
  assert.equal(hasOffer({ price: '100' }), false)
  assert.equal(hasOffer({ sales_price: '0' }), false)
  assert.equal(hasOffer({ price: '100', discount_percent: 20 }), false)
})

test('una oferta válida debe ser menor al precio normal', () => {
  assert.equal(hasOffer({ price: '100', sales_price: '80' }), true)
  assert.equal(hasOffer({ price: '100', sales_price: '100' }), false)
  assert.equal(hasOffer({ price: '100', sales_price: '120' }), false)
  assert.equal(hasOffer({ price: '100', sales_price: '0' }), false)
})

test('se permite oferta sin precio normal', () => {
  assert.equal(hasOffer({ price: null, sales_price: '80' }), true)
  assert.equal(hasOffer({ sales_price: '80', discount_percent: 20 }), true)
})

test('calcula el porcentaje de descuento redondeado', () => {
  assert.equal(discountPercent({ price: '100', sales_price: '80' }), 20)
  assert.equal(discountPercent({ price: '99.99', sales_price: '74.99' }), 25)
  assert.equal(discountPercent({ price: '100' }), 0)
})

test('sin precio normal usa el porcentaje manual', () => {
  assert.equal(discountPercent({ sales_price: '80', discount_percent: 20 }), 20)
  assert.equal(discountPercent({ sales_price: '80', discount_percent: '35' }), 35)
  assert.equal(discountPercent({ sales_price: '80' }), 0)
  assert.equal(discountPercent({ sales_price: '80', discount_percent: 0 }), 0)
  assert.equal(discountPercent({ sales_price: '80', discount_percent: 120 }), 0)
})

test('con precio normal el porcentaje manual no reemplaza al calculado', () => {
  assert.equal(discountPercent({ price: '100', sales_price: '80', discount_percent: 50 }), 20)
})

test('el precio efectivo usa el de oferta cuando existe', () => {
  assert.equal(effectivePrice({ price: '100', sales_price: '80' }), 80)
  assert.equal(effectivePrice({ price: null, sales_price: '80' }), 80)
  assert.equal(effectivePrice({ price: '100' }), 100)
  assert.equal(effectivePrice({ price: null }), null)
})

test('una oferta vencida deja de contar como oferta', () => {
  const product = {
    price: '100',
    sales_price: '80',
    offer_ends_at: '2030-01-01T10:00:00Z',
  }
  const before = new Date('2030-01-01T09:59:59Z').getTime()
  const after = new Date('2030-01-01T10:00:01Z').getTime()

  assert.equal(offerExpired(product, before), false)
  assert.equal(offerExpired(product, after), true)
  assert.equal(hasOffer(product, before), true)
  assert.equal(hasOffer(product, after), false)
  assert.equal(discountPercent(product, after), 0)
  assert.equal(effectivePrice(product, after), 100)
  assert.equal(offerCountdown(product, after), null)
})

test('una oferta sin fecha de fin no vence', () => {
  assert.equal(offerExpired({ sales_price: '80' }, Date.now()), false)
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
    price: '100',
    sales_price: '80',
    offer_ends_at: '2030-01-01T10:00:00Z',
  }
  assert.equal(offerCountdown(product, now), '1 h 0 min')
  assert.equal(offerCountdown({ price: '100', sales_price: '80' }, now), null)
  assert.equal(offerCountdown({ price: '100' }, now), null)
})
