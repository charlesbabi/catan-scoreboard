import test from 'node:test'
import assert from 'node:assert/strict'
import { withServer } from './api-helper.js'

test('GET /api/scoreboard devuelve ranking agregado ordenado', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/scoreboard`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(Array.isArray(body))
    assert.ok(body.length >= 3, 'seed must produce players')
    for (let i = 1; i < body.length; i++) {
      assert.ok(body[i - 1].totalPoints >= body[i].totalPoints, 'ordered by totalPoints desc')
    }
    for (const row of body) {
      assert.deepEqual(Object.keys(row).sort(), ['gamesPlayed', 'name', 'totalPoints', 'wins'])
    }
  })
})

test('GET /api/games devuelve partidas con id descendente', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games`)
    assert.equal(res.status, 200)
    const games = await res.json()
    const ids = games.map((g) => g.id)
    assert.deepEqual(ids, [...ids].sort((a, b) => b - a), 'descending id order')
  })
})

test('POST /api/games valida, persiste y devuelve 201 con id auto-incremental', async () => {
  await withServer(async (base) => {
    const before = (await (await fetch(`${base}/api/games`)).json()).length
    const res = await fetch(`${base}/api/games`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-key': 'catan' },
      body: JSON.stringify({ date: '2026-08-24', players: [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 5 }] }),
    })
    assert.equal(res.status, 201)
    const created = await res.json()
    assert.equal(created.id, before + 1)
    assert.equal(created.date, '2026-08-24')
    assert.deepEqual(created.players, [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 5 }])

    const games = await (await fetch(`${base}/api/games`)).json()
    assert.equal(games.length, before + 1, 'persisted')
    assert.deepEqual(games[0], created, 'newest first')
  })
})

test('POST /api/games sin date asigna fecha actual YYYY-MM-DD', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-key': 'catan' },
      body: JSON.stringify({ players: [{ name: 'Ana', points: 7 }] }),
    })
    assert.equal(res.status, 201)
    const created = await res.json()
    assert.match(created.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(created.date, new Date().toISOString().slice(0, 10))
  })
})

const invalidBodies = [
  ['players ausente', {}],
  ['players vacia', { players: [] }],
  ['points negativo', { players: [{ name: 'A', points: -3 }] }],
  ['points no numerico', { players: [{ name: 'A', points: 'diez' }] }],
  ['points ausente', { players: [{ name: 'A' }] }],
  ['name vacio', { players: [{ name: '', points: 1 }] }],
]

for (const [label, body] of invalidBodies) {
  test(`POST /api/games responde 400 con { error }: ${label}`, async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/api/games`, {
         method: 'POST',
         headers: { 'content-type': 'application/json', 'x-admin-key': 'catan' },
         body: JSON.stringify(body),
       })
       assert.equal(res.status, 400)
      const err = await res.json()
      assert.ok(typeof err.error === 'string' && err.error.length > 0)
    })
  })
}

test('POST /api/games con body no JSON responde 400', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-key': 'catan' },
      body: '{no es json',
    })
    assert.equal(res.status, 400)
    assert.ok(typeof (await res.json()).error === 'string')
  })
})

test('DELETE /api/games/:id elimina la partida con clave válida (200)', async () => {
  await withServer(async (base) => {
    const games = await (await fetch(`${base}/api/games`)).json()
    const target = games[games.length - 1]
    const res = await fetch(`${base}/api/games/${target.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': 'catan' },
    })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { ok: true })
    const after = await (await fetch(`${base}/api/games`)).json()
    assert.equal(after.length, games.length - 1, 'la partida debe quedar eliminada')
    assert.ok(!after.some((g) => g.id === target.id))
  })
})

test('DELETE /api/games/:id sin clave responde 401 y no elimina', async () => {
  await withServer(async (base) => {
    const before = (await (await fetch(`${base}/api/games`)).json()).length
    const res = await fetch(`${base}/api/games/1`, { method: 'DELETE' })
    assert.equal(res.status, 401)
    assert.ok(typeof (await res.json()).error === 'string')
    const after = await (await fetch(`${base}/api/games`)).json()
    assert.equal(after.length, before, 'no debe eliminarse nada')
  })
})

test('DELETE /api/games/:id con clave inválida responde 401 (no 404)', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games/999`, {
      method: 'DELETE',
      headers: { 'x-admin-key': 'clave-incorrecta' },
    })
    assert.equal(res.status, 401)
  })
})

test('DELETE /api/games/:id clave válida e id inexistente responde 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games/999`, {
      method: 'DELETE',
      headers: { 'x-admin-key': 'catan' },
    })
    assert.equal(res.status, 404)
    assert.ok(typeof (await res.json()).error === 'string')
  })
})

test('DELETE /api/games/:id clave válida e id no numérico responde 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games/abc`, {
      method: 'DELETE',
      headers: { 'x-admin-key': 'catan' },
    })
    assert.equal(res.status, 404)
  })
})

test('CORS: Access-Control-Allow-Methods incluye DELETE', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games/1`, {
      method: 'OPTIONS',
      headers: { 'Access-Control-Request-Method': 'DELETE', 'Access-Control-Request-Headers': 'X-Admin-Key' },
    })
    assert.equal(res.status, 204)
    assert.match(res.headers.get('access-control-allow-methods'), /DELETE/)
    assert.match(res.headers.get('access-control-allow-headers'), /X-Admin-Key/i)
  })
})
