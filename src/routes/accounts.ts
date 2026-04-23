import { Router, Request, Response } from 'express'
import { z } from 'zod'

export const accountsRouter = Router()

// Simple schema for account creation (stub)
const createAccountSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

accountsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Accounts (stub) route' })
})

accountsRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = createAccountSchema.parse(req.body)
    // Stub: pretend we created an account
    res.status(201).json({ message: 'Account stub created', data })
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
})
