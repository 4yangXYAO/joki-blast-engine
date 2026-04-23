import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createLogger, transports, format } from 'winston'
import { loadConfig, getConfig } from '../config/secrets'
import { accountsRouter } from '../routes/accounts'
import { templatesRouter } from '../routes/templates'
import { postsRouter } from '../routes/posts'
import { jobsRouter } from '../routes/jobs'
import { adaptersRouter } from '../routes/adapters'
import { webhooksRouter } from '../routes/webhooks'
import type { Request, Response, NextFunction } from 'express'

// Lightweight, centralized logger using Winston
const logger = createLogger({
  level: (process.env.LOG_LEVEL ?? 'info') as string,
  format: format.json(),
  transports: [new transports.Console({ format: format.simple() })],
})

export function createServer() {
  const app = express()

  // Security and basic middleware
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  // Simple request logging (Winston)
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(
      `${req.method} ${req.originalUrl} - ${req.ip}`
    )
    next()
  })

  // Health endpoint (as per plan, returns a simple status object)
  app.get('/v1/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })

  // Centralized error handler (registered later after routes)
  // Note: actual error handling middleware is attached in startServer after routes are wired up
  return app
}

/**
 * Start the API server with configuration, wiring routes and middleware.
 * - Must call loadConfig() before getConfig()
 */
export function startServer() {
  // Load and validate config, then expose the actual configured app
  loadConfig()
  const cfg = getConfig()
  const port = Number(cfg.API_PORT) || 3000

  const app = createServer()

  // Wire routes
  app.use('/v1/accounts', accountsRouter)
  app.use('/v1/templates', templatesRouter)
  app.use('/v1/posts', postsRouter)
  app.use('/v1/jobs', jobsRouter)
  app.use('/v1/adapters', adaptersRouter)
  app.use('/v1/webhooks', webhooksRouter)

  // Centralized error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err?.message ?? 'Unhandled error')
    res.status(500).json({ error: err?.message ?? 'Internal Server Error' })
  })

  const server = app.listen(port, () => {
    logger.info(`API server listening on port ${port}`)
  })
  return server
}
