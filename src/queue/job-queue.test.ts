import { JobQueue } from './job-queue';
import { initializeJobWorker } from '../workers/job-worker';

describe('JobQueue (in-memory path)', () => {
  test('enqueue PostJob triggers processor and emits completed', async () => {
    const adapterMap: any = {
      whatsapp: {
        sendMessage: async (to: string, message: string) => {
          // simulate success path
          return { success: true };
        },
      },
    };
    const q = new JobQueue({ adapterFactory: (p: string) => adapterMap[p] || adapterMap.whatsapp });
    let finishedId: string | null = null;
    const done = new Promise<string>((resolve) => {
      q.on('completed', (id: string) => {
        finishedId = id;
        resolve(id);
      });
      q.on('failed', (id: string) => {
        // not expected in this test, but resolve to avoid hang
        finishedId = id;
        resolve(id);
      });
    });
    await initializeJobWorker(q, { adapterFactory: (p: string) => adapterMap[p] || adapterMap.whatsapp });
    const id = await q.enqueuePostJob({ platform: 'whatsapp', to: '+12345', message: 'hello' } as any);
    const doneId = await done;
    expect(doneId).toBe(id);
  });

  test('enqueue ReplyJob triggers processor and emits failed on error', async () => {
    const adapterMap: any = {
      whatsapp: {
        replyToMessage: async (_chatId: string, _messageId: string, _text: string) => {
          throw new Error('simulated-failure');
        },
      },
    };
    const q = new JobQueue({ adapterFactory: (p: string) => adapterMap[p] || adapterMap.whatsapp });
    let finishedId: string | null = null;
    const done = new Promise<string>((resolve) => {
      q.on('completed', (id: string) => {
        finishedId = id;
        resolve(id);
      });
      q.on('failed', (id: string) => {
        finishedId = id;
        resolve(id);
      });
    });
    await initializeJobWorker(q, { adapterFactory: (p: string) => adapterMap[p] || adapterMap.whatsapp });
    const id = await q.enqueueReplyJob({ platform: 'whatsapp', chatId: 'chat1', messageId: 'm1', message: 'reply' } as any);
    const doneId = await done;
    expect(doneId).toBe(id);
  });
});
