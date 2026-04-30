import axios from "axios";
import { ThreadsAdapter } from "./threads";

jest.mock("axios");

// Helper to set required env vars for config loader
function setEnv() {
  process.env.DATABASE_PATH = ":memory:";
  process.env.API_PORT = "3000";
  process.env.API_HOST = "localhost";
  process.env.DASHBOARD_PORT = "4000";
  process.env.JWT_SECRET = "test-secret";
  process.env.LOG_LEVEL = "debug";
  process.env.WHATSAPP_CLOUD_API_TOKEN = "xw";
  process.env.TELEGRAM_BOT_TOKEN = "tok";
  process.env.TWITTER_BEARER_TOKEN = "tb";
  process.env.TWITTER_API_KEY = "tk";
  process.env.TWITTER_API_SECRET = "ts";
  process.env.THREADS_ACCESS_TOKEN = "threads-token";
}

describe("ThreadsAdapter", () => {
  let adapter: ThreadsAdapter;

  beforeAll(() => {
    setEnv();
  });

  beforeEach(() => {
    // Clear mocks between tests to avoid cross-test contamination
    jest.clearAllMocks();
    jest.resetModules();
    // Re-import after env setup to pick config
    adapter = new ThreadsAdapter({});
  });

  it("should connect using THREADS_ACCESS_TOKEN", async () => {
    const ta = adapter;
    await ta.connect();
    expect(await ta.authenticate()).toBe(true);
    expect(ta.isAuthenticated()).toBe(true);
  });

  it("should post a message", async () => {
    (axios.post as any).mockResolvedValue({ data: {} });
    const to = "12345";
    const res = await adapter.postMessage(to, "hello world");
    expect(res.success).toBe(true);
    expect((axios.post as any).mock.calls[0][0]).toContain("/publish");
    const headers = (axios.post as any).mock.calls[0][2]?.headers;
    expect(headers?.Authorization).toBe("Bearer threads-token");
  });

  it("should reply to a message", async () => {
    (axios.post as any).mockResolvedValue({ data: {} });
    const to = "98765";
    const res = await adapter.replyToMessage(to, "reply text");
    expect(res.success).toBe(true);
    expect((axios.post as any).mock.calls[0][0]).toContain("/replies");
  });

  it("should fetch message status", async () => {
    (axios.get as any).mockResolvedValue({ data: { status: "delivered" } });
    const status = await adapter.getMessageStatus("msg-1");
    expect(status?.status).toBe("delivered");
  });

  it("should list accounts", async () => {
    (axios.get as any).mockResolvedValue({ data: { data: [{ id: "acc1" }] } });
    const accounts = await adapter.listAccounts();
    expect(Array.isArray(accounts)).toBe(true);
  });
});
