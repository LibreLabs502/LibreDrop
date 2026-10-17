import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPurchaseLinks,
  channelIsReady,
  channelLink,
  waLink,
} from './channels.js'

test('whatsapp arma un enlace wa.me con el mensaje', () => {
  const link = waLink('+502 1234-5678', 'Hola')
  assert.match(link, /^https:\/\/wa\.me\/50212345678\?text=Hola$/)
})

test('waLink devuelve null sin número', () => {
  assert.equal(waLink('', 'Hola'), null)
  assert.equal(waLink('sin numero', 'Hola'), null)
})

test('construye solo los canales activados y con destino válido', () => {
  const store = {
    purchase_channels: ['whatsapp'],
    whatsapp: '50212345678',
  }
  const links = buildPurchaseLinks(store, 'Hola')
  assert.equal(links.length, 1)
  assert.equal(links[0].key, 'whatsapp')
  assert.equal(links[0].label, 'WhatsApp')
  assert.match(links[0].href, /wa\.me\/50212345678/)
})

test('no muestra un canal sin destino válido', () => {
  const links = buildPurchaseLinks({ purchase_channels: ['instagram'], instagram_url: '' }, 'Hola')
  assert.equal(links.length, 0)
})

test('no muestra canales con datos que no fueron activados', () => {
  const store = {
    purchase_channels: [],
    whatsapp: '50212345678',
    instagram_url: 'https://instagram.com/tienda',
  }
  assert.equal(buildPurchaseLinks(store, 'Hola').length, 0)
})

test('ignora canales desconocidos y repetidos', () => {
  const store = {
    purchase_channels: ['whatsapp', 'linkedin', 'whatsapp', 'inventado'],
    whatsapp: '50212345678',
  }
  const links = buildPurchaseLinks(store, 'Hola')
  assert.equal(links.length, 1)
  assert.equal(links[0].key, 'whatsapp')
})

test('respeta el orden canónico de los canales', () => {
  const store = {
    purchase_channels: ['tiktok', 'whatsapp', 'facebook'],
    whatsapp: '50212345678',
    facebook_url: 'https://facebook.com/tienda',
    tiktok_url: 'https://tiktok.com/@tienda',
  }
  const keys = buildPurchaseLinks(store, 'Hola').map((l) => l.key)
  assert.deepEqual(keys, ['whatsapp', 'facebook', 'tiktok'])
})

test('usa el enlace configurado para las redes', () => {
  const store = { purchase_channels: ['instagram'], instagram_url: 'https://instagram.com/tienda' }
  assert.equal(channelLink('instagram', store, 'Hola'), 'https://instagram.com/tienda')
})

test('channelIsReady refleja si falta el dato', () => {
  assert.equal(channelIsReady('whatsapp', { whatsapp: '' }), false)
  assert.equal(channelIsReady('whatsapp', { whatsapp: '+50212345678' }), true)
  assert.equal(channelIsReady('facebook', { facebook_url: 'no-es-url' }), false)
  assert.equal(channelIsReady('facebook', { facebook_url: 'https://facebook.com/x' }), true)
})
