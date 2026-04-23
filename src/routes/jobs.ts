import { Router, Request, Response } from 'express'
import { z } from 'zod'

export const jobsRouter = Router()

const jobSchema = z.object({ jobName: z.string().min(1) })

jobsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Jobs (stub) route' })
})

jobsRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = jobSchema.parse(req.body)
    res.status(201).json({ message: 'Job stub created', data })
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
})
