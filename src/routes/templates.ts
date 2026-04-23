import { Router, Request, Response } from 'express'
import { z } from 'zod'

export const templatesRouter = Router()

// Simple template payload schema (stub)
const templateSchema = z.object({ name: z.string().min(1) })

templatesRouter.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Templates (stub) route' })
})

templatesRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = templateSchema.parse(req.body)
    res.status(201).json({ message: 'Template stub created', data })
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
})
