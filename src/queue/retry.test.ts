import { afterEach, beforeEach, vi } from 'vitest'
import { JobQueue } from './job-queue'
import { initializeJobWorker } from '../workers/job-worker'

describe('JobQueue Retry Logic', () => {
  let queue: JobQueue
  let mockAdapter: any

  beforeEach(() => {
    vi.useFakeTimers()
    mockAdapter = {
      sendMessage: jest.fn(),
      replyToMessage: jest.fn(),
    }
    const adapterFactory = () => mockAdapter
    queue = new JobQueue({ adapterFactory })
    initializeJobWorker(queue, { adapterFactory })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should retry a failed job if error is retryable', async () => {
    let callCount = 0
    mockAdapter.sendMessage.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        const err: any = new Error('Retryable error')
        err.response = { status: 500 }
        throw err
      }
      return { success: true }
    })

    const completed = new Promise<void>((resolve) => {
      queue.once('completed', () => {
        expect(callCount).toBe(2)
        resolve()
      })
    })

    queue.enqueuePostJob({
      platform: 'whatsapp',
      to: '123456',
      message: 'Test message',
      account_id: 'acc1',
    } as any)

    await vi.runAllTimersAsync()
    await completed
  })

  it('should move to DLQ after max retries', async () => {
    mockAdapter.sendMessage.mockImplementation(async () => {
      const err: any = new Error('Persistent retryable error')
      err.response = { status: 500 }
      throw err
    })

    const failed = new Promise<void>((resolve) => {
      queue.once('failed', () => {
        expect(mockAdapter.sendMessage).toHaveBeenCalledTimes(6)
        expect(queue.dlq.length).toBe(1)
        resolve()
      })
    })

    queue.enqueuePostJob({
      platform: 'whatsapp',
      to: '123456',
      message: 'Test message',
      account_id: 'acc1',
    } as any)

    await vi.runAllTimersAsync()
    await failed
  })

  it('should not retry non-retryable errors', async () => {
    mockAdapter.sendMessage.mockImplementation(async () => {
      const err: any = new Error('Non-retryable error')
      err.response = { status: 401 }
      throw err
    })

    const failed = new Promise<void>((resolve) => {
      queue.once('failed', () => {
        expect(mockAdapter.sendMessage).toHaveBeenCalledTimes(1)
        expect(queue.dlq.length).toBe(1)
        resolve()
      })
    })

    queue.enqueuePostJob({
      platform: 'whatsapp',
      to: '123456',
      message: 'Test message',
      account_id: 'acc1',
    } as any)

    await vi.runAllTimersAsync()
    await failed
  })

  it('should not retry AUTH_EXPIRED errors', async () => {
    mockAdapter.sendMessage.mockImplementation(async () => {
      const err: any = new Error('Cookie expired')
      err.code = 'AUTH_EXPIRED'
      throw err
    })

    const failed = new Promise<void>((resolve) => {
      queue.once('failed', () => {
        expect(mockAdapter.sendMessage).toHaveBeenCalledTimes(1)
        expect(queue.dlq.length).toBe(1)
        resolve()
      })
    })

    queue.enqueuePostJob({
      platform: 'whatsapp',
      to: '123456',
      message: 'Test message',
      account_id: 'acc1',
    } as any)

    await vi.runAllTimersAsync()
    await failed
  })
})
