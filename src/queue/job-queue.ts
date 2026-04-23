import { EventEmitter } from 'events';
import { PostJob, ReplyJob, Job } from '../types/jobs';
import type { IAdapter } from '../adapters/IAdapter';

// A minimal, test-friendly job queue for Task 10.
// - In-memory processing (fallback when BullMQ is unavailable)
// - Optional adapterFactory to inject mocks during tests
// - Emits 'completed' and 'failed' events with jobId and result/error

type AdapterFactory = (platform: string) => IAdapter;

export class JobQueue extends EventEmitter {
  private redisUrl?: string;
  private useBullMQ: boolean = false;
  private queueName: string = 'job-queue';
  private inMemoryQueue: Array<{ id: string; data: any; type: string }> = [];
  private inFlight: boolean = false;
  private processor?: (payload: { id: string; data: any }) => Promise<void>;
  private adapterFactory: AdapterFactory;
  public dlq: Array<{ id: string; error: any; data: any }> = [];

  constructor(opts?: { redisUrl?: string; adapterFactory?: AdapterFactory }) {
    super();
    this.redisUrl = opts?.redisUrl;
    // If BullMQ is present, we'd use it; for this exercise we also support in-memory mode.
    try {
      // Try to require BullMQ to detect availability; we don't actually instantiate in real mode here
      // to keep tests lightweight. If available, set flag to true so real path could be added later.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const BullMq = require('bullmq');
      this.useBullMQ = true;
      // We do not instantiate real BullMQ in tests to avoid Redis requirements.
    } catch {
      this.useBullMQ = false;
    }
    this.adapterFactory = opts?.adapterFactory ?? (() => {
      // Default dummy adapter to avoid runtime crashes if used in tests without DI
      // @ts-ignore
      return { sendMessage: async () => ({ success: true }), disconnect: async () => {} } as any;
    });
    // Diagnostic: queue initialized
    // eslint-disable-next-line no-console
    console.debug('[JobQueue] initialized (in-memory path).');
  }

  // Register a processor used to handle jobs from the queue
  setProcessor(fn: (payload: { id: string; data: any }) => Promise<void>) {
    this.processor = fn;
  }

  // Enqueue a PostJob
  async enqueuePostJob(job: Omit<PostJob, 'id' | 'type'> & { platform: string }): Promise<string> {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = { id, data: { ...job, type: 'PostJob' }, type: 'PostJob' } as any;
    // Diagnostic
    // eslint-disable-next-line no-console
    console.debug(`[JobQueue] Enqueue PostJob id=${id} platform=${(job as any).platform}`);
    // Always use in-memory queue for now to ensure tests run without requiring BullMQ/Redis.
    this.inMemoryQueue.push({ id, data: payload.data, type: 'PostJob' });
    // Trigger processing in-memory. If a processor is registered, run immediately to avoid race.
    console.debug(`[JobQueue] Scheduling processing for PostJob id=${id}`);
    if (this.processor) {
      this.processNext();
    } else {
      setTimeout(() => this.processNext(), 0);
    }
    return id;
  }

  // Enqueue a ReplyJob
  async enqueueReplyJob(job: Omit<ReplyJob, 'id' | 'type'> & { platform: string }): Promise<string> {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = { id, data: { ...job, type: 'ReplyJob' }, type: 'ReplyJob' } as any;
    // Diagnostic
    // eslint-disable-next-line no-console
    console.debug(`[JobQueue] Enqueue ReplyJob id=${id} platform=${(job as any).platform}`);
    // Always use in-memory queue for now
    this.inMemoryQueue.push({ id, data: payload.data, type: 'ReplyJob' });
    console.debug(`[JobQueue] Scheduling processing for ReplyJob id=${id}`);
    if (this.processor) {
      this.processNext();
    } else {
      setTimeout(() => this.processNext(), 0);
    }
    return id;
  }

  private async processNext() {
    if (this.inFlight) return;
    this.inFlight = true;
    // Diagnostic
    // eslint-disable-next-line no-console
    console.debug('[JobQueue] processNext started. Queue size:', this.inMemoryQueue.length);
    try {
      // Process all queued items in-order
      while (this.inMemoryQueue.length > 0) {
        const item = this.inMemoryQueue.shift()!;
        if (!this.processor) {
          // No processor registered; skip
          // Diagnostic
          // eslint-disable-next-line no-console
          console.warn('[JobQueue] No processor registered; skipping item', item?.id);
          continue;
        }
        try {
          await this.processor({ id: item.id, data: item.data });
          this.emit('completed', item.id, item.data);
        } catch (err: any) {
          this.dlq.push({ id: item.id, error: err, data: item.data });
          this.emit('failed', item.id, err);
        }
      }
    } finally {
      this.inFlight = false;
      // Diagnostic
      // eslint-disable-next-line no-console
      console.debug('[JobQueue] processNext finished. InFlight reset.');
    }
  }
}

export default JobQueue;
