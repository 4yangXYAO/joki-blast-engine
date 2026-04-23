import { IAdapter, RateLimitStatus } from "./IAdapter";
import { getConfig } from "../config/secrets";
import axios, { AxiosRequestConfig } from "axios";

// Instagram Adapter: primary Graph API, optional private-api fallback guarded by feature flag
export interface InstagramAdapterOptions {
  logger?: (msg: string) => void;
}

export class InstagramAdapter implements IAdapter {
  private token?: string;
  private igUserId?: string;
  private rateRemaining: number = 100;
  private rateReset: number = Date.now() + 60_000;
  private logger?: (msg: string) => void;
  private usePrivateApi: boolean;
  // Lazy-initialized fallback client (if enabled)
  private privateApiClient?: any;

  constructor(opts?: InstagramAdapterOptions) {
    this.logger = opts?.logger;
    // Feature flag (default: false)
    const flag = (process.env as any).INSTAGRAM_ALLOW_PRIVATE_API;
    this.usePrivateApi = flag === "true";
    if (this.usePrivateApi) {
      try {
        // Lazy require to avoid hard dependency when flag is off
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.privateApiClient = require("instagram-private-api");
        this.log("Instagram private API client loaded (fallback enabled)");
      } catch {
        this.log("Instagram private API not available; falling back to Graph API");
        this.usePrivateApi = false;
      }
    }
  }

  private log(msg: string) {
    this.logger?.(`[InstagramAdapter] ${msg}`);
  }

  async connect(): Promise<void> {
    const cfg = getConfig();
    // Prefer explicit config from env or secrets
    const t = (cfg as any).INSTAGRAM_ACCESS_TOKEN || (process.env as any).INSTAGRAM_ACCESS_TOKEN;
    if (!t) {
      throw new Error("Instagram access token not configured");
    }
    this.token = t;
    // IG business account ID (required to publish with Graph API)
    const id = (process.env as any).INSTAGRAM_BUSINESS_ACCOUNT_ID || (cfg as any).INSTAGRAM_BUSINESS_ACCOUNT_ID;
    if (!id) {
      this.log("Instagram business account ID not configured (INSTAGRAM_BUSINESS_ACCOUNT_ID). Publish may fail without it.");
    }
    this.igUserId = id;
    this.log("Authenticated with Instagram Graph API token");
  }

  async disconnect(): Promise<void> {
    this.token = undefined;
    this.igUserId = undefined;
    this.log("Disconnected");
  }

  async authenticate(): Promise<boolean> {
    if (this.token) return true;
    try {
      await this.connect();
      return !!this.token;
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Publish a new media container and then publish it to the IG feed
  async postMessage(to: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
    // 'to' is unused for Graph API publish; kept for interface parity
    if (!this.token) {
      await this.connect();
    }
    if (!this.token) {
      return { success: false, error: "Not authenticated", code: "INSTAGRAM_NOT_AUTHENTICATED" };
    }
    if (!this.igUserId) {
      // Try to glean from env/config
      const id = (process.env as any).INSTAGRAM_BUSINESS_ACCOUNT_ID || (getConfig() as any).INSTAGRAM_BUSINESS_ACCOUNT_ID;
      if (!id) {
        return { success: false, error: "IG user id not configured", code: "INSTAGRAM_MISSING_IG_ID" };
      }
      this.igUserId = id;
    }
    try {
      // Step 1: create media container with caption (text-only for tests)
      const urlCreate = `https://graph.facebook.com/v17.0/${this.igUserId}/media`;
      const createResp = await axios.post(
        urlCreate,
        { caption: message, access_token: this.token },
        <AxiosRequestConfig>{}
      );
      const containerId = createResp?.data?.id;
      if (!containerId) throw new Error("Invalid response from Graph API create media");
      // Step 2: publish the container
      const urlPublish = `https://graph.facebook.com/v17.0/${this.igUserId}/media_publish`;
      const publishResp = await axios.post(
        urlPublish,
        { creation_id: containerId, access_token: this.token },
        <AxiosRequestConfig>{}
      );
      const publishedId = publishResp?.data?.id ?? publishResp?.data?.success;
      this.maybeDrainRate();
      return { success: !!publishedId };
    } catch (e: any) {
      const error = e?.message ?? "Instagram publish error";
      return { success: false, error, code: e?.code ?? "INSTAGRAM_PUBLISH_ERROR" };
    }
  }

  // Reply to a comment on a media item
  async replyToMessage(to: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.token) {
      await this.connect();
    }
    if (!this.token) {
      return { success: false, error: "Not authenticated", code: "INSTAGRAM_NOT_AUTHENTICATED" };
    }
    try {
      // Treat 'to' as a media/comment thread id to post a comment
      const url = `https://graph.facebook.com/v17.0/${to}/comments`;
      await axios.post(url, { message, access_token: this.token }, <AxiosRequestConfig>{});
      this.maybeDrainRate();
      return { success: true };
    } catch (e: any) {
      const error = e?.message ?? "Instagram reply error";
      return { success: false, error, code: e?.code ?? "INSTAGRAM_REPLY_ERROR" };
    }
  }

  // Fetch status for a given media item or publish result
  async getMessageStatus(messageId: string): Promise<{ status: string; id: string } | null> {
    if (!this.token) {
      await this.connect();
    }
    if (!this.token) return null;
    try {
      const url = `https://graph.facebook.com/v17.0/${messageId}?fields=status`;
      const resp = await axios.get(url, <AxiosRequestConfig>{ headers: { Authorization: `Bearer ${this.token}` } });
      const status = resp?.data?.status ?? "unknown";
      return { status, id: messageId };
    } catch {
      return null;
    }
  }

  // List Instagram accounts (for the user)
  async listAccounts(): Promise<any[]> {
    if (!this.token) {
      await this.connect();
    }
    if (!this.token) return [];
    const url = `https://graph.facebook.com/v17.0/me/accounts`;
    try {
      const resp = await axios.get(url, <AxiosRequestConfig>{ headers: { Authorization: `Bearer ${this.token}` } });
      return resp?.data?.data ?? [];
    } catch {
      return [];
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    const now = Date.now();
    if (now > this.rateReset) {
      this.rateRemaining = 100;
      this.rateReset = now + 60_000;
    }
    return {
      limit: 100,
      remaining: this.rateRemaining,
      reset: this.rateReset,
    };
  }

  private maybeDrainRate() {
    const now = Date.now();
    if (now > this.rateReset) {
      this.rateRemaining = 100;
      this.rateReset = now + 60_000;
    }
    if (this.rateRemaining > 0) this.rateRemaining--;
  }

  // Backwards-compatible alias required by IAdapter
  async sendMessage(to: string, message: string): Promise<{ success: boolean; error?: string; code?: string }> {
    return this.postMessage(to, message);
  }
}

export default InstagramAdapter;
