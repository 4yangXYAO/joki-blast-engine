import { Router, Request, Response } from 'express'
import { z } from 'zod'

export const postsRouter = Router()

const postSchema = z.object({ title: z.string().min(1) })

postsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Posts (stub) route' })
})

postsRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = postSchema.parse(req.body)
    res.status(201).json({ message: 'Post stub created', data })
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
})
