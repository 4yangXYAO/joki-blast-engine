import dotenv from 'dotenv'
dotenv.config()

import { createServer } from './api/server'
import { logger } from './utils/logger'

const PORT = process.env.API_PORT || '3000'

async function main() {
  const app = createServer()
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
