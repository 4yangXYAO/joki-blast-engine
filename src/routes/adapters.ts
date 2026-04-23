import { Router, Request, Response } from 'express'
import { z } from 'zod'

export const adaptersRouter = Router()

const adapterSchema = z.object({ name: z.string().min(1) })

adaptersRouter.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Adapters (stub) route' })
})

adaptersRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = adapterSchema.parse(req.body)
    res.status(201).json({ message: 'Adapter stub created', data })
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
})
