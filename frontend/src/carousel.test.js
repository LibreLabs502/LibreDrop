import test from 'node:test'
import assert from 'node:assert/strict'

import { carouselPage } from './carousel.js'

const products = (count) => Array.from({ length: count }, (_, index) => index)

test('con una sola foto no hay carrusel', () => {
  assert.deepEqual(carouselPage([], 0), { pageSize: 0, pageCount: 0, items: [] })
  assert.deepEqual(carouselPage(products(1), 0), { pageSize: 0, pageCount: 0, items: [] })
})

test('con dos productos se ve uno y uno, alternando', () => {
  const list = products(2)
  assert.deepEqual(carouselPage(list, 0), { pageSize: 1, pageCount: 2, items: [0] })
  assert.deepEqual(carouselPage(list, 1), { pageSize: 1, pageCount: 2, items: [1] })
  assert.deepEqual(carouselPage(list, 2), { pageSize: 1, pageCount: 2, items: [0] })
})

test('con tres productos se ven los tres en una sola tanda', () => {
  assert.deepEqual(carouselPage(products(3), 0), {
    pageSize: 3,
    pageCount: 1,
    items: [0, 1, 2],
  })
})

test('con más de tres se ven tres por tanda y se repiten para completarla', () => {
  assert.deepEqual(carouselPage(products(4), 1).items, [3, 0, 1])
  assert.deepEqual(carouselPage(products(5), 1).items, [3, 4, 0])
  assert.deepEqual(carouselPage(products(6), 1).items, [3, 4, 5])
  assert.deepEqual(carouselPage(products(7), 2).items, [6, 0, 1])
})

test('la cantidad de tandas se calcula de a tres', () => {
  for (const [count, pages] of [[3, 1], [4, 2], [5, 2], [6, 2], [7, 3]]) {
    assert.equal(carouselPage(products(count), 0).pageCount, pages, String(count))
  }
})
