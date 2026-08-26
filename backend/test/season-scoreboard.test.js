import test from 'node:test'
import assert from 'node:assert/strict'
import { withServer } from './api-helper.js'

const post = (base, path, body, key) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { 'x-admin-key': key } : {}) },
    body: JSON.stringify(body),
  })

async function makeSeasons(base, n) {
  const ids = []
  for (let i = 1; i <= n; i++) {
    const res = await post(base, '/api/seasons', { name: `Temporada ${i}` }, 'catan')
    assert.equal(res.status, 201)
    ids.push((await res.json()).id)
  }
  return ids
}

test('GET /api/scoreboard?season=<id> devuelve solo el ranking de esa temporada', async () => {
  await withServer(async (base) => {
    const [s1, s2] = await makeSeasons(base, 2)
    await post(base, '/api/games', { date: '2026-08-01', seasonId: s1, players: [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 5 }] }, 'catan')
    await post(base, '/api/games', { date: '2026-08-08', seasonId: s2, players: [{ name: 'Beto', points: 10 }, { name: 'Ana', points: 3 }] }, 'catan')

    const r1 = await (await fetch(`${base}/api/scoreboard?season=${s1}`)).json()
    assert.deepEqual(r1, [
      { name: 'Ana', totalPoints: 10, gamesPlayed: 1, wins: 1 },
      { name: 'Beto', totalPoints: 5, gamesPlayed: 1, wins: 0 },
    ])

    const r2 = await (await fetch(`${base}/api/scoreboard?season=${s2}`)).json()
    assert.deepEqual(r2, [
      { name: 'Beto', totalPoints: 10, gamesPlayed: 1, wins: 1 },
      { name: 'Ana', totalPoints: 3, gamesPlayed: 1, wins: 0 },
    ])
  }, { seed: false })
})

test('GET /api/games?season=<id> devuelve solo las partidas de esa temporada en orden descendente', async () => {
  await withServer(async (base) => {
    const [s1, s2] = await makeSeasons(base, 2)
    const g1 = await (await post(base, '/api/games', { date: '2026-08-01', seasonId: s1, players: [{ name: 'A', points: 1 }] }, 'catan')).json()
    const g2 = await (await post(base, '/api/games', { date: '2026-08-02', seasonId: s1, players: [{ name: 'A', points: 2 }] }, 'catan')).json()
    const g3 = await (await post(base, '/api/games', { date: '2026-08-03', seasonId: s2, players: [{ name: 'B', points: 3 }] }, 'catan')).json()

    const r1 = await (await fetch(`${base}/api/games?season=${s1}`)).json()
    assert.deepEqual(r1.map((g) => g.id), [g2.id, g1.id])
    assert.equal(r1[0].seasonId, s1)

    const r2 = await (await fetch(`${base}/api/games?season=${s2}`)).json()
    assert.deepEqual(r2.map((g) => g.id), [g3.id])
  }, { seed: false })
})

test('sin param season y con temporadas se usa la mas reciente; sin temporadas se devuelve todo', async () => {
  await withServer(async (base) => {
    const [s1, s2] = await makeSeasons(base, 2)
    await post(base, '/api/games', { date: '2026-08-01', seasonId: s1, players: [{ name: 'Ana', points: 10 }] }, 'catan')
    await post(base, '/api/games', { date: '2026-08-02', seasonId: s2, players: [{ name: 'Beto', points: 10 }] }, 'catan')

    const def = await (await fetch(`${base}/api/scoreboard`)).json()
    assert.deepEqual(def, [{ name: 'Beto', totalPoints: 10, gamesPlayed: 1, wins: 1 }])

    const defGames = await (await fetch(`${base}/api/games`)).json()
    assert.equal(defGames.length, 1)
    assert.equal(defGames[0].seasonId, s2)
  }, { seed: false })

  await withServer(async (base) => {
    const sb = await (await fetch(`${base}/api/scoreboard`)).json()
    assert.ok(sb.length >= 3, 'sin temporadas se agregan todas las partidas (seed)')
  })
})

