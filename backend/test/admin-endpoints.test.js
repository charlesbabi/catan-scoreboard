import test from 'node:test'
import assert from 'node:assert/strict'
import { withServer } from './api-helper.js'

const post = (base, path, body, key) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { 'x-admin-key': key } : {}) },
    body: JSON.stringify(body),
  })

test('POST /api/admin/verify: 200 {ok:true} con clave correcta', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/admin/verify', { key: 'catan' })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { ok: true })
  })
})

test('POST /api/admin/verify: 401 con clave incorrecta', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/admin/verify', { key: 'otra' })
    assert.equal(res.status, 401)
    assert.ok(typeof (await res.json()).error === 'string')
  })
})

test('POST /api/admin/verify: 401 con key ausente o no texto', async () => {
  await withServer(async (base) => {
    for (const body of [{}, { key: 42 }, { key: null }]) {
      const res = await post(base, '/api/admin/verify', body)
      assert.equal(res.status, 401)
    }
  })
})

test('POST /api/admin/key: cambio exitoso invalida la clave vieja', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/admin/key', { currentKey: 'catan', newKey: 'clave-nueva-99' })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { ok: true })

    const oldRes = await post(base, '/api/admin/verify', { key: 'catan' })
    assert.equal(oldRes.status, 401, 'clave vieja deja de valer')
    const newRes = await post(base, '/api/admin/verify', { key: 'clave-nueva-99' })
    assert.equal(newRes.status, 200, 'clave nueva vale')
  })
})

test('POST /api/admin/key: 401 con currentKey invalida (clave no cambia)', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/admin/key', { currentKey: 'mala', newKey: 'cualquiera-1' })
    assert.equal(res.status, 401)
    const still = await post(base, '/api/admin/verify', { key: 'catan' })
    assert.equal(still.status, 200, 'la clave original sigue vigente')
  })
})

for (const [label, newKey] of [['vacia', ''], ['corta', 'abc'], ['no texto', 42]]) {
  test(`POST /api/admin/key: 400 con newKey ${label} (clave no cambia)`, async () => {
    await withServer(async (base) => {
      const res = await post(base, '/api/admin/key', { currentKey: 'catan', newKey })
      assert.equal(res.status, 400)
      assert.ok(typeof (await res.json()).error === 'string')
      const still = await post(base, '/api/admin/verify', { key: 'catan' })
      assert.equal(still.status, 200)
    })
  })
}

test('POST /api/games sin X-Admin-Key responde 401', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/games', { players: [{ name: 'A', points: 1 }] })
    assert.equal(res.status, 401)
    const games = await (await fetch(`${base}/api/games`)).json()
    assert.equal(games.length, 3, 'no se registro nada (solo el seed)')
  })
})

test('POST /api/games con clave incorrecta responde 401', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/games', { players: [{ name: 'A', points: 1 }] }, 'mala')
    assert.equal(res.status, 401)
  })
})

test('POST /api/games con clave correcta responde 201', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/games', { players: [{ name: 'A', points: 1 }] }, 'catan')
    assert.equal(res.status, 201)
    assert.equal((await res.json()).id, 4)
  })
})

test('POST /api/games: 401 de clave tiene precedencia sobre 400 de body', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/games', { players: [] }, 'mala')
    assert.equal(res.status, 401)
  })
})

test('pre-flight OPTIONS permite X-Admin-Key en Access-Control-Allow-Headers', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games`, {
      method: 'OPTIONS',
      headers: { 'access-control-request-headers': 'X-Admin-Key' },
    })
    const allowed = res.headers.get('access-control-allow-headers') ?? ''
    assert.ok(/x-admin-key/i.test(allowed), `allow-headers: ${allowed}`)
    assert.ok(/content-type/i.test(allowed), 'content-type sigue permitido')
  })
})
