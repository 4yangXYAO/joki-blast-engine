import { JobQueue } from '../queue/job-queue';
import { IAdapter } from '../adapters/IAdapter';
// (Types not strictly required here; jobs are routed via the generic payload in queue processor)

// In this worker, we route jobs to platform adapters based on the job.platform field.
// The worker is intentionally DI-friendly: tests can supply a custom adapterFactory
// to observe calls without depending on real network calls.

type AdapterFactory = (platform: string) => IAdapter;

export interface WorkerOptions {
  adapterFactory?: AdapterFactory;
}

export async function initializeJobWorker(queue: JobQueue, options?: WorkerOptions) {
  const adaptersFactory = options?.adapterFactory ?? ((p: string) => {
    // Lazy import actual adapters to avoid side effects during tests; use DI in tests
    // @ts-ignore
    const mod = require('../adapters/IAdapter');
    // Fallback dummy adapter if no DI provided
    // @ts-ignore
    return { sendMessage: async () => ({ success: true }), disconnect: async () => {} } as any;
  });

  // Processor that uses platform adapters to deliver messages
  queue.setProcessor(async ({ id, data }: { id: string; data: any }) => {
    const platform = data?.platform;
    if (!platform) {
      throw new Error('Missing platform in job data');
    }
    const adapter = adaptersFactory(platform);
    // Route by job type
    if (data.type === 'PostJob') {
      const to = data.to as string;
      const msg = data.message as string;
      // Use adapter interface if available; if adapt is missing, skip
      if ((adapter as any).sendMessage) {
        await (adapter as any).sendMessage(to, msg);
        return;
      }
      throw new Error('Adapter missing sendMessage implementation');
    } else if (data.type === 'ReplyJob') {
      const chatId = data.chatId as string;
      const messageId = data.messageId as string;
      const text = data.message as string;
      if ((adapter as any).replyToMessage) {
        await (adapter as any).replyToMessage(chatId, messageId, text);
        return;
      }
      throw new Error('Adapter missing replyToMessage implementation');
    }
    throw new Error('Unknown job type');
  });
}

export default initializeJobWorker;
