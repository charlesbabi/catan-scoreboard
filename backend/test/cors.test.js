import test from 'node:test'
import assert from 'node:assert/strict'
import { withServer } from './api-helper.js'

test('endpoints funcionan sin headers de autenticacion', async () => {
  await withServer(async (base) => {
    for (const [method, path, body] of [
      ['GET', '/api/scoreboard', null],
      ['GET', '/api/games', null],
    ]) {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: body ? { 'content-type': 'application/json' } : {},
        body,
      })
      assert.equal(res.status, method === 'POST' ? 201 : 200, `${method} ${path} must work without auth`)
    }
  })
})

test('respuestas GET incluyen Access-Control-Allow-Origin: *', async () => {
  await withServer(async (base) => {
    for (const path of ['/api/scoreboard', '/api/games']) {
      const res = await fetch(`${base}${path}`)
      assert.equal(res.headers.get('access-control-allow-origin'), '*')
    }
  })
})

test('POST incluye Access-Control-Allow-Origin: *', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ players: [{ name: 'Zoe', points: 10 }] }),
    })
    assert.equal(res.headers.get('access-control-allow-origin'), '*')
  })
})

test('pre-flight OPTIONS responde con headers CORS permitidos', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/games`, { method: 'OPTIONS' })
    assert.ok(res.status === 200 || res.status === 204)
    assert.equal(res.headers.get('access-control-allow-origin'), '*')
    const methods = (res.headers.get('access-control-allow-methods') ?? '').split(',').map((s) => s.trim().toUpperCase())
    assert.ok(methods.includes('GET') && methods.includes('POST'), `methods: ${methods}`)
    assert.ok((res.headers.get('access-control-allow-headers') ?? '').toLowerCase().includes('content-type'))
  })
})
