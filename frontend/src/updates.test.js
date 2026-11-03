import test from 'node:test'
import assert from 'node:assert/strict'

import { LATEST_UPDATE, hasSeenLatestUpdate, markLatestUpdateSeen } from './updates.js'

test('la última novedad tiene versión, título y contenido', () => {
  assert.ok(LATEST_UPDATE)
  assert.match(LATEST_UPDATE.version, /^v\d/)
  assert.ok(LATEST_UPDATE.title)
  assert.ok(LATEST_UPDATE.items.length > 0)
})

test('recuerda por usuario la última novedad vista', () => {
  const storage = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  }

  try {
    const user = { id: 42 }
    assert.equal(hasSeenLatestUpdate(user), false)
    markLatestUpdateSeen(user)
    assert.equal(hasSeenLatestUpdate(user), true)
    // Otro usuario del mismo navegador todavía no la vio.
    assert.equal(hasSeenLatestUpdate({ id: 43 }), false)
  } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
})
