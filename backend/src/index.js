import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStore } from './storage.js'
import { createServer } from './server.js'

const dataFile = process.env.DATA_FILE ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'scoreboard.json')
const store = createStore(dataFile)
const port = Number(process.env.PORT ?? 3001)

createServer(store).listen(port, () => {
  console.log(`Catan scoreboard API listening on :${port}`)
})
