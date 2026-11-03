import test from 'node:test'
import assert from 'node:assert/strict'

import { discountPercent, effectivePrice, hasOffer } from './pricing.js'

test('sin precio de oferta no hay oferta', () => {
  assert.equal(hasOffer({ price: '100', sales_price: null }), false)
  assert.equal(hasOffer({ price: '100' }), false)
  assert.equal(hasOffer({ price: null, sales_price: '80' }), false)
})

test('una oferta válida debe ser menor al precio normal', () => {
  assert.equal(hasOffer({ price: '100', sales_price: '80' }), true)
  assert.equal(hasOffer({ price: '100', sales_price: '100' }), false)
  assert.equal(hasOffer({ price: '100', sales_price: '120' }), false)
  assert.equal(hasOffer({ price: '100', sales_price: '0' }), false)
})

test('calcula el porcentaje de descuento redondeado', () => {
  assert.equal(discountPercent({ price: '100', sales_price: '80' }), 20)
  assert.equal(discountPercent({ price: '99.99', sales_price: '74.99' }), 25)
  assert.equal(discountPercent({ price: '100' }), 0)
})

test('el precio efectivo usa el de oferta cuando existe', () => {
  assert.equal(effectivePrice({ price: '100', sales_price: '80' }), 80)
  assert.equal(effectivePrice({ price: '100' }), 100)
  assert.equal(effectivePrice({ price: null }), null)
})
