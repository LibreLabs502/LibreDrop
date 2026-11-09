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

test('respeta el orden manual de las fotos', () => {
  assert.deepEqual(
    productImages({
      image: 'portada.jpg',
      image2: 'foto2.jpg',
      image3: 'foto3.jpg',
      photo_order: ['image3', 'image', 'image2'],
    }),
    ['foto3.jpg', 'portada.jpg', 'foto2.jpg'],
  )
})

test('agrega al final las fotos que faltan en el orden guardado', () => {
  assert.deepEqual(
    productImages({
      image: 'portada.jpg',
      image2: 'foto2.jpg',
      image5: 'foto5.jpg',
      photo_order: ['image5'],
    }),
    ['foto5.jpg', 'portada.jpg', 'foto2.jpg'],
  )
})

test('ignora claves inválidas o repetidas del orden guardado', () => {
  assert.deepEqual(
    productImages({
      image: 'portada.jpg',
      image2: 'foto2.jpg',
      photo_order: ['image2', 'image2', 'otra', 'image'],
    }),
    ['foto2.jpg', 'portada.jpg'],
  )
})

test('un orden que no es lista se ignora', () => {
  assert.deepEqual(
    productImages({ image: 'portada.jpg', photo_order: 'image2' }),
    ['portada.jpg'],
  )
})
