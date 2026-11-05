import test from 'node:test'
import assert from 'node:assert/strict'
import { discountPercent, effectivePrice, hasOffer } from './pricing.js'

test('solo porcentajes enteros entre 1 y 99 son ofertas', () => {
  assert.equal(hasOffer({ price: '100', discount_percent: 20 }), true)
  for (const value of [0, 100, 20.5, null]) assert.equal(hasOffer({ discount_percent: value }), false)
})
test('calcula el precio rebajado cuando hay precio normal', () => {
  assert.equal(discountPercent({ discount_percent: 20 }), 20)
  assert.equal(effectivePrice({ price: '100', discount_percent: 20 }), 80)
  assert.equal(effectivePrice({ price: '99.99', discount_percent: 25 }), 74.99)
})
test('sin precio normal conserva solo el porcentaje', () => {
  assert.equal(hasOffer({ discount_percent: 35 }), true)
  assert.equal(effectivePrice({ discount_percent: 35 }), null)
})
