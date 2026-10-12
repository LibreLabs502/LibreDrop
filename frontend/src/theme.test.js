import test from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULT_THEME, themeStyle } from './theme.js'

test('sin configuración usa el tema azul predeterminado', () => {
  const style = themeStyle(null)
  assert.equal(style['--store-primary'], DEFAULT_THEME.primary)
  assert.equal(style['--store-secondary'], DEFAULT_THEME.secondary)
  assert.equal(style['--store-bg'], DEFAULT_THEME.background)
  assert.equal(style['--store-text'], DEFAULT_THEME.text)
})

test('ignora valores inválidos y cae en el predeterminado', () => {
  const style = themeStyle({ primary: 'azul', secondary: '#12ZZ99', background: '', text: null })
  assert.equal(style['--store-primary'], DEFAULT_THEME.primary)
  assert.equal(style['--store-secondary'], DEFAULT_THEME.secondary)
  assert.equal(style['--store-bg'], DEFAULT_THEME.background)
  assert.equal(style['--store-text'], DEFAULT_THEME.text)
})

test('aplica la paleta recibida del backend', () => {
  const style = themeStyle({
    primary: '#15803D',
    secondary: '#DCFCE7',
    background: '#F4FBF6',
    text: '#14261A',
  })
  assert.equal(style['--store-primary'], '#15803D')
  assert.equal(style['--store-secondary'], '#DCFCE7')
  assert.equal(style['--store-bg'], '#F4FBF6')
})

test('elige texto legible sobre el color principal', () => {
  assert.equal(themeStyle({ primary: '#2563EB' })['--store-on-primary'], '#FFFFFF')
  assert.equal(themeStyle({ primary: '#F5E6E8' })['--store-on-primary'], '#111827')
})

test('temas distintos generan colores distintos', () => {
  const azul = themeStyle({ primary: '#2563EB' })
  const verde = themeStyle({ primary: '#15803D' })
  assert.notEqual(azul['--store-primary'], verde['--store-primary'])
  assert.notEqual(azul['--store-primary'], azul['--store-secondary'])
})
