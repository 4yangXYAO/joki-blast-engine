// Job type definitions for the internal queue

export interface PostJob {
  id?: string;
  type?: 'PostJob';
  platform: string; // e.g., 'whatsapp', 'telegram', 'threads', 'instagram'
  to: string; // recipient identifier
  message: string;
}

export interface ReplyJob {
  id?: string;
  type?: 'ReplyJob';
  platform: string;
  chatId: string; // chat/thread id to reply to
  messageId: string; // message id to reply to
  message: string;
}

export type Job = PostJob | ReplyJob;
