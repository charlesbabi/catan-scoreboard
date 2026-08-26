import test from 'node:test'
import assert from 'node:assert/strict'
import { withServer } from './api-helper.js'

const post = (base, path, body, key) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { 'x-admin-key': key } : {}) },
    body: JSON.stringify(body),
  })

test('POST /api/seasons sin X-Admin-Key responde 401 y no crea nada', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/seasons', { name: 'Temporada 2026-1' })
    assert.equal(res.status, 401)
    assert.ok(typeof (await res.json()).error === 'string')
    const seasons = await (await fetch(`${base}/api/seasons`)).json()
    assert.deepEqual(seasons, [])
  })
})

test('POST /api/seasons con clave incorrecta responde 401', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/seasons', { name: 'Temporada 2026-1' }, 'mala')
    assert.equal(res.status, 401)
  })
})

test('POST /api/seasons: 401 de clave tiene precedencia sobre 400 de body', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/seasons', { name: '' }, 'mala')
    assert.equal(res.status, 401)
  })
})

test('POST /api/seasons con clave correcta responde 201 y aparece en GET /api/seasons', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/seasons', { name: 'Temporada 2026-1' }, 'catan')
    assert.equal(res.status, 201)
    const created = await res.json()
    assert.equal(created.id, 1)
    assert.equal(created.name, 'Temporada 2026-1')

    const seasons = await (await fetch(`${base}/api/seasons`)).json()
    assert.deepEqual(seasons, [{ id: 1, name: 'Temporada 2026-1' }])
  })
})

test('POST /api/seasons: 400 con name ausente, vacio, espacios o no texto', async () => {
  await withServer(async (base) => {
    for (const body of [{}, { name: '' }, { name: '   ' }, { name: 42 }, { name: null }]) {
      const res = await post(base, '/api/seasons', body, 'catan')
      assert.equal(res.status, 400, `body ${JSON.stringify(body)} debe dar 400`)
      assert.ok(typeof (await res.json()).error === 'string')
    }
    const seasons = await (await fetch(`${base}/api/seasons`)).json()
    assert.deepEqual(seasons, [], 'nada debe haberse creado')
  })
})

test('POST /api/seasons: 400 con body no JSON', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/seasons`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-key': 'catan' },
      body: 'no es json',
    })
    assert.equal(res.status, 400)
  })
})

test('GET /api/seasons responde [] sin temporadas y sin credenciales', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/seasons`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), [])
  })
})

test('GET /api/seasons devuelve las temporadas en orden de creacion (ascendente por id)', async () => {
  await withServer(async (base) => {
    for (const name of ['Primera', 'Segunda', 'Tercera']) {
      const res = await post(base, '/api/seasons', { name }, 'catan')
      assert.equal(res.status, 201)
    }
    const seasons = await (await fetch(`${base}/api/seasons`)).json()
    assert.deepEqual(seasons, [
      { id: 1, name: 'Primera' },
      { id: 2, name: 'Segunda' },
      { id: 3, name: 'Tercera' },
    ])
  })
})
