import test from 'node:test'
import assert from 'node:assert/strict'

import { LATEST_UPDATE, UPDATES, VERSIONS_URL, hasSeenLatestUpdate, markLatestUpdateSeen } from './updates.js'

test('la última novedad tiene versión, título y contenido', () => {
  assert.ok(LATEST_UPDATE)
  assert.match(LATEST_UPDATE.version, /^v\d/)
  assert.ok(LATEST_UPDATE.title)
  assert.ok(LATEST_UPDATE.items.length > 0)
})

test('las novedades están separadas, ordenadas y sin versiones repetidas', () => {
  const versions = UPDATES.map((update) => update.version)
  assert.equal(versions[0], LATEST_UPDATE.version)
  assert.equal(new Set(versions).size, versions.length)
  for (const update of UPDATES) {
    assert.ok(update.title)
    assert.ok(update.date)
    assert.ok(update.items.length > 0)
  }
})

test('el enlace de más información apunta a VERSIONS.md en GitHub', () => {
  assert.match(VERSIONS_URL, /^https:\/\/github\.com\/LibreLabs502\/LibreDrop\/blob\/main\/VERSIONS\.md$/)
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