test('?season invalido o inexistente responde 404 en scoreboard y games', async () => {
  await withServer(async (base) => {
    await makeSeasons(base, 1)
    for (const path of ['/api/scoreboard?season=999', '/api/scoreboard?season=abc', '/api/games?season=999', '/api/games?season=']) {
      const res = await fetch(`${base}${path}`)
      assert.equal(res.status, 404, `debe responder 404 para ${path}`)
      assert.equal(typeof (await res.json()).error, 'string', `debe incluir error para ${path}`)
    }
  })
})

test('partidas sin seasonId (seed) cuentan para la primera temporada, no para la mas reciente', async () => {
  await withServer(async (base) => {
    const [s1, s2] = await makeSeasons(base, 2)
    await post(base, '/api/games', { date: '2026-08-02', seasonId: s2, players: [{ name: 'Zoe', points: 10 }] }, 'catan')

    const r1 = await (await fetch(`${base}/api/scoreboard?season=${s1}`)).json()
    const names1 = r1.map((r) => r.name)
    assert.ok(names1.includes('Carla'), 'las partidas del seed sin temporada cuentan para la primera')
    assert.ok(!names1.includes('Zoe'))

    const r2 = await (await fetch(`${base}/api/scoreboard?season=${s2}`)).json()
    assert.deepEqual(r2, [{ name: 'Zoe', totalPoints: 10, gamesPlayed: 1, wins: 1 }])

    const def = await (await fetch(`${base}/api/scoreboard`)).json()
    assert.deepEqual(def, r2, 'el default (mas reciente) no incluye las partidas sin temporada')
  })
})

test('GET /api/games normaliza seasonId ausente a null', async () => {
  await withServer(async (base) => {
    const games = await (await fetch(`${base}/api/games`)).json()
    assert.ok(games.length >= 3, 'seed presente')
    assert.ok(games.every((g) => g.seasonId === null))
  })
})

test('POST /api/games sin seasonId y con temporadas asigna la mas reciente', async () => {
  await withServer(async (base) => {
    const [s1, s2] = await makeSeasons(base, 2)
    const res = await post(base, '/api/games', { date: '2026-08-01', players: [{ name: 'Ana', points: 10 }] }, 'catan')
    assert.equal(res.status, 201)
    const created = await res.json()
    assert.equal(created.seasonId, s2)
  }, { seed: false })
})

test('POST /api/games sin seasonId y sin temporadas asigna seasonId null', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/games', { date: '2026-08-01', players: [{ name: 'Ana', points: 10 }] }, 'catan')
    assert.equal(res.status, 201)
    assert.equal((await res.json()).seasonId, null)
  }, { seed: false })
})

test('POST /api/games con seasonId existente la asigna y la partida cuenta en esa temporada', async () => {
  await withServer(async (base) => {
    const [s1, s2] = await makeSeasons(base, 2)
    const res = await post(base, '/api/games', { date: '2026-08-01', seasonId: s1, players: [{ name: 'Zoe', points: 10 }] }, 'catan')
    assert.equal(res.status, 201)
    assert.equal((await res.json()).seasonId, s1)

    const r1 = await (await fetch(`${base}/api/scoreboard?season=${s1}`)).json()
    assert.ok(r1.some((r) => r.name === 'Zoe'))
    const r2 = await (await fetch(`${base}/api/scoreboard?season=${s2}`)).json()
    assert.ok(!r2.some((r) => r.name === 'Zoe'))
  }, { seed: false })
})

test('POST /api/games con seasonId inexistente o no numerica responde 400', async () => {
  await withServer(async (base) => {
    await makeSeasons(base, 1)
    for (const seasonId of [999, '1']) {
      const res = await post(base, '/api/games', { date: '2026-08-01', seasonId, players: [{ name: 'Ana', points: 10 }] }, 'catan')
      assert.equal(res.status, 400, `debe responder 400 para seasonId ${JSON.stringify(seasonId)}`)
      assert.equal(typeof (await res.json()).error, 'string')
    }
    const games = await (await fetch(`${base}/api/games`)).json()
    assert.equal(games.length, 0, 'no debe haberse registrado ninguna partida')
  }, { seed: false })
})

test('POST /api/games: 401 de clave tiene precedencia sobre seasonId invalida', async () => {
  await withServer(async (base) => {
    await makeSeasons(base, 1)
    const res = await post(base, '/api/games', { seasonId: 999, players: [{ name: 'Ana', points: 10 }] }, 'mala')
    assert.equal(res.status, 401)
  }, { seed: false })
})
