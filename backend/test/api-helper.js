import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStore } from '../src/storage.js'
import { createServer } from '../src/server.js'

export async function withServer(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'scoreboard-api-'))
  const store = createStore(join(dir, 'scoreboard.json'))
  const server = createServer(store)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    await fn(base, store)
  } finally {
    server.close()
    server.closeAllConnections()
    await rm(dir, { recursive: true, force: true })
  }
}
