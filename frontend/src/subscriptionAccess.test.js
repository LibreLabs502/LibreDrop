import test from 'node:test'
import assert from 'node:assert/strict'
import { hasAdminSubscriptionAccess } from './subscriptionAccess.js'

test('permite usar el panel con un plan activo', () => {
  assert.equal(hasAdminSubscriptionAccess({ status: 'active' }), true)
})

test('permite usar el panel durante los diez días de gracia', () => {
  assert.equal(hasAdminSubscriptionAccess({ status: 'past_due' }), true)
})

test('bloquea el panel tras la gracia y sin suscripción', () => {
  assert.equal(hasAdminSubscriptionAccess({ status: 'suspended' }), false)
  assert.equal(hasAdminSubscriptionAccess(null), false)
})

test('el superusuario siempre conserva el acceso administrativo', () => {
  assert.equal(hasAdminSubscriptionAccess(null, true), true)
})
