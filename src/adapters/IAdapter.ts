export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number; // epoch ms
}

export interface IAdapter {
  // Initialize/prepare connections
  connect(): Promise<void>;
  // Send a message to a recipient (e.g., WhatsApp number)
  sendMessage(to: string, message: string): Promise<{ success: boolean; error?: string; code?: string }>;
  // Close any open resources
  disconnect(): Promise<void>;
  // Return current rate limit status (if available)
  getRateLimitStatus(): Promise<RateLimitStatus | null>;
}
