import test from 'node:test'
import assert from 'node:assert/strict'

import { productImages } from './images.js'

test('devuelve solo las fotos cargadas, en orden', () => {
  assert.deepEqual(
    productImages({
      image: 'portada.jpg',
      image2: 'foto2.jpg',
      image3: null,
      image4: '',
      image5: 'foto5.jpg',
    }),
    ['portada.jpg', 'foto2.jpg', 'foto5.jpg'],
  )
})

test('un producto sin fotos devuelve una lista vacía', () => {
  assert.deepEqual(productImages(null), [])
  assert.deepEqual(productImages({}), [])
})
